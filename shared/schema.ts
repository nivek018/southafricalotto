import { mysqlTable, text, varchar, int, boolean, timestamp, json } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const lotteryGames = mysqlTable("lottery_games", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  numberCount: int("number_count").notNull().default(6),
  maxNumber: int("max_number").notNull().default(50),
  hasBonusBall: boolean("has_bonus_ball").default(false),
  bonusMaxNumber: int("bonus_max_number"),
  drawDays: json("draw_days").$type<string[]>(),
  drawTime: varchar("draw_time", { length: 20 }), // e.g., "20:58"
  isActive: boolean("is_active").default(true),
});

export const insertLotteryGameSchema = createInsertSchema(lotteryGames, {
  drawDays: z.array(z.string()).optional().nullable(),
}).omit({
  id: true,
});

export type InsertLotteryGame = z.infer<typeof insertLotteryGameSchema>;
export type LotteryGame = typeof lotteryGames.$inferSelect;

export const updateDrawDaysSchema = z.object({
  gameSlug: z.string(),
  drawDays: z.array(z.string()),
});

export const lotteryResults = mysqlTable("lottery_results", {
  id: varchar("id", { length: 36 }).primaryKey(),
  gameId: varchar("game_id", { length: 36 }).notNull(),
  gameName: varchar("game_name", { length: 255 }).notNull(),
  gameSlug: varchar("game_slug", { length: 255 }).notNull(),
  winningNumbers: json("winning_numbers").$type<number[]>().notNull(),
  bonusNumber: int("bonus_number"),
  drawDate: varchar("draw_date", { length: 50 }).notNull(),
  jackpotAmount: varchar("jackpot_amount", { length: 255 }),
  nextJackpot: varchar("next_jackpot", { length: 255 }),
  winner: int("winner"),
  hotNumber: int("hot_number"),
  coldNumber: int("cold_number"),
});

export const insertLotteryResultSchema = createInsertSchema(lotteryResults, {
  winningNumbers: z.array(z.number()),
}).omit({
  id: true,
});

export type InsertLotteryResult = z.infer<typeof insertLotteryResultSchema>;
export type LotteryResult = typeof lotteryResults.$inferSelect;

export const newsArticles = mysqlTable("news_articles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  category: varchar("category", { length: 50 }).default("general"),
  publishDate: varchar("publish_date", { length: 50 }).notNull(),
  isPublished: boolean("is_published").default(true),
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
});

export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;

export const scraperSettings = mysqlTable("scraper_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  gameSlug: varchar("game_slug", { length: 255 }).notNull().unique(),
  isEnabled: boolean("is_enabled").default(true),
  scheduleTime: varchar("schedule_time", { length: 50 }), // cron format or HH:MM
  lastScrapedAt: varchar("last_scraped_at", { length: 50 }),
});

export const insertScraperSettingSchema = createInsertSchema(scraperSettings).omit({
  id: true,
});

export type InsertScraperSetting = z.infer<typeof insertScraperSettingSchema>;
export type ScraperSetting = typeof scraperSettings.$inferSelect;

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type AdminLogin = z.infer<typeof adminLoginSchema>;

export const resultFormSchema = z.object({
  gameId: z.string().min(1, "Game is required"),
  gameName: z.string().min(1, "Game name is required"),
  gameSlug: z.string().min(1, "Game slug is required"),
  winningNumbers: z.string().min(1, "Winning numbers are required"),
  bonusNumber: z.string().optional(),
  drawDate: z.string().min(1, "Draw date is required"),
  jackpotAmount: z.string().optional(),
  nextJackpot: z.string().optional(),
  hotNumber: z.string().optional(),
  coldNumber: z.string().optional(),
});

export type ResultForm = z.infer<typeof resultFormSchema>;

export const newsFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string().optional(),
  category: z.string().default("general"),
  publishDate: z.string().min(1, "Publish date is required"),
  isPublished: z.boolean().default(true),
});

export type NewsForm = z.infer<typeof newsFormSchema>;

export const scraperSettingsFormSchema = z.object({
  gameSlug: z.string().min(1, "Game is required"),
  isEnabled: z.boolean(),
  scheduleTime: z.string().optional(),
});

export type ScraperSettingsForm = z.infer<typeof scraperSettingsFormSchema>;

export const LOTTERY_GROUPS: Record<string, { name: string; slugs: string[]; description: string }> = {
  "powerball": {
    name: "Powerball",
    slugs: ["powerball", "powerball-plus"],
    description: "South Africa's biggest lottery with massive jackpots. Choose 5 numbers from 1-50 and 1 Powerball from 1-20."
  },
  "lotto": {
    name: "Lotto",
    slugs: ["lotto", "lotto-plus-1", "lotto-plus-2"],
    description: "South Africa's original lottery game. Choose 6 numbers from 1-58 for a chance to win the jackpot."
  },
  "daily-lotto": {
    name: "Daily Lotto",
    slugs: ["daily-lotto", "daily-lotto-plus"],
    description: "Play daily for a chance to win. Choose 5 numbers from 1-36 with draws every day."
  }
};

const CANONICAL_SLUG_MAP: Record<string, string> = {
  "powerball-plus": "powerball",
  "lotto-plus-1": "lotto",
  "lotto-plus-2": "lotto",
  "daily-lotto-plus": "daily-lotto",
};

export function canonicalSlug(slug: string): string {
  return CANONICAL_SLUG_MAP[slug] || slug;
}

export function getGroupForSlug(slug: string): { groupSlug: string; group: typeof LOTTERY_GROUPS[string] } | null {
  for (const [groupSlug, group] of Object.entries(LOTTERY_GROUPS)) {
    if (group.slugs.includes(slug)) {
      return { groupSlug, group };
    }
  }
  return null;
}
