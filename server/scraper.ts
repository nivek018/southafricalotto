import axios from "axios";
import * as cheerio from "cheerio";
import type { InsertLotteryResult } from "@shared/schema";
import { scrape as logScrape, error as logError, info as logInfo } from "./logger";

interface ScrapedResult {
  gameName: string;
  gameSlug: string;
  winningNumbers: number[];
  bonusNumber: number | null;
  drawDate: string;
  nextJackpot: string | null;
  hotNumber: number | null;
  coldNumber: number | null;
}

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

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomHeaders(): Record<string, string> {
  return {
    "User-Agent": getRandomItem(USER_AGENTS),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": getRandomItem(ACCEPT_LANGUAGES),
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
  };
}

function sortNumbers(numbers: number[]): number[] {
  return [...numbers].sort((a, b) => a - b);
}

function splitConcatenatedNumbers(numString: string, count: number): number[] {
  const numbers: number[] = [];
  const cleanString = numString.replace(/\D/g, '');

  for (let i = 0; i < cleanString.length && numbers.length < count; i += 2) {
    const num = parseInt(cleanString.substring(i, i + 2), 10);
    if (!isNaN(num) && num > 0) {
      numbers.push(num);
    }
  }

  return numbers;
}

interface GameConfig {
  slug: string;
  name: string;
  numberCount: number;
  hasBonus: boolean;
  headingPattern: RegExp;
}

const GAME_CONFIGS: GameConfig[] = [
  { slug: "powerball", name: "Powerball", numberCount: 5, hasBonus: true, headingPattern: /Powerball results/i },
  { slug: "powerball-plus", name: "Powerball Plus", numberCount: 5, hasBonus: true, headingPattern: /Powerball Plus results/i },
  { slug: "lotto", name: "Lotto", numberCount: 6, hasBonus: true, headingPattern: /^Lotto results/i },
  { slug: "lotto-plus-1", name: "Lotto Plus 1", numberCount: 6, hasBonus: true, headingPattern: /Lotto Plus 1 results/i },
  { slug: "lotto-plus-2", name: "Lotto Plus 2", numberCount: 6, hasBonus: true, headingPattern: /Lotto Plus 2 results/i },
  { slug: "daily-lotto", name: "Daily Lotto", numberCount: 5, hasBonus: false, headingPattern: /^Daily Lotto results/i },
  { slug: "daily-lotto-plus", name: "Daily Lotto Plus", numberCount: 5, hasBonus: false, headingPattern: /Daily Lotto Plus results/i },
];

function parseGameSection(sectionText: string, config: GameConfig): ScrapedResult | null {
  logScrape(`Parsing section for ${config.name}...`);
  logScrape(`Section text preview: ${sectionText.substring(0, 200)}...`);

  const lines = sectionText.split('\n').map(l => l.trim()).filter(l => l);

  const winningNumbers: number[] = [];
  let bonusNumber: number | null = null;
  let drawDate = '';
  let hotNumber: number | null = null;
  let coldNumber: number | null = null;
  let nextJackpot: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const singleNumberMatch = line.match(/^(\d{2})$/);
    if (singleNumberMatch && winningNumbers.length < config.numberCount) {
      const num = parseInt(singleNumberMatch[1], 10);
      if (num > 0) {
        winningNumbers.push(num);
        logScrape(`Found number ${winningNumbers.length}: ${num}`);
      }
      continue;
    }

    const bonusMatch = line.match(/^\+\s*(\d{1,2})$/);
    if (bonusMatch) {
      bonusNumber = parseInt(bonusMatch[1], 10);
      logScrape(`Found bonus number: ${bonusNumber}`);
      continue;
    }

    const backslashBonusMatch = line.match(/^\\?\+\s*(\d{1,2})$/);
    if (backslashBonusMatch) {
      bonusNumber = parseInt(backslashBonusMatch[1], 10);
      logScrape(`Found bonus number (backslash format): ${bonusNumber}`);
      continue;
    }

    const dateMatch = line.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      drawDate = dateMatch[1];
      logScrape(`Found draw date: ${drawDate}`);
      continue;
    }

    const hotMatch = line.match(/Hot Number:\s*(\d{1,2})/i);
    if (hotMatch) {
      hotNumber = parseInt(hotMatch[1], 10);
      logScrape(`Found hot number: ${hotNumber}`);
      continue;
    }

    const coldMatch = line.match(/Cold Number:\s*(\d{1,2})/i);
    if (coldMatch) {
      coldNumber = parseInt(coldMatch[1], 10);
      logScrape(`Found cold number: ${coldNumber}`);
      continue;
    }

    const jackpotMatch = line.match(/Estimated Jackpot[^:]*:\s*(R[\d,]+)/i);
    if (jackpotMatch) {
      nextJackpot = jackpotMatch[1];
      logScrape(`Found jackpot: ${nextJackpot}`);
      continue;
    }

    const nextDrawJackpotMatch = line.match(/next draw:\s*(R[\d,]+)/i);
    if (nextDrawJackpotMatch) {
      nextJackpot = nextDrawJackpotMatch[1];
      logScrape(`Found next draw jackpot: ${nextJackpot}`);
      continue;
    }
  }

  if (winningNumbers.length !== config.numberCount) {
    logScrape(`Expected ${config.numberCount} numbers for ${config.name}, got ${winningNumbers.length}: [${winningNumbers.join(', ')}]`);
    return null;
  }

  if (!drawDate) {
    drawDate = new Date().toISOString().split('T')[0];
    logScrape(`No date found, using today: ${drawDate}`);
  }

  const sortedNumbers = sortNumbers(winningNumbers);

  logScrape(`Successfully parsed ${config.name}: ${sortedNumbers.join(', ')}${bonusNumber ? ` + ${bonusNumber}` : ''} on ${drawDate}`);

  return {
    gameName: config.name,
    gameSlug: config.slug,
    winningNumbers: sortedNumbers,
    bonusNumber: config.hasBonus ? bonusNumber : null,
    drawDate,
    nextJackpot,
    hotNumber,
    coldNumber,
  };
}

export async function scrapeLotteryResults(
  retries: number = 3,
  delayMs: number = 5000
): Promise<InsertLotteryResult[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logScrape(`Starting scrape attempt ${attempt} of ${retries}`);

      const headers = getRandomHeaders();
      logScrape(`Using User-Agent: ${headers["User-Agent"].substring(0, 50)}...`);

      const response = await axios.get("https://www.africanlottery.net/", {
        headers,
        timeout: 30000,
      });

      logScrape(`Response received, status: ${response.status}, content length: ${response.data.length}`);

      const $ = cheerio.load(response.data);
      const results: InsertLotteryResult[] = [];

      const fullText = $('body').text();

      for (const config of GAME_CONFIGS) {
        logScrape(`Looking for ${config.name}...`);

        let sectionFound = false;

        $('h2').each((_, h2Element) => {
          const headingText = $(h2Element).text().trim();

          if (config.headingPattern.test(headingText)) {
            logScrape(`Found heading: "${headingText}" for ${config.name}`);
            sectionFound = true;

            let sectionContent = '';
            let currentElement = $(h2Element).parent();

            const nearbyElements: string[] = [];

            let sibling = $(h2Element).next();
            for (let j = 0; j < 15 && sibling.length; j++) {
              nearbyElements.push(sibling.text().trim());
              sibling = sibling.next();
            }

            const parentText = currentElement.text();
            sectionContent = parentText;

            if (sectionContent.length < 50) {
              sectionContent = nearbyElements.join('\n');
            }

            const parsed = parseGameSection(sectionContent, config);

            if (parsed) {
              results.push({
                gameId: config.slug,
                gameName: parsed.gameName,
                gameSlug: parsed.gameSlug,
                winningNumbers: parsed.winningNumbers,
                bonusNumber: parsed.bonusNumber,
                drawDate: parsed.drawDate,
                jackpotAmount: null,
                nextJackpot: parsed.nextJackpot,
                hotNumber: parsed.hotNumber,
                coldNumber: parsed.coldNumber,
              });
              logScrape(`Added result for ${config.name}`);
            }

            return false;
          }
        });

        if (!sectionFound) {
          logScrape(`Trying regex search for ${config.name} in full page text...`);

          const headingMatch = fullText.match(new RegExp(`${config.name}\\s+results[\\s\\S]{0,500}`, 'i'));
          if (headingMatch) {
            const parsed = parseGameSection(headingMatch[0], config);
            if (parsed) {
              results.push({
                gameId: config.slug,
                gameName: parsed.gameName,
                gameSlug: parsed.gameSlug,
                winningNumbers: parsed.winningNumbers,
                bonusNumber: parsed.bonusNumber,
                drawDate: parsed.drawDate,
                jackpotAmount: null,
                nextJackpot: parsed.nextJackpot,
                hotNumber: parsed.hotNumber,
                coldNumber: parsed.coldNumber,
              });
              logScrape(`Added result for ${config.name} via regex search`);
            }
          }
        }
      }

      if (results.length > 0) {
        logScrape(`Successfully scraped ${results.length} lottery results`);
        return results;
      }

      logScrape(`No results found on attempt ${attempt}`);

      if (attempt < retries) {
        logScrape(`Waiting ${delayMs / 1000} seconds before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logError(`Scraping attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < retries) {
        logScrape(`Retrying in ${delayMs / 1000} seconds (attempt ${attempt + 1} of ${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  const errorMsg = lastError?.message || "Failed to scrape lottery results after multiple attempts.";
  logError(`All scraping attempts failed: ${errorMsg}`);
  throw lastError || new Error(errorMsg);
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
