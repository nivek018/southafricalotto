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
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1",
];

const ACCEPT_LANGUAGES = [
  "en-US,en;q=0.9",
  "en-GB,en;q=0.9,en-US;q=0.8",
  "en-ZA,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
  "en;q=0.9",
  "en-AU,en;q=0.9,en-GB;q=0.8",
];

const REFERERS = [
  "https://www.google.com/",
  "https://www.google.co.za/",
  "https://www.bing.com/",
  "https://duckduckgo.com/",
  "",
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": getRandomItem(USER_AGENTS),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": getRandomItem(ACCEPT_LANGUAGES),
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
  };

  const referer = getRandomItem(REFERERS);
  if (referer) {
    headers["Referer"] = referer;
  }

  return headers;
}

function sortNumbers(numbers: number[]): number[] {
  return [...numbers].sort((a, b) => a - b);
}

export async function scrapeLotteryResults(
  retries: number = 3,
  delayMs: number = 300000
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

      logScrape(`Response received, status: ${response.status}`);

      const $ = cheerio.load(response.data);
      const results: InsertLotteryResult[] = [];

      const gameConfigs: Record<
        string,
        { slug: string; hasBonus: boolean }
      > = {
        "Powerball results": { slug: "powerball", hasBonus: true },
        "Powerball Plus results": { slug: "powerball-plus", hasBonus: true },
        "Lotto results": { slug: "lotto", hasBonus: true },
        "Lotto Plus 1 results": { slug: "lotto-plus-1", hasBonus: true },
        "Lotto Plus 2 results": { slug: "lotto-plus-2", hasBonus: true },
        "Daily Lotto results": { slug: "daily-lotto", hasBonus: false },
        "Daily Lotto Plus results": { slug: "daily-lotto-plus", hasBonus: false },
      };

      $("h2").each((_, element) => {
        const heading = $(element).text().trim();
        const config = gameConfigs[heading];

        if (config) {
          const section = $(element).parent();
          const numbersText =
            section.find(".numbers, .result-numbers").text() ||
            section.text().match(/\d{2}/g)?.join("") ||
            "";

          const allNumbers = numbersText.match(/\d{2}/g)?.map(Number) || [];

          let winningNumbers: number[] = [];
          let bonusNumber: number | null = null;

          if (config.hasBonus && allNumbers.length > 0) {
            const bonus = allNumbers[allNumbers.length - 1];
            winningNumbers = sortNumbers(allNumbers.slice(0, -1));
            bonusNumber = bonus || null;
          } else {
            winningNumbers = sortNumbers(allNumbers);
          }

          const dateMatch =
            section.text().match(/\d{4}-\d{2}-\d{2}/) ||
            section.text().match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
          const drawDate = dateMatch
            ? dateMatch[0]
            : new Date().toISOString().split("T")[0];

          const jackpotMatch = section.text().match(/R[\d,]+/);
          const nextJackpot = jackpotMatch ? jackpotMatch[0] : null;

          const gameName = heading.replace(" results", "");

          if (winningNumbers.length > 0) {
            results.push({
              gameId: config.slug,
              gameName,
              gameSlug: config.slug,
              winningNumbers,
              bonusNumber,
              drawDate,
              jackpotAmount: null,
              nextJackpot,
              hotNumber: null,
              coldNumber: null,
            });
            logScrape(`Found result for ${gameName}: ${winningNumbers.join(", ")}${bonusNumber ? ` + ${bonusNumber}` : ""}`);
          }
        }
      });

      if (results.length > 0) {
        logScrape(`Successfully scraped ${results.length} lottery results`);
        return results;
      }

      logScrape(`No results found on attempt ${attempt}, will retry after ${delayMs / 60000} minutes if attempts remain`);

      if (attempt < retries) {
        logScrape(`Waiting ${delayMs / 60000} minutes before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logError(`Scraping attempt ${attempt} failed: ${lastError.message}`);

      if (attempt < retries) {
        logScrape(`Retrying in ${delayMs / 60000} minutes (attempt ${attempt + 1} of ${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  const errorMsg = lastError?.message || "Failed to scrape lottery results after multiple attempts. The website may be unavailable.";
  logError(`All scraping attempts failed: ${errorMsg}`);
  throw lastError || new Error(errorMsg);
}

export async function testScraper(): Promise<{
  success: boolean;
  message: string;
  count: number;
}> {
  try {
    logInfo("Testing scraper connection...");
    const results = await scrapeLotteryResults(1, 0);
    logInfo(`Scraper test successful: ${results.length} results found`);
    return {
      success: true,
      message: `Successfully scraped ${results.length} lottery results`,
      count: results.length,
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
