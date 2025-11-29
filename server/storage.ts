import { 
  type User, 
  type InsertUser, 
  type LotteryGame, 
  type InsertLotteryGame,
  type LotteryResult, 
  type InsertLotteryResult,
  type NewsArticle,
  type InsertNewsArticle
} from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<string, LotteryGame>;
  private results: Map<string, LotteryResult>;
  private news: Map<string, NewsArticle>;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.results = new Map();
    this.news = new Map();
    
    this.initializeDefaultGames();
    this.initializeSampleData();
  }

  private initializeDefaultGames() {
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
        isActive: true
      },
    ];

    defaultGames.forEach(game => this.createGame(game));
  }

  private initializeSampleData() {
    const sampleResults: InsertLotteryResult[] = [
      {
        gameId: "powerball",
        gameName: "Powerball",
        gameSlug: "powerball",
        winningNumbers: [29, 28, 33, 34, 17],
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
        winningNumbers: [19, 40, 29, 14, 35],
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
        winningNumbers: [19, 24, 36, 1, 32],
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
        winningNumbers: [11, 36, 28, 35, 9],
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
        winningNumbers: [4, 8, 36, 33, 25, 32],
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
        winningNumbers: [32, 12, 1, 38, 35, 39],
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
        winningNumbers: [32, 25, 57, 40, 23, 14],
        bonusNumber: 54,
        drawDate: "2025-11-26",
        jackpotAmount: "R1,500,000",
        nextJackpot: "R1,659,025",
        hotNumber: 38,
        coldNumber: 46
      }
    ];

    sampleResults.forEach(result => this.createResult(result));

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

    sampleNews.forEach(article => this.createNews(article));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getGames(): Promise<LotteryGame[]> {
    return Array.from(this.games.values());
  }

  async getGameBySlug(slug: string): Promise<LotteryGame | undefined> {
    return Array.from(this.games.values()).find(game => game.slug === slug);
  }

  async createGame(insertGame: InsertLotteryGame): Promise<LotteryGame> {
    const id = randomUUID();
    const game: LotteryGame = { 
      ...insertGame, 
      id,
      description: insertGame.description ?? null,
      numberCount: insertGame.numberCount ?? 6,
      maxNumber: insertGame.maxNumber ?? 50,
      hasBonusBall: insertGame.hasBonusBall ?? false,
      bonusMaxNumber: insertGame.bonusMaxNumber ?? null,
      drawDays: insertGame.drawDays ?? null,
      drawTime: insertGame.drawTime ?? null,
      isActive: insertGame.isActive ?? true
    };
    this.games.set(id, game);
    return game;
  }

  async getResults(): Promise<LotteryResult[]> {
    return Array.from(this.results.values())
      .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
  }

  async getLatestResults(): Promise<LotteryResult[]> {
    const allResults = Array.from(this.results.values());
    const latestByGame = new Map<string, LotteryResult>();
    
    allResults.forEach(result => {
      const existing = latestByGame.get(result.gameSlug);
      if (!existing || new Date(result.drawDate) > new Date(existing.drawDate)) {
        latestByGame.set(result.gameSlug, result);
      }
    });
    
    return Array.from(latestByGame.values())
      .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
  }

  async getResultsByGameSlug(gameSlug: string): Promise<LotteryResult[]> {
    return Array.from(this.results.values())
      .filter(result => result.gameSlug === gameSlug)
      .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime());
  }

  async getResultById(id: string): Promise<LotteryResult | undefined> {
    return this.results.get(id);
  }

  async createResult(insertResult: InsertLotteryResult): Promise<LotteryResult> {
    const id = randomUUID();
    const result: LotteryResult = { 
      ...insertResult, 
      id,
      bonusNumber: insertResult.bonusNumber ?? null,
      jackpotAmount: insertResult.jackpotAmount ?? null,
      nextJackpot: insertResult.nextJackpot ?? null,
      hotNumber: insertResult.hotNumber ?? null,
      coldNumber: insertResult.coldNumber ?? null
    };
    this.results.set(id, result);
    return result;
  }

  async updateResult(id: string, updateData: Partial<InsertLotteryResult>): Promise<LotteryResult | undefined> {
    const existing = this.results.get(id);
    if (!existing) return undefined;
    
    const updated: LotteryResult = { ...existing, ...updateData };
    this.results.set(id, updated);
    return updated;
  }

  async deleteResult(id: string): Promise<boolean> {
    return this.results.delete(id);
  }

  async getNews(): Promise<NewsArticle[]> {
    return Array.from(this.news.values())
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  }

  async getPublishedNews(): Promise<NewsArticle[]> {
    return Array.from(this.news.values())
      .filter(article => article.isPublished)
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  }

  async getNewsBySlug(slug: string): Promise<NewsArticle | undefined> {
    return Array.from(this.news.values()).find(article => article.slug === slug);
  }

  async getNewsById(id: string): Promise<NewsArticle | undefined> {
    return this.news.get(id);
  }

  async createNews(insertArticle: InsertNewsArticle): Promise<NewsArticle> {
    const id = randomUUID();
    const article: NewsArticle = { 
      ...insertArticle, 
      id,
      excerpt: insertArticle.excerpt ?? null,
      imageUrl: insertArticle.imageUrl ?? null,
      category: insertArticle.category ?? "general",
      isPublished: insertArticle.isPublished ?? true
    };
    this.news.set(id, article);
    return article;
  }

  async updateNews(id: string, updateData: Partial<InsertNewsArticle>): Promise<NewsArticle | undefined> {
    const existing = this.news.get(id);
    if (!existing) return undefined;
    
    const updated: NewsArticle = { ...existing, ...updateData };
    this.news.set(id, updated);
    return updated;
  }

  async deleteNews(id: string): Promise<boolean> {
    return this.news.delete(id);
  }
}

export const storage = new MemStorage();
