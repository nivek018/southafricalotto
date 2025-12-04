import axios from "axios";
import * as cheerio from "cheerio";
import type { InsertLotteryResult } from "@shared/schema";
import { getGroupForSlug, canonicalSlug } from "@shared/schema";
import { scrape as logScrape, error as logError, info as logInfo } from "./logger";
import { storage } from "./storage";
import { purgeCloudflareSite } from "./cloudflare";

interface GameConfig {
  slug: string;
  name: string;
  numberCount: number;
  hasBonus: boolean;
  path: string;
  topPrizeLabel: RegExp;
}

interface ScrapedResult extends InsertLotteryResult {
  winner?: number | null;
}

const GAME_CONFIGS: GameConfig[] = [
  { slug: "powerball", name: "Powerball", numberCount: 5, hasBonus: true, path: "powerball", topPrizeLabel: /5\s*correct\s*\+\s*PB/i },
  { slug: "powerball-plus", name: "Powerball Plus", numberCount: 5, hasBonus: true, path: "powerball-plus", topPrizeLabel: /5\s*correct\s*\+\s*PB/i },
  { slug: "lotto", name: "Lotto", numberCount: 6, hasBonus: true, path: "lotto", topPrizeLabel: /6\s*correct/i },
  { slug: "lotto-plus-1", name: "Lotto Plus 1", numberCount: 6, hasBonus: true, path: "lotto-plus", topPrizeLabel: /6\s*correct/i },
  { slug: "lotto-plus-2", name: "Lotto Plus 2", numberCount: 6, hasBonus: true, path: "lotto-plus-2", topPrizeLabel: /6\s*correct/i },
  { slug: "daily-lotto", name: "Daily Lotto", numberCount: 5, hasBonus: false, path: "daily-lotto", topPrizeLabel: /5\s*correct/i },
  { slug: "daily-lotto-plus", name: "Daily Lotto Plus", numberCount: 5, hasBonus: false, path: "daily-lotto-plus", topPrizeLabel: /5\s*correct/i },
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
];

const ACCEPT_LANGUAGES = [
  "en-US,en;q=0.9",
  "en-GB,en;q=0.9,en-US;q=0.8",
  "en-ZA,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
];

const politeDelay = (minMs: number, maxMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, Math.floor(minMs + Math.random() * (maxMs - minMs))));

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const getRandomHeaders = (): Record<string, string> => ({
  "User-Agent": getRandomItem(USER_AGENTS),
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": getRandomItem(ACCEPT_LANGUAGES),
  "Accept-Encoding": "gzip, deflate, br",
  "DNT": "1",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Cache-Control": "max-age=0",
});

const sortNumbers = (numbers: number[]): number[] => [...numbers].sort((a, b) => a - b);

const formatSastDateString = (base?: Date): string => {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(base ?? new Date());
};

const formatDateForUrl = (dateIso: string): string => {
  const date = new Date(dateIso + "T00:00:00Z");
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Johannesburg",
    day: "numeric", // no leading zero
    month: "short",
    year: "numeric",
  });
  return fmt.format(date).replace(/ /g, "-").toLowerCase();
};

const DRAW_DAYS: Record<string, Set<number>> = {
  "powerball": new Set([2, 5]), // Tue, Fri
  "powerball-plus": new Set([2, 5]),
  "lotto": new Set([3, 6]), // Wed, Sat
  "lotto-plus-1": new Set([3, 6]),
  "lotto-plus-2": new Set([3, 6]),
  "daily-lotto": new Set([0, 1, 2, 3, 4, 5, 6]),
  "daily-lotto-plus": new Set([0, 1, 2, 3, 4, 5, 6]),
};

const isDrawDayForDate = (slug: string, targetIso: string): boolean => {
  const set = DRAW_DAYS[slug];
  if (!set) return true;
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
  }).format(new Date(targetIso + "T00:00:00Z"));
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayNum = map[weekday] ?? 0;
  return set.has(dayNum);
};

const parseWinningNumbers = ($: cheerio.CheerioAPI, config: GameConfig): { main: number[]; bonus: number | null } | null => {
  const block = $("div.results").first();
  const mainNums: number[] = [];
  block.find("span.ball, span.ballr, span.ball2").each((_i, el) => {
    const num = parseInt($(el).text().trim(), 10);
    if (!Number.isNaN(num)) mainNums.push(num);
  });
  const bonusEl = block.find("span.bonusball, span.bonusball2").first();
  const bonus = bonusEl.length ? parseInt(bonusEl.text().trim(), 10) : null;

  if (mainNums.length !== config.numberCount) {
    logScrape(`[Scrape] ${config.name}: expected ${config.numberCount} numbers, got ${mainNums.length}`);
    return null;
  }
  return { main: sortNumbers(mainNums), bonus: config.hasBonus ? bonus : null };
};

const parseJackpotAndWinners = ($: cheerio.CheerioAPI, config: GameConfig): { jackpot: string | null; winner: number | null } => {
  let jackpot: string | null = null;
  let winner: number | null = null;

  $("table.tablep tr").each((_i, row) => {
    const tds = $(row).find("td");
    if (tds.length < 3) return;
    const label = $(tds[0]).text().trim();
    if (!config.topPrizeLabel.test(label)) return;
    const winnersText = $(tds[1]).text().trim().replace(/,/g, "");
    const payoutText = $(tds[2]).text().trim();
    const winnersNum = parseInt(winnersText, 10);
    winner = Number.isNaN(winnersNum) ? null : winnersNum;
    jackpot = /rollover/i.test(payoutText) ? null : (payoutText || jackpot);
  });

  const rolloverLi = $('ul li:contains("Rollover Value")').first().text().match(/Rollover Value:\s*(.+)/i);
  const nextJackpotLi = $('ul li:contains("Next Jackpot")').first().text().match(/Next Jackpot:\s*(.+)/i);
  jackpot = jackpot || rolloverLi?.[1]?.trim() || nextJackpotLi?.[1]?.trim() || null;

  return { jackpot, winner };
};

const fetchGameResult = async (config: GameConfig, targetDateIso: string): Promise<ScrapedResult | null> => {
  const headers = getRandomHeaders();
  const dateSlug = formatDateForUrl(targetDateIso);
  const url = `https://www.africanlottery.net/${config.path}/results/${dateSlug}/`;
  logScrape(`[Scrape] Fetching ${config.name} at ${url}`);

  try {
    const response = await axios.get(url, { headers, timeout: 30000, validateStatus: () => true });
    if (response.status >= 400) {
      logScrape(`[Scrape] ${config.name} returned status ${response.status}`);
      return null;
    }

    const $ = cheerio.load(response.data);
    const nums = parseWinningNumbers($, config);
    if (!nums) return null;
    const { jackpot, winner } = parseJackpotAndWinners($, config);

    return {
      gameId: config.slug,
      gameName: config.name,
      gameSlug: config.slug,
      winningNumbers: nums.main,
      bonusNumber: nums.bonus,
      drawDate: targetDateIso,
      jackpotAmount: jackpot || null,
      nextJackpot: null,
      winner: typeof winner === "number" ? winner : null,
    };
  } catch (err) {
    logError(`[Scrape] ${config.name} fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
};

export async function scrapeLotteryResults(
  retries: number = 1,
  _delayMs: number = 0,
  options?: { targetDate?: string; gameSlugs?: string[] }
): Promise<InsertLotteryResult[]> {
  let lastError: Error | null = null;
  const targetDate = options?.targetDate || formatSastDateString();
  const allowed = options?.gameSlugs ? new Set(options.gameSlugs) : null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const results: InsertLotteryResult[] = [];
      for (let i = 0; i < GAME_CONFIGS.length; i++) {
        const cfg = GAME_CONFIGS[i];
        if (allowed && !allowed.has(cfg.slug)) continue;
        if (!isDrawDayForDate(cfg.slug, targetDate)) continue;
        const res = await fetchGameResult(cfg, targetDate);
        if (res) results.push(res);
        if (i < GAME_CONFIGS.length - 1) {
          await politeDelay(5000, 15000);
        }
      }

      if (results.length > 0) {
        logScrape(`[Scrape] Completed with ${results.length} results for ${targetDate}`);
        return results;
      }

      if (attempt < retries) {
        logScrape(`[Scrape] No results found, retrying attempt ${attempt + 1} after 10 seconds`);
        await politeDelay(10000, 12000);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logError(`Scraping attempt ${attempt} failed: ${lastError.message}`);
      if (attempt < retries) {
        await politeDelay(10000, 12000);
      }
    }
  }

  if (lastError) {
    logError(`All scraping attempts failed: ${lastError.message}`);
  }
  return [];
}

export async function scrapeDateRange(startDate: string, endDate: string, gameSlugs?: string[]): Promise<InsertLotteryResult[]> {
  const results: InsertLotteryResult[] = [];
  const parseYmd = (s: string) => {
    const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  };
  const start = parseYmd(startDate);
  const end = parseYmd(endDate);
  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = formatSastDateString(new Date(d));
    const dayResults = await scrapeLotteryResults(1, 0, { targetDate: iso, gameSlugs });
    results.push(...dayResults);
    await politeDelay(2000, 5000);
  }
  return results;
}

export async function processScrapedResults(scrapedResults: InsertLotteryResult[]) {
  let addedCount = 0;
  const addedResults: any[] = [];
  const skippedResults: any[] = [];

  for (const result of scrapedResults) {
    const existingResults = await storage.getResultsByGameSlug(result.gameSlug);
    const exists = existingResults.some(
      r => r.drawDate === result.drawDate && r.gameSlug === result.gameSlug
    );

    if (!exists) {
      await storage.createResult(result);
      addedCount++;
      addedResults.push({
        game: result.gameName,
        numbers: result.winningNumbers.join(', '),
        bonus: result.bonusNumber,
        date: result.drawDate
      });
      logScrape(`[Cron] Added new result for ${result.gameName}`);
    } else {
      skippedResults.push({
        game: result.gameName,
        numbers: result.winningNumbers.join(', '),
        bonus: result.bonusNumber,
        date: result.drawDate,
        reason: "Already exists"
      });
      logScrape(`[Cron] Skipped ${result.gameName} - already exists for ${result.drawDate}`);
    }
  }

  return { addedCount, addedResults, skippedResults };
}

let cronTimer: NodeJS.Timeout | null = null;
let isCronRunning = false;
const gameRunState: Record<string, { lastRunDate: string | null; nextRetryAt: number | null; retryDeadline: number | null }> = {};

const SAST_TZ = "Africa/Johannesburg";
const pad2 = (n: number) => n.toString().padStart(2, "0");

function getSastContext(base?: Date): { date: string; time: string; weekday: string; sastMs: number } {
  const ref = base ?? new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: SAST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "long",
  });
  const parts = fmt.formatToParts(ref);
  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? "0";
  const date = `${pick("year")}-${pick("month")}-${pick("day")}`;
  const time = `${pick("hour")}:${pick("minute")}:${pick("second")}`;
  const weekday = pick("weekday");
  const sastMs = Date.parse(`${date}T${time}+02:00`); // SAST is always UTC+2, no DST
  return { date, time, weekday, sastMs };
}

function isDrawDay(gameDrawDays: string[] | null | undefined, sastWeekday: string): boolean {
  if (!gameDrawDays || gameDrawDays.length === 0) return false;
  const normalized = gameDrawDays.map(d => d.trim().toLowerCase());
  if (normalized.some(d => d === "daily" || d === "everyday")) return true;
  return normalized.includes(sastWeekday.trim().toLowerCase());
}

function parseScheduleTime(timeStr: string | null | undefined): { hours: number; minutes: number } | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(part => parseInt(part, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { hours: h, minutes: m };
}

function buildPurgePaths(results: InsertLotteryResult[]): string[] {
  const paths = new Set<string>();
  results.forEach((r) => {
    const canonical = canonicalSlug(r.gameSlug);
    const groupInfo = getGroupForSlug(canonical);
    const groupSlug = groupInfo?.groupSlug || canonical;
    paths.add(`/game/${canonical}`);
    paths.add(`/draw-history/${groupSlug}`);
    paths.add(`/${groupSlug}-result/${r.drawDate}`);
    if (groupSlug === "powerball") {
      paths.add("/powerball-result/yesterday");
    }
    if (groupSlug === "lotto") {
      paths.add("/lotto-result/yesterday");
    }
    if (groupSlug === "daily-lotto") {
      paths.add("/daily-lotto-result/yesterday");
    }
  });
  paths.add("/");
  paths.add("/game/jackpot");
  paths.add("/sitemap.xml");
  paths.add("/lotto-result/today");
  return Array.from(paths);
}

const runForGame = async (gameSlug: string, trigger: string, todayStr: string, nowMs: number) => {
  if (isCronRunning) {
    logScrape(`[Cron] Skip ${trigger} for ${gameSlug} - scraper already running`);
    return;
  }
  isCronRunning = true;
  try {
    logInfo(`[Cron] Automatic scrape started for ${gameSlug} (${trigger})`);
    const scrapedResults = await scrapeLotteryResults(1, 0, { gameSlugs: [gameSlug] });
    const { addedCount } = await processScrapedResults(scrapedResults);
    if (scrapedResults.length > 0) {
      const paths = buildPurgePaths(scrapedResults);
      logInfo("[Cron] Scrape finished, triggering Cloudflare purge", { gameSlug, trigger, paths });
      void purgeCloudflareSite(paths);
    }
    const timestamp = new Date().toISOString();
    await storage.updateScraperLastRun(timestamp);

    const hasResultForGame = scrapedResults.some(r => r.gameSlug === gameSlug);
    if (hasResultForGame) {
      gameRunState[gameSlug] = { lastRunDate: todayStr, nextRetryAt: null, retryDeadline: null };
    } else {
      const state = gameRunState[gameSlug] || { lastRunDate: null, nextRetryAt: null, retryDeadline: null };
      const nextRetry = nowMs + 5 * 60 * 1000; // retry after 5 minutes (SAST-based clock)
      const deadline = state.retryDeadline ?? nowMs + 5 * 60 * 60 * 1000; // retry window up to 5 hours
      gameRunState[gameSlug] = { lastRunDate: state.lastRunDate, nextRetryAt: nextRetry, retryDeadline: deadline };
      logInfo(`[Cron] No results yet for ${gameSlug}, will retry after 5 minutes (until ${new Date(deadline).toISOString()})`);
    }

    logInfo(`[Cron] Automatic scrape complete: scraped ${scrapedResults.length}, added ${addedCount}`);
  } catch (error) {
    logError(`[Cron] Automatic scrape failed for ${gameSlug}: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    isCronRunning = false;
  }
};

export async function runCronTick(simulatedNow?: Date): Promise<void> {
  const settings = await storage.getScraperSettings();
  const games = await storage.getGames();
  const base = simulatedNow ?? new Date();
  const { date: todayStr, weekday: sastWeekday } = getSastContext(base);
  const nowMs = simulatedNow ? simulatedNow.getTime() : Date.now();

  for (const setting of settings) {
    if (setting.isEnabled === false) continue;
    const game = games.find(g => g.slug === setting.gameSlug);
    if (!game) continue;

    const drawDays = Array.isArray(game.drawDays)
      ? game.drawDays
      : (typeof (game.drawDays as any) === "string"
        ? (() => { try { return JSON.parse(game.drawDays as any); } catch { return []; } })()
        : []);
    if (!isDrawDay(drawDays, sastWeekday)) {
      gameRunState[game.slug] = { lastRunDate: gameRunState[game.slug]?.lastRunDate ?? null, nextRetryAt: null, retryDeadline: null };
      continue;
    }

    const timeParts = parseScheduleTime(setting.scheduleTime || "21:30");
    if (!timeParts) continue;

    const scheduledMs = Date.parse(`${todayStr}T${pad2(timeParts.hours)}:${pad2(timeParts.minutes)}:00+02:00`);
    if (!Number.isFinite(scheduledMs)) continue;

    if (nowMs < scheduledMs) continue;

    const state = gameRunState[game.slug] || { lastRunDate: null, nextRetryAt: null, retryDeadline: null };
    if (state.lastRunDate === todayStr) continue;

    const deadline = state.retryDeadline ?? (scheduledMs + 5 * 60 * 60 * 1000);
    if (nowMs > deadline) continue;

    const nextAllowed = state.nextRetryAt ?? scheduledMs;
    if (nowMs < nextAllowed) continue;

    await runForGame(game.slug, "scheduled", todayStr, nowMs);
  }
}

export function startScraperCron(): void {
  if (cronTimer) return;

  const intervalMs = 60 * 1000; // check every minute

  cronTimer = setInterval(() => {
    void runCronTick();
  }, intervalMs);

  void runCronTick();
}

export async function testScraper(): Promise<{
  success: boolean;
  message: string;
  count: number;
  results?: InsertLotteryResult[];
}> {
  try {
    logInfo("Testing scraper connection...");
    const results = await scrapeLotteryResults(1, 0);
    logInfo(`Scraper test successful: ${results.length} results found`);

    results.forEach(r => {
      logInfo(`  - ${r.gameName}: ${r.winningNumbers.join(', ')}${r.bonusNumber ? ` + ${r.bonusNumber}` : ''} (${r.drawDate})`);
    });

    return {
      success: true,
      message: `Successfully scraped ${results.length} lottery results`,
      count: results.length,
      results,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
    logError(`Scraper test failed: ${errorMsg}`);
    return {
      success: false,
      message: errorMsg,
      count: 0,
    };
  }
}
