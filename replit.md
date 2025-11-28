# African Lottery Results Website

## Overview
A lottery results news website for Africa, similar to africanlottery.net. Features include displaying South African lottery results (Powerball, Lotto, Daily Lotto, etc.), lottery news articles, and an admin panel for data management with web scraping capabilities.

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: In-memory storage (MemStorage)
- **Web Scraping**: Cheerio, Axios
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
│   │   ├── news.tsx
│   │   ├── news-article.tsx
│   │   ├── admin-login.tsx
│   │   ├── admin-dashboard.tsx
│   │   ├── admin-results.tsx
│   │   └── admin-news.tsx
│   └── App.tsx          # Main app with routing
├── server/
│   ├── routes.ts        # API endpoints
│   ├── storage.ts       # In-memory data storage
│   └── scraper.ts       # Web scraper for lottery results
└── shared/
    └── schema.ts        # Data models and Zod schemas
```

## Features
1. **Public Pages**:
   - Homepage with latest lottery results
   - Individual game pages with result history
   - News section with article listings
   - Individual article pages

2. **Admin Panel** (password: admin123):
   - Login page at /admin
   - Dashboard at /admin/dashboard
   - CRUD operations for lottery results
   - CRUD operations for news articles
   - Web scraper to fetch latest results

3. **Lottery Games Supported**:
   - Powerball
   - Powerball Plus
   - Lotto
   - Lotto Plus 1
   - Lotto Plus 2
   - Daily Lotto
   - Daily Lotto Plus

## API Endpoints
- `GET /api/games` - List all lottery games
- `GET /api/games/:slug` - Get game by slug
- `GET /api/results` - List all results
- `GET /api/results/latest` - Get latest results per game
- `GET /api/results/game/:slug` - Get results by game
- `POST /api/results` - Create new result
- `PATCH /api/results/:id` - Update result
- `DELETE /api/results/:id` - Delete result
- `GET /api/news` - List all news articles
- `GET /api/news/:slug` - Get article by slug
- `POST /api/news` - Create new article
- `PATCH /api/news/:id` - Update article
- `DELETE /api/news/:id` - Delete article
- `POST /api/admin/login` - Admin authentication
- `POST /api/scrape` - Trigger web scraper

## Running the Project
The workflow named 'Start application' runs `npm run dev` which starts the Express backend and Vite frontend on port 5000.

## Design
- Uses Inter font for UI and Roboto Mono for lottery numbers
- Color scheme with blue primary and orange accent for lottery balls
- Dark mode support with theme toggle
- Responsive design for mobile and desktop
