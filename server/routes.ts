import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { scrapeLotteryResults, processScrapedResults } from "./scraper";
import { purgeCloudflareSite } from "./cloudflare";
import {
  insertLotteryResultSchema,
  insertNewsArticleSchema,
  adminLoginSchema,
  insertScraperSettingSchema,
  updateDrawDaysSchema,
  LOTTERY_GROUPS,
  getGroupForSlug
} from "@shared/schema";
import { z } from "zod";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve ads.txt from project root
  app.get("/ads.txt", (_req, res) => {
    const adsPath = path.resolve(process.cwd(), "ads.txt");
    if (fs.existsSync(adsPath)) {
      res.sendFile(adsPath);
    } else {
      res.status(404).send("ads.txt not found");
    }
  });

  const buildPurgePaths = (results: any[]): string[] => {
    const paths = new Set<string>();
    results.forEach((r) => {
      if (!r) return;
      const groupInfo = getGroupForSlug(r.gameSlug);
      const groupSlug = groupInfo?.groupSlug || r.gameSlug;
      paths.add(`/game/${r.gameSlug}`);
      paths.add(`/draw-history/${r.gameSlug}`);
      paths.add(`/draw-history/${groupSlug}`);
      paths.add(`/${groupSlug}-result/${r.drawDate}`);
      if (groupSlug === "powerball") {
        paths.add("/game/powerball");
        paths.add("/game/powerball-plus");
        paths.add("/powerball-result/yesterday");
      }
      if (groupSlug === "lotto") {
        paths.add("/game/lotto");
        paths.add("/game/lotto-plus-1");
        paths.add("/game/lotto-plus-2");
        paths.add("/lotto-result/yesterday");
      }
      if (groupSlug === "daily-lotto") {
        paths.add("/game/daily-lotto");
        paths.add("/game/daily-lotto-plus");
        paths.add("/daily-lotto-result/yesterday");
      }
    });
    paths.add("/");
    paths.add("/sitemap.xml");
    paths.add("/lotto-result/today");
    return Array.from(paths);
  };

  app.post("/api/admin/login", async (req, res) => {
    try {
      const parsed = adminLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      if (parsed.data.password === ADMIN_PASSWORD) {
        return res.json({ success: true, message: "Login successful" });
      }

      return res.status(401).json({ error: "Invalid password" });
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.get("/api/games/:slug", async (req, res) => {
    try {
      const game = await storage.getGameBySlug(req.params.slug);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game" });
    }
  });

  app.patch("/api/games/:slug/draw-days", async (req, res) => {
    try {
      const parsed = updateDrawDaysSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid draw days payload" });
      }

      if (parsed.data.gameSlug !== req.params.slug) {
        return res.status(400).json({ error: "Mismatched game slug" });
      }

      const updated = await storage.updateDrawDays(parsed.data.gameSlug, parsed.data.drawDays);
      if (!updated) {
        return res.status(404).json({ error: "Game not found" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update draw days" });
    }
  });

  app.get("/api/results", async (req, res) => {
    try {
      const results = await storage.getResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  app.get("/api/results/latest", async (req, res) => {
    try {
      const results = await storage.getLatestResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest results" });
    }
  });

  app.get("/api/results/recent-dates", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const results = await storage.getResults();
      const grouped: Record<string, typeof results> = {};

      results.forEach((result) => {
        if (!grouped[result.drawDate]) {
          grouped[result.drawDate] = [];
        }
        grouped[result.drawDate].push(result);
      });

      const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).slice(0, limit);

      const payload = sortedDates.map((date) => {
        const dateResults = grouped[date].sort((a, b) => a.gameName.localeCompare(b.gameName));
        const games = dateResults.map((r) => ({
          gameSlug: r.gameSlug,
          gameName: r.gameName,
          jackpotAmount: r.jackpotAmount,
          groupSlug: getGroupForSlug(r.gameSlug)?.groupSlug || r.gameSlug,
        }));

        const primaryGroupSlug =
          ["lotto", "powerball", "daily-lotto"].find((slug) => games.some((g) => g.groupSlug === slug)) ||
          games[0]?.groupSlug ||
          null;

        return {
          date,
          games,
          primaryGroupSlug,
        };
      });

      res.json({ dates: payload });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent results" });
    }
  });

  app.get("/api/results/game/:slug", async (req, res) => {
    try {
      const results = await storage.getResultsByGameSlug(req.params.slug);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game results" });
    }
  });

  app.get("/api/results/group/:groupSlug", async (req, res) => {
    try {
      const groupSlug = req.params.groupSlug;
      const group = LOTTERY_GROUPS[groupSlug];

      if (!group) {
        return res.status(404).json({ error: "Game group not found" });
      }

      const groupedResults: Record<string, any[]> = {};
      const latestResults: Record<string, any> = {};

      for (const slug of group.slugs) {
        const results = await storage.getResultsByGameSlug(slug);
        groupedResults[slug] = results;
        if (results.length > 0) {
          latestResults[slug] = results[0];
        }
      }

      res.json({
        group: {
          slug: groupSlug,
          name: group.name,
          description: group.description,
          variants: group.slugs
        },
        latestResults,
        allResults: groupedResults
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch grouped results" });
    }
  });

  app.get("/api/results/yesterday", async (req, res) => {
    try {
      const now = new Date();
      const sastOffset = 2 * 60;
      const localOffset = now.getTimezoneOffset();
      const sastTime = new Date(now.getTime() + (sastOffset + localOffset) * 60000);
      sastTime.setDate(sastTime.getDate() - 1);
      const yesterdayDate = sastTime.toISOString().split("T")[0];

      const allResults = await storage.getResults();
      const yesterdayResults = allResults.filter(r => r.drawDate === yesterdayDate);
      res.json(yesterdayResults);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch yesterday's results" });
    }
  });

  app.get("/api/results/today", async (req, res) => {
    try {
      const now = new Date();
      const sastOffset = 2 * 60;
      const localOffset = now.getTimezoneOffset();
      const sastTime = new Date(now.getTime() + (sastOffset + localOffset) * 60000);
      const todayDate = sastTime.toISOString().split("T")[0];

      const games = await storage.getGames();
      const allResults = await storage.getResults();
      const todayResults = allResults.filter(r => (r.drawDate || "").startsWith(todayDate));

      const gamesWithResults = games.map(game => {
        const result = todayResults.find(r => r.gameSlug === game.slug) || null;
        return { game, result };
      });

      res.json({
        date: todayDate,
        games: gamesWithResults
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's results" });
    }
  });

  app.get("/api/results/:id", async (req, res) => {
    try {
      const result = await storage.getResultById(req.params.id);
      if (!result) {
        return res.status(404).json({ error: "Result not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch result" });
    }
  });

  app.post("/api/results", async (req, res) => {
    try {
      const parsed = insertLotteryResultSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid result data", details: parsed.error });
      }

      const existingResults = await storage.getResultsByGameSlug(parsed.data.gameSlug);
      const duplicate = existingResults.find(
        r => r.drawDate === parsed.data.drawDate && r.gameSlug === parsed.data.gameSlug
      );

      if (duplicate) {
        return res.status(409).json({
          error: "Duplicate result",
          message: `A result for ${parsed.data.gameName} on ${parsed.data.drawDate} already exists.`
        });
      }

      const result = await storage.createResult(parsed.data);
      const paths = buildPurgePaths([result]);
      void purgeCloudflareSite(paths);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to create result" });
    }
  });

  app.patch("/api/results/:id", async (req, res) => {
    try {
      const result = await storage.updateResult(req.params.id, req.body);
      if (!result) {
        return res.status(404).json({ error: "Result not found" });
      }
      const paths = buildPurgePaths([result]);
      void purgeCloudflareSite(paths);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to update result" });
    }
  });

  app.delete("/api/results/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteResult(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Result not found" });
      }
      void purgeCloudflareSite();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete result" });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const admin = req.query.admin === "true";
      const articles = admin ? await storage.getNews() : await storage.getPublishedNews();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  app.get("/api/news/:slug", async (req, res) => {
    try {
      const article = await storage.getNewsBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/news", async (req, res) => {
    try {
      const parsed = insertNewsArticleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid article data", details: parsed.error });
      }

      const article = await storage.createNews(parsed.data);
      res.status(201).json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.patch("/api/news/:id", async (req, res) => {
    try {
      const existingById = await storage.getNewsById(req.params.id);
      const existingBySlug = await storage.getNewsBySlug(req.params.id);
      const existing = existingById || existingBySlug;

      if (!existing) {
        return res.status(404).json({ error: "Article not found" });
      }

      const article = await storage.updateNews(existing.id, req.body);
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNews(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  app.post("/api/scrape", async (req, res) => {
    try {
      console.log("[Scraper] Starting scrape operation...");
      const scrapedResults = await scrapeLotteryResults();
      console.log(`[Scraper] Got ${scrapedResults.length} results from scraper`);

      const { addedCount, addedResults, skippedResults } = await processScrapedResults(scrapedResults);
      await storage.updateScraperLastRun(new Date().toISOString());
      const paths = buildPurgePaths(scrapedResults);
      void purgeCloudflareSite(paths);

      console.log(`[Scraper] Complete: scraped ${scrapedResults.length}, added ${addedCount}`);

      res.json({
        success: true,
        message: `Scraped ${scrapedResults.length} results, added ${addedCount} new results`,
        scraped: scrapedResults.length,
        added: addedCount,
        results: scrapedResults.map(r => ({
          game: r.gameName,
          numbers: r.winningNumbers.join(', '),
          bonus: r.bonusNumber,
          date: r.drawDate,
          jackpot: r.jackpotAmount
        })),
        addedResults,
        skippedResults
      });
    } catch (error) {
      console.error("[Scraper] Error:", error);
      res.status(500).json({
        error: "Failed to scrape results",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/results/date/:groupSlug/:date", async (req, res) => {
    try {
      const { groupSlug, date } = req.params;
      const group = LOTTERY_GROUPS[groupSlug];

      if (!group) {
        return res.status(404).json({ error: "Game group not found" });
      }

      const results: Record<string, any> = {};
      const allDates: string[] = [];

      for (const slug of group.slugs) {
        const gameResults = await storage.getResultsByGameSlug(slug);
        gameResults.forEach(r => {
          if (!allDates.includes(r.drawDate)) {
            allDates.push(r.drawDate);
          }
        });
        const dateResult = gameResults.find(r => r.drawDate === date);
        if (dateResult) {
          results[slug] = dateResult;
        }
      }

      allDates.sort((a, b) => a.localeCompare(b));
      const dateIndex = allDates.indexOf(date);
      const previousDate = dateIndex > 0 ? allDates[dateIndex - 1] : null;
      const nextDate = dateIndex < allDates.length - 1 ? allDates[dateIndex + 1] : null;

      res.json({
        date,
        groupSlug,
        groupName: group.name,
        results,
        previousDate,
        nextDate,
        variants: group.slugs
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch date results" });
    }
  });

  app.get("/api/statistics/:gameSlug", async (req, res) => {
    try {
      const allResults = await storage.getResultsByGameSlug(req.params.gameSlug);
      const drawCount = parseInt(req.query.draws as string) || 15;

      if (allResults.length === 0) {
        return res.json({
          hotNumbers: [],
          coldNumbers: [],
          frequencyMap: {},
          dateRange: { from: null, to: null },
          totalDraws: 0
        });
      }

      const results = allResults.slice(0, drawCount);
      const dateRange = {
        from: results[results.length - 1]?.drawDate || null,
        to: results[0]?.drawDate || null
      };

      const frequencyMap: Record<number, number> = {};
      const parseNumbers = (nums: number[] | string) => {
        if (Array.isArray(nums)) return nums;
        try {
          const parsed = JSON.parse(nums);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      };

      results.forEach(result => {
        parseNumbers(result.winningNumbers as any).forEach((num: number) => {
          frequencyMap[num] = (frequencyMap[num] || 0) + 1;
        });
      });

      const sortedNumbers = Object.entries(frequencyMap)
        .map(([num, count]) => ({ number: parseInt(num), count }))
        .sort((a, b) => b.count === a.count ? a.number - b.number : b.count - a.count);

      const hotNumbers = sortedNumbers.slice(0, 5);

      const coldNumbers = [...sortedNumbers]
        .sort((a, b) => a.count === b.count ? a.number - b.number : a.count - b.count)
        .slice(0, 5);

      res.json({
        hotNumbers,
        coldNumbers,
        frequencyMap,
        dateRange,
        totalDraws: results.length,
        analyzedDraws: drawCount
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate statistics" });
    }
  });

  app.get("/api/scraper-settings", async (req, res) => {
    try {
      const settings = await storage.getScraperSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scraper settings" });
    }
  });

  app.post("/api/scraper-settings", async (req, res) => {
    try {
      const { gameSlug, isEnabled, scheduleTime } = req.body;

      if (!gameSlug || typeof gameSlug !== 'string') {
        return res.status(400).json({ error: "gameSlug is required" });
      }

      const setting = await storage.upsertScraperSetting({
        gameSlug,
        isEnabled: isEnabled ?? true,
        scheduleTime: scheduleTime || null,
        lastScrapedAt: null,
      });
      res.json(setting);
    } catch (error) {
      console.error("Error saving scraper setting:", error);
      res.status(500).json({ error: "Failed to save scraper setting" });
    }
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const games = await storage.getGames();
      const news = await storage.getPublishedNews();
      const allResults = await storage.getResults();
      const baseUrl = `https://${req.get('host')}`;

      const staticPages = [
        { url: "/", priority: "1.0", changefreq: "daily" },
        { url: "/lotto-result/yesterday", priority: "0.9", changefreq: "daily" },
        { url: "/powerball-result/yesterday", priority: "0.9", changefreq: "daily" },
        { url: "/daily-lotto-result/yesterday", priority: "0.9", changefreq: "daily" },
        { url: "/sa-lotto-result/yesterday", priority: "0.9", changefreq: "daily" },
        { url: "/news", priority: "0.8", changefreq: "daily" },
        { url: "/about", priority: "0.5", changefreq: "monthly" },
        { url: "/contact", priority: "0.5", changefreq: "monthly" },
        { url: "/privacy", priority: "0.3", changefreq: "yearly" },
      ];

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      staticPages.forEach(page => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += `  </url>\n`;
      });

      games.forEach(game => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/game/${game.slug}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/draw-history/${game.slug}</loc>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      });

      const datesByGroup: Record<string, Set<string>> = {};
      for (const [groupSlug, group] of Object.entries(LOTTERY_GROUPS)) {
        datesByGroup[groupSlug] = new Set();
      }

      allResults.forEach(result => {
        const groupInfo = getGroupForSlug(result.gameSlug);
        if (groupInfo) {
          datesByGroup[groupInfo.groupSlug].add(result.drawDate);
        }
      });

      for (const [groupSlug, dates] of Object.entries(datesByGroup)) {
        const sortedDates = Array.from(dates).sort((a, b) => b.localeCompare(a));
        sortedDates.forEach(date => {
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}/${groupSlug}-result/${date}</loc>\n`;
          xml += `    <changefreq>never</changefreq>\n`;
          xml += `    <priority>0.6</priority>\n`;
          xml += `  </url>\n`;
        });
      }

      news.forEach(article => {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/news/${article.slug}</loc>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.6</priority>\n`;
        xml += `  </url>\n`;
      });

      xml += '</urlset>';

      res.set('Cache-Control', 'no-store');
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  return httpServer;
}
