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

export async function scrapeLotteryResults(): Promise<InsertLotteryResult[]> {
  try {
    const response = await axios.get("https://www.africanlottery.net/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const results: InsertLotteryResult[] = [];

    const gameConfigs: Record<string, { slug: string; hasBonus: boolean }> = {
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
        const numbersText = section.find(".numbers, .result-numbers").text() || 
                           section.text().match(/\d{2}/g)?.join("") || "";
        
        const allNumbers = numbersText.match(/\d{2}/g)?.map(Number) || [];
        
        let winningNumbers: number[] = [];
        let bonusNumber: number | null = null;
        
        if (config.hasBonus && allNumbers.length > 0) {
          winningNumbers = allNumbers.slice(0, -1);
          bonusNumber = allNumbers[allNumbers.length - 1] || null;
        } else {
          winningNumbers = allNumbers;
        }

        const dateMatch = section.text().match(/\d{4}-\d{2}-\d{2}/) || 
                         section.text().match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
        const drawDate = dateMatch ? dateMatch[0] : new Date().toISOString().split("T")[0];

        const jackpotMatch = section.text().match(/R[\d,]+/);
        const nextJackpot = jackpotMatch ? jackpotMatch[0] : null;

        const hotMatch = section.text().match(/Hot(?:\s+Number)?[:\s]+(\d+)/i);
        const coldMatch = section.text().match(/Cold(?:\s+Number)?[:\s]+(\d+)/i);
        
        const hotNumber = hotMatch ? parseInt(hotMatch[1]) : null;
        const coldNumber = coldMatch ? parseInt(coldMatch[1]) : null;

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
            hotNumber,
            coldNumber,
          });
        }
      }
    });

    return results;
  } catch (error) {
    console.error("Error scraping lottery results:", error);
    throw new Error("Failed to scrape lottery results. The website may be unavailable.");
  }
}

export async function testScraper(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const results = await scrapeLotteryResults();
    return {
      success: true,
      message: `Successfully scraped ${results.length} lottery results`,
      count: results.length,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
      count: 0,
    };
  }
}
