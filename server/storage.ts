import {
  type User,
  type InsertUser,
  type LotteryGame,
  type InsertLotteryGame,
  type LotteryResult,
  type InsertLotteryResult,
  type NewsArticle,
  type InsertNewsArticle,
  type ScraperSetting,
  type InsertScraperSetting,
  users,
  lotteryGames,
  lotteryResults,
  newsArticles,
  scraperSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getGames(): Promise<LotteryGame[]>;
  getGameBySlug(slug: string): Promise<LotteryGame | undefined>;
  createGame(game: InsertLotteryGame): Promise<LotteryGame>;

  getResults(): Promise<LotteryResult[]>;
  getLatestResults(): Promise<LotteryResult[]>;
  getResultsByGameSlug(gameSlug: string): Promise<LotteryResult[]>;
  getResultById(id: string): Promise<LotteryResult | undefined>;
  createResult(result: InsertLotteryResult): Promise<LotteryResult>;
  updateResult(id: string, result: Partial<InsertLotteryResult>): Promise<LotteryResult | undefined>;
  deleteResult(id: string): Promise<boolean>;

  getNews(): Promise<NewsArticle[]>;
  getPublishedNews(): Promise<NewsArticle[]>;
  getNewsBySlug(slug: string): Promise<NewsArticle | undefined>;
  getNewsById(id: string): Promise<NewsArticle | undefined>;
  createNews(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNews(id: string, article: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined>;
  deleteNews(id: string): Promise<boolean>;

  getScraperSettings(): Promise<ScraperSetting[]>;
  getScraperSettingByGameSlug(gameSlug: string): Promise<ScraperSetting | undefined>;
  upsertScraperSetting(setting: InsertScraperSetting): Promise<ScraperSetting>;
  updateScraperLastRun(timestamp: string): Promise<void>;
  updateDrawDays(gameSlug: string, drawDays: string[]): Promise<LotteryGame | undefined>;

  initializeDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    await db.insert(users).values({ ...insertUser, id });
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getGames(): Promise<LotteryGame[]> {
    return await db.select().from(lotteryGames);
  }

  async getGameBySlug(slug: string): Promise<LotteryGame | undefined> {
    const [game] = await db.select().from(lotteryGames).where(eq(lotteryGames.slug, slug));
    return game;
  }

  async createGame(insertGame: InsertLotteryGame): Promise<LotteryGame> {
    const id = randomUUID();
    await db.insert(lotteryGames).values({ ...insertGame, id });
    const [game] = await db.select().from(lotteryGames).where(eq(lotteryGames.id, id));
    return game;
  }

  async getResults(): Promise<LotteryResult[]> {
    return await db.select().from(lotteryResults).orderBy(desc(lotteryResults.drawDate));
  }

  async getLatestResults(): Promise<LotteryResult[]> {
    const allResults = await db.select().from(lotteryResults).orderBy(desc(lotteryResults.drawDate));
    const latestByGame = new Map<string, LotteryResult>();

    allResults.forEach(result => {
      if (!latestByGame.has(result.gameSlug)) {
        latestByGame.set(result.gameSlug, result);
      }
    });

    return Array.from(latestByGame.values());
  }

  async getResultsByGameSlug(gameSlug: string): Promise<LotteryResult[]> {
    return await db.select()
      .from(lotteryResults)
      .where(eq(lotteryResults.gameSlug, gameSlug))
      .orderBy(desc(lotteryResults.drawDate));
  }

  async getResultById(id: string): Promise<LotteryResult | undefined> {
    const [result] = await db.select().from(lotteryResults).where(eq(lotteryResults.id, id));
    return result;
  }

  async createResult(insertResult: InsertLotteryResult): Promise<LotteryResult> {
    const id = randomUUID();
    await db.insert(lotteryResults).values({ ...insertResult, id });
    const [result] = await db.select().from(lotteryResults).where(eq(lotteryResults.id, id));
    return result;
  }

  async updateResult(id: string, updateData: Partial<InsertLotteryResult>): Promise<LotteryResult | undefined> {
    await db.update(lotteryResults)
      .set(updateData)
      .where(eq(lotteryResults.id, id));
    const [result] = await db.select().from(lotteryResults).where(eq(lotteryResults.id, id));
    return result;
  }

  async deleteResult(id: string): Promise<boolean> {
    const result = await db.delete(lotteryResults).where(eq(lotteryResults.id, id));
    return true;
  }

  async getNews(): Promise<NewsArticle[]> {
    return await db.select().from(newsArticles).orderBy(desc(newsArticles.publishDate));
  }

  async getPublishedNews(): Promise<NewsArticle[]> {
    return await db.select()
      .from(newsArticles)
      .where(eq(newsArticles.isPublished, true))
      .orderBy(desc(newsArticles.publishDate));
  }

  async getNewsBySlug(slug: string): Promise<NewsArticle | undefined> {
    const [article] = await db.select().from(newsArticles).where(eq(newsArticles.slug, slug));
    return article;
  }

  async getNewsById(id: string): Promise<NewsArticle | undefined> {
    const [article] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
    return article;
  }

  async createNews(insertArticle: InsertNewsArticle): Promise<NewsArticle> {
    const id = randomUUID();
    await db.insert(newsArticles).values({ ...insertArticle, id });
    const [article] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
    return article;
  }

  async updateNews(id: string, updateData: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined> {
    await db.update(newsArticles)
      .set(updateData)
      .where(eq(newsArticles.id, id));
    const [article] = await db.select().from(newsArticles).where(eq(newsArticles.id, id));
    return article;
  }

  async deleteNews(id: string): Promise<boolean> {
    await db.delete(newsArticles).where(eq(newsArticles.id, id));
    return true;
  }

  async getScraperSettings(): Promise<ScraperSetting[]> {
    return await db.select().from(scraperSettings);
  }

  async getScraperSettingByGameSlug(gameSlug: string): Promise<ScraperSetting | undefined> {
    const [setting] = await db.select().from(scraperSettings).where(eq(scraperSettings.gameSlug, gameSlug));
    return setting;
  }

  async upsertScraperSetting(setting: InsertScraperSetting): Promise<ScraperSetting> {
    const existing = await this.getScraperSettingByGameSlug(setting.gameSlug);
    if (existing) {
      await db.update(scraperSettings)
        .set(setting)
        .where(eq(scraperSettings.gameSlug, setting.gameSlug));
      const [updated] = await db.select().from(scraperSettings).where(eq(scraperSettings.gameSlug, setting.gameSlug));
      return updated;
    }
    const id = randomUUID();
    await db.insert(scraperSettings).values({ ...setting, id });
    const [created] = await db.select().from(scraperSettings).where(eq(scraperSettings.id, id));
    return created;
  }

  async updateScraperLastRun(timestamp: string): Promise<void> {
    const settings = await this.getScraperSettings();
    if (settings.length === 0) return;

    for (const setting of settings) {
      await db.update(scraperSettings)
        .set({ lastScrapedAt: timestamp })
        .where(eq(scraperSettings.id, setting.id));
    }
  }

  async updateDrawDays(gameSlug: string, drawDays: string[]): Promise<LotteryGame | undefined> {
    await db.update(lotteryGames)
      .set({ drawDays })
      .where(eq(lotteryGames.slug, gameSlug));
    const [game] = await db.select().from(lotteryGames).where(eq(lotteryGames.slug, gameSlug));
    return game;
  }

  async initializeDefaultData(): Promise<void> {
    const existingGames = await this.getGames();
    if (existingGames.length > 0) {
      console.log("Database already has data, skipping initialization");
      return;
    }

    console.log("Initializing default data...");

    const defaultGames: InsertLotteryGame[] = [
      {
        name: "Powerball",
        slug: "powerball",
        description: "South Africa's biggest lottery game with massive jackpots",
        numberCount: 5,
        maxNumber: 50,
        hasBonusBall: true,
        bonusMaxNumber: 20,
        drawDays: ["Tuesday", "Friday"],
        drawTime: "21:00",
        isActive: true
      },
      {
        name: "Powerball Plus",
        slug: "powerball-plus",
        description: "Add-on game for Powerball players",
        numberCount: 5,
        maxNumber: 50,
        hasBonusBall: true,
        bonusMaxNumber: 20,
        drawDays: ["Tuesday", "Friday"],
        drawTime: "21:00",
        isActive: true
      },
      {
        name: "Lotto",
        slug: "lotto",
        description: "Classic 6-ball lottery game",
        numberCount: 6,
        maxNumber: 52,
        hasBonusBall: true,
        bonusMaxNumber: 52,
        drawDays: ["Wednesday", "Saturday"],
        drawTime: "21:00",
        isActive: true
      },
      {
        name: "Lotto Plus 1",
        slug: "lotto-plus-1",
        description: "First add-on game for Lotto",
        numberCount: 6,
        maxNumber: 52,
        hasBonusBall: true,
        bonusMaxNumber: 52,
        drawDays: ["Wednesday", "Saturday"],
        drawTime: "21:00",
        isActive: true
      },
      {
        name: "Lotto Plus 2",
        slug: "lotto-plus-2",
        description: "Second add-on game for Lotto",
        numberCount: 6,
        maxNumber: 52,
        hasBonusBall: true,
        bonusMaxNumber: 52,
        drawDays: ["Wednesday", "Saturday"],
        drawTime: "21:00",
        isActive: true
      },
      {
        name: "Daily Lotto",
        slug: "daily-lotto",
        description: "Daily draw with 5 numbers",
        numberCount: 5,
        maxNumber: 36,
        hasBonusBall: false,
        drawDays: ["Daily"],
        drawTime: "21:00",
        isActive: true
      },
      {
        name: "Daily Lotto Plus",
        slug: "daily-lotto-plus",
        description: "Add-on for Daily Lotto",
        numberCount: 5,
        maxNumber: 36,
        hasBonusBall: false,
        drawDays: ["Daily"],
        drawTime: "21:00",
        isActive: true
      },
    ];

    for (const game of defaultGames) {
      await this.createGame(game);
    }

    const sampleResults: InsertLotteryResult[] = [
      {
        gameId: "powerball",
        gameName: "Powerball",
        gameSlug: "powerball",
        winningNumbers: [17, 28, 29, 33, 34],
        bonusNumber: 1,
        drawDate: "2025-11-28",
        jackpotAmount: "R50,000,000",
        nextJackpot: "R775,855",
        hotNumber: 28,
        coldNumber: 34
      },
      {
        gameId: "powerball-plus",
        gameName: "Powerball Plus",
        gameSlug: "powerball-plus",
        winningNumbers: [14, 19, 29, 35, 40],
        bonusNumber: 16,
        drawDate: "2025-11-28",
        jackpotAmount: "R10,000,000",
        nextJackpot: "R315,214",
        hotNumber: 29,
        coldNumber: 24
      },
      {
        gameId: "daily-lotto",
        gameName: "Daily Lotto",
        gameSlug: "daily-lotto",
        winningNumbers: [1, 19, 24, 32, 36],
        bonusNumber: null,
        drawDate: "2025-11-28",
        jackpotAmount: "R400,000",
        nextJackpot: "R81,932",
        hotNumber: 26,
        coldNumber: 7
      },
      {
        gameId: "daily-lotto-plus",
        gameName: "Daily Lotto Plus",
        gameSlug: "daily-lotto-plus",
        winningNumbers: [9, 11, 28, 35, 36],
        bonusNumber: null,
        drawDate: "2025-11-28",
        jackpotAmount: "R100,000",
        nextJackpot: "R27,356",
        hotNumber: 36,
        coldNumber: 21
      },
      {
        gameId: "lotto",
        gameName: "Lotto",
        gameSlug: "lotto",
        winningNumbers: [4, 8, 25, 32, 33, 36],
        bonusNumber: 22,
        drawDate: "2025-11-26",
        jackpotAmount: "R35,000,000",
        nextJackpot: "R40,000,000",
        hotNumber: 33,
        coldNumber: 25
      },
      {
        gameId: "lotto-plus-1",
        gameName: "Lotto Plus 1",
        gameSlug: "lotto-plus-1",
        winningNumbers: [1, 12, 32, 35, 38, 39],
        bonusNumber: 42,
        drawDate: "2025-11-26",
        jackpotAmount: "R2,000,000",
        nextJackpot: "R144,622",
        hotNumber: 45,
        coldNumber: 38
      },
      {
        gameId: "lotto-plus-2",
        gameName: "Lotto Plus 2",
        gameSlug: "lotto-plus-2",
        winningNumbers: [14, 23, 25, 32, 40, 52],
        bonusNumber: 54,
        drawDate: "2025-11-26",
        jackpotAmount: "R1,500,000",
        nextJackpot: "R1,659,025",
        hotNumber: 38,
        coldNumber: 46
      }
    ];

    for (const result of sampleResults) {
      await this.createResult(result);
    }

    const sampleNews: InsertNewsArticle[] = [
      {
        title: "Double Up Promotion - Win a Bonus National Lottery Deposit",
        slug: "national-lottery-deposit-double-up-promotion",
        excerpt: "Top up your online National Lottery account with maximum amount of R50.00 to win double up cash!",
        content: "Top up your online National Lottery account with maximum amount of R50.00 to win double up cash! This exciting promotion gives you the chance to double your deposit when you add funds to your lottery account.\n\nThe promotion is available for all registered National Lottery players. Simply log in to your account, make a deposit of up to R50, and you could be selected to receive a matching bonus.\n\nDon't miss this opportunity to get extra value for your lottery play. Remember to always play responsibly.",
        imageUrl: null,
        category: "promotions",
        publishDate: "2025-11-25",
        isPublished: true
      },
      {
        title: "National Lotteries Commission Will Investigate the 5,6,7,8,9,10 Winning Numbers?",
        slug: "nlc-investigate-consecutive-numbers",
        excerpt: "After the strange consecutive numbers: 5,6,7,8,9,10 as results in Powerball game, the National Lottery Commission decided to make an investigation.",
        content: "After the strange consecutive numbers: 5,6,7,8,9,10 as results in Powerball game, the National Lottery Commission decided to make an investigation.\n\nThis unusual draw result caused significant public interest and raised questions about the lottery's random number generation process. The commission has assured the public that all draws are conducted fairly and transparently.\n\nMathematicians have pointed out that consecutive numbers, while unusual looking, are statistically just as likely as any other combination. The investigation aims to verify all procedures were followed correctly.\n\nThe National Lottery Commission is committed to maintaining public trust and ensuring the integrity of all lottery games.",
        imageUrl: null,
        category: "news",
        publishDate: "2025-11-20",
        isPublished: true
      },
      {
        title: "How to Play SA Powerball - A Beginner's Guide",
        slug: "how-to-play-powerball-beginners-guide",
        excerpt: "Learn everything you need to know about playing South Africa's biggest lottery game.",
        content: "Powerball is South Africa's most popular lottery game, offering some of the biggest jackpots in the country.\n\nTo play Powerball, you need to:\n1. Choose 5 numbers from 1 to 50\n2. Choose 1 Powerball number from 1 to 20\n3. Purchase your ticket before the draw closes\n\nDraws take place every Tuesday and Friday at 9:00 PM. You can watch the draws live on SABC2 or check results right here on African Lottery.\n\nPowerball Plus is an add-on game that uses the same numbers but offers a separate prize pool. If you want to maximize your chances of winning, consider playing both games.\n\nRemember: Always play responsibly and within your budget.",
        imageUrl: null,
        category: "tips",
        publishDate: "2025-11-15",
        isPublished: true
      }
    ];

    for (const article of sampleNews) {
      await this.createNews(article);
    }
  }
}

export const storage = new DatabaseStorage();
