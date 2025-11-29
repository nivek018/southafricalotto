import axios from "axios";
import * as cheerio from "cheerio";
import type { InsertLotteryResult } from "@shared/schema";

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

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sortNumbers(numbers: number[]): number[] {
  return [...numbers].sort((a, b) => a - b);
}

export async function scrapeLotteryResults(
  retries: number = 3,
  delayMs: number = 5000
): Promise<InsertLotteryResult[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get("https://www.africanlottery.net/", {
        headers: {
          "User-Agent": getRandomUserAgent(),
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          "DNT": "1",
          "Connection": "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        timeout: 30000,
      });

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
          }
        }
      });

      if (results.length > 0) {
        return results;
      }

      if (attempt < retries) {
        console.log(
          `No results found on attempt ${attempt}. Retrying in ${delayMs / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Scraping attempt ${attempt} failed:`, lastError.message);

      if (attempt < retries) {
        console.log(
          `Retrying in ${delayMs / 1000} seconds (attempt ${attempt + 1} of ${retries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw (
    lastError ||
    new Error(
      "Failed to scrape lottery results after multiple attempts. The website may be unavailable."
    )
  );
}

export async function testScraper(): Promise<{
  success: boolean;
  message: string;
  count: number;
}> {
  try {
    const results = await scrapeLotteryResults(1, 0);
    return {
      success: true,
      message: `Successfully scraped ${results.length} lottery results`,
      count: results.length,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unknown error occurred",
      count: 0,
    };
  }
}
