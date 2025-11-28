import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { scrapeLotteryResults } from "./scraper";
import { 
  insertLotteryResultSchema, 
  insertNewsArticleSchema,
  adminLoginSchema 
} from "@shared/schema";
import { z } from "zod";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

  app.get("/api/results/game/:slug", async (req, res) => {
    try {
      const results = await storage.getResultsByGameSlug(req.params.slug);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game results" });
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
      
      const result = await storage.createResult(parsed.data);
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
      const scrapedResults = await scrapeLotteryResults();
      
      let addedCount = 0;
      for (const result of scrapedResults) {
        const existingResults = await storage.getResultsByGameSlug(result.gameSlug);
        const exists = existingResults.some(
          r => r.drawDate === result.drawDate && r.gameSlug === result.gameSlug
        );
        
        if (!exists) {
          await storage.createResult(result);
          addedCount++;
        }
      }
      
      res.json({ 
        success: true, 
        message: `Scraped ${scrapedResults.length} results, added ${addedCount} new results`,
        scraped: scrapedResults.length,
        added: addedCount
      });
    } catch (error) {
      console.error("Scraping error:", error);
      res.status(500).json({ 
        error: "Failed to scrape results",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  return httpServer;
}
