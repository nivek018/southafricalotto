import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const lotteryGames = pgTable("lottery_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  numberCount: integer("number_count").notNull().default(6),
  maxNumber: integer("max_number").notNull().default(50),
  hasBonusBall: boolean("has_bonus_ball").default(false),
  bonusMaxNumber: integer("bonus_max_number"),
  drawDays: text("draw_days").array(),
  drawTime: text("draw_time"), // e.g., "20:58"
  isActive: boolean("is_active").default(true),
});

export const insertLotteryGameSchema = createInsertSchema(lotteryGames).omit({
  id: true,
});

export type InsertLotteryGame = z.infer<typeof insertLotteryGameSchema>;
export type LotteryGame = typeof lotteryGames.$inferSelect;

export const lotteryResults = pgTable("lottery_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  gameName: text("game_name").notNull(),
  gameSlug: text("game_slug").notNull(),
  winningNumbers: integer("winning_numbers").array().notNull(),
  bonusNumber: integer("bonus_number"),
  drawDate: text("draw_date").notNull(),
  jackpotAmount: text("jackpot_amount"),
  nextJackpot: text("next_jackpot"),
  hotNumber: integer("hot_number"),
  coldNumber: integer("cold_number"),
});

export const insertLotteryResultSchema = createInsertSchema(lotteryResults).omit({
  id: true,
});

export type InsertLotteryResult = z.infer<typeof insertLotteryResultSchema>;
export type LotteryResult = typeof lotteryResults.$inferSelect;

export const newsArticles = pgTable("news_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  category: text("category").default("general"),
  publishDate: text("publish_date").notNull(),
  isPublished: boolean("is_published").default(true),
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
});

export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;

export const scraperSettings = pgTable("scraper_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameSlug: text("game_slug").notNull().unique(),
  isEnabled: boolean("is_enabled").default(true),
  scheduleTime: text("schedule_time"), // cron format or HH:MM
  lastScrapedAt: text("last_scraped_at"),
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
    description: "South Africa's original lottery game. Choose 6 numbers from 1-52 for a chance to win the jackpot."
  },
  "daily-lotto": {
    name: "Daily Lotto",
    slugs: ["daily-lotto", "daily-lotto-plus"],
    description: "Play daily for a chance to win. Choose 5 numbers from 1-36 with draws every day."
  }
};

export function getGroupForSlug(slug: string): { groupSlug: string; group: typeof LOTTERY_GROUPS[string] } | null {
  for (const [groupSlug, group] of Object.entries(LOTTERY_GROUPS)) {
    if (group.slugs.includes(slug)) {
      return { groupSlug, group };
    }
  }
  return null;
}
