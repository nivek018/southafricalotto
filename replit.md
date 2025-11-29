# African Lottery Results Website

## Overview
A lottery results news website for Africa, similar to africanlottery.net. Features include displaying South African lottery results (Powerball, Lotto, Daily Lotto, etc.), lottery news articles, and an admin panel for data management with web scraping capabilities.

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI, react-helmet-async (SEO)
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Web Scraping**: Cheerio, Axios (with random user agents and retry logic)
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter

## Project Structure
```
├── client/src/
│   ├── components/       # Reusable UI components
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── lottery-ball.tsx
│   │   ├── lottery-result-card.tsx
│   │   ├── news-card.tsx
│   │   ├── loading-skeleton.tsx
│   │   └── theme-toggle.tsx
│   ├── pages/           # Page components
│   │   ├── home.tsx
│   │   ├── game.tsx
│   │   ├── lotto-result-yesterday.tsx    # SEO-optimized yesterday page (all games)
│   │   ├── powerball-result-yesterday.tsx # Powerball games yesterday
│   │   ├── daily-lotto-result-yesterday.tsx # Daily Lotto games yesterday
│   │   ├── draw-history.tsx
│   │   ├── news.tsx
│   │   ├── news-article.tsx
│   │   ├── about.tsx
│   │   ├── contact.tsx
│   │   ├── privacy.tsx
│   │   ├── admin-login.tsx
│   │   └── admin-dashboard.tsx
│   └── App.tsx          # Main app with routing
├── server/
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # Database storage (PostgreSQL)
│   ├── db.ts            # Database connection
│   ├── scraper.ts       # Web scraper with random headers and retry logic
│   └── logger.ts        # Debug logging with 14-day retention (SAST timezone)
└── shared/
    └── schema.ts        # Data models and Zod schemas
```

## Features
1. **Public Pages**:
   - Homepage with latest lottery results
   - Grouped game pages showing all variants together:
     - /game/powerball shows Powerball + Powerball Plus
     - /game/lotto shows Lotto + Lotto Plus 1 + Lotto Plus 2
     - /game/daily-lotto shows Daily Lotto + Daily Lotto Plus
   - Individual game pages with "View Complete Draw History" button
   - SEO-optimized Yesterday pages with cross-navigation links:
     - /lotto-result/yesterday (all games)
     - /powerball-result/yesterday (Powerball & Powerball Plus)
     - /daily-lotto-result/yesterday (Daily Lotto & Daily Lotto Plus)
     - /sa-lotto-result/yesterday (Lotto, Lotto Plus 1 & Lotto Plus 2 - Wed/Sat draws)
   - Enhanced Draw History page (/draw-history/:slug) with:
     - Date picker (greys out dates with no records)
     - Monthly view navigation
     - Last 7 draws default display
   - News section with article listings
   - Individual article pages
   - About, Contact, and Privacy Policy pages
   - Lottery numbers sorted lowest to highest (bonus ball excluded)

2. **Admin Panel** (password: admin123):
   - Login page at /encode
   - Dashboard at /encode/dashboard with tabs:
     - Results: CRUD operations for lottery results (Hot/Cold numbers calculated programmatically via /api/statistics)
     - News: CRUD operations for news articles
     - Settings: Scraper configuration per game
   - Web scraper to fetch latest results with "Scrape Now" button
   - Per-game scraper toggles and schedule configuration
   - Deduplication logic prevents duplicate results from manual encoding + web scraping (checks gameSlug + drawDate)

3. **Lottery Games Supported**:
   - Powerball
   - Powerball Plus
   - Lotto
   - Lotto Plus 1
   - Lotto Plus 2
   - Daily Lotto
   - Daily Lotto Plus

4. **SEO Features**:
   - Dynamic sitemap.xml generation
   - Meta tags for social sharing

## API Endpoints
### Public Endpoints
- `GET /api/games` - List all lottery games
- `GET /api/games/:slug` - Get game by slug
- `GET /api/results` - List all results
- `GET /api/results/latest` - Get latest results per game
- `GET /api/results/game/:slug` - Get results by game
- `GET /api/results/group/:groupSlug` - Get grouped results for lottery families (powerball, lotto, daily-lotto)
- `GET /api/results/yesterday` - Get yesterday's results
- `GET /api/news` - List all news articles
- `GET /api/news/:slug` - Get article by slug
- `GET /api/statistics/:gameSlug` - Get hot/cold number statistics
- `GET /sitemap.xml` - Dynamic sitemap

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `POST /api/results` - Create new result
- `PATCH /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result
- `POST /api/news` - Create new article
- `PATCH /api/news/:id` - Update article
- `DELETE /api/news/:id` - Delete article
- `POST /api/scrape` - Trigger web scraper
- `GET /api/scraper-settings` - Get all scraper settings
- `GET /api/scraper-settings/:gameSlug` - Get settings for specific game
- `POST /api/scraper-settings` - Create/update scraper settings

## Database Schema
- **games**: id, name, slug, description, drawDays, drawTime
- **lotteryResults**: id, gameSlug, drawDate, winningNumbers, bonusNumbers, jackpot, drawNumber
- **newsArticles**: id, title, slug, excerpt, content, imageUrl, published, publishedAt
- **scraperSettings**: id, gameSlug, enabled, scheduleTime, lastScraped

## Running the Project
The workflow named 'Start application' runs `npm run dev` which starts the Express backend and Vite frontend on port 5000.

## Database Commands
- `npm run db:push` - Push schema changes to PostgreSQL
- `npm run db:push --force` - Force push with data loss warning override

## Design
- Uses Inter font for UI and Roboto Mono for lottery numbers
- Color scheme with blue primary and orange accent for lottery balls
- Dark mode support with theme toggle
- Responsive design for mobile and desktop

## Recent Changes (November 2025)
- Migrated from in-memory storage to PostgreSQL with Drizzle ORM
- Added idempotent database initialization (prevents duplicate data on restart)
- Added navigation links in header and footer for all pages
- Added /sitemap.xml endpoint for SEO
- Added /api/statistics/:gameSlug endpoint for hot/cold number analysis
- Added admin settings tab with per-game scraper configuration
- Fixed optional chaining for winningNumbers in components
- Restructured URLs to SEO-friendly paths: /lotto-result/yesterday (all games), /powerball-result/yesterday (Powerball games), /daily-lotto-result/yesterday (Daily Lotto games)
- Implemented debug logging system with 14-day retention in SAST timezone
- Added comprehensive SEO meta tags (title, description, keywords) to all pages using react-helmet-async
- Enhanced scraper with diverse random headers, retry logic, and logging integration
- Sorted lottery numbers in ascending order across all display components (excluding bonus ball)
- Hidden admin URL changed to /encode with updated routes and navigation
- Updated sitemap.xml with new SEO-friendly routes and hidden admin path
- Created /api/results/yesterday endpoint with SAST timezone filtering
- Removed Hot/Cold number input fields from admin panel (now calculated programmatically via /api/statistics endpoint)
- Added deduplication logic to prevent conflicts between manual encoding and web scraping (checks gameSlug + drawDate)
- Created dedicated /lotto-sa-result/yesterday page for Lotto SA games (Lotto, Lotto Plus 1, Lotto Plus 2) with Wed/Sat draw filtering
- Enhanced draw-history pages with date picker, monthly view, and last 7 draws default display
- Added cross-navigation links between all yesterday result pages
- Fixed React hooks error in game.tsx by moving useEffect before conditional returns
- Added "View Complete Draw History" button to individual game pages
- Added LOTTERY_GROUPS constant in shared/schema.ts for grouping lottery families
- Created /api/results/group/:groupSlug endpoint for fetching grouped results
- Updated game pages to show all variants together (e.g., /game/powerball shows Powerball + Powerball Plus)
