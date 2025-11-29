# African Lottery Results Website - Debugging Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Data Flow](#architecture--data-flow)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Structure](#frontend-structure)
6. [Admin Panel Guide](#admin-panel-guide)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Debugging Checklist](#debugging-checklist)

---

## Project Overview

**African Lottery Results Website** - A full-stack lottery results platform for South African lottery games.

### Tech Stack
- **Backend**: Express.js + Node.js
- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter (Frontend), Express (Backend)
- **Web Scraping**: Cheerio + Axios with retry logic

### Key Features
- Live lottery results display (Powerball, Lotto, Daily Lotto and their Plus variants)
- Admin panel for managing results and news
- Web scraper for automated result fetching
- Hot/Cold number analysis
- News section with articles
- SEO-optimized pages
- Dark mode support

---

## Architecture & Data Flow

### Overall Flow
```
User Browser
    ↓
Vite Dev Server (Port 5000)
    ├── Frontend (React App)
    │   ├── Pages (Wouter Router)
    │   ├── Components (Shadcn UI)
    │   └── TanStack Query (Data fetching)
    │
    └── Express Backend (Same Port)
        ├── API Routes (/api/*)
        ├── Authentication (/encode)
        ├── Database Operations (Drizzle ORM)
        └── Web Scraper (Optional)
            ↓
        PostgreSQL Database
```

### Request Lifecycle
1. **Frontend Request**: Component calls `useQuery()` or `useMutation()`
2. **TanStack Query**: Sends HTTP request to Express backend
3. **Backend Route Handler**: Validates request, queries database via storage layer
4. **Database**: Drizzle ORM executes SQL on PostgreSQL
5. **Response**: Data returned to frontend, cached by TanStack Query
6. **UI Update**: React component re-renders with new data

### Data Flow Layers

```
Frontend (client/src/)
    ↓
API Requests via @lib/queryClient
    ↓
Backend Routes (server/routes.ts)
    ↓
Storage Interface (server/storage.ts)
    ↓
Drizzle ORM (server/db.ts)
    ↓
PostgreSQL Database
```

---

## Database Schema

### Tables

#### 1. **lottery_games**
Stores available lottery games (Powerball, Lotto, etc.)
```
- id (varchar, UUID, PK)
- name (text) - Game display name
- slug (text, UNIQUE) - URL-friendly identifier
- description (text)
- numberCount (integer) - How many numbers to pick
- maxNumber (integer) - Maximum number value
- hasBonusBall (boolean)
- bonusMaxNumber (integer)
- drawDays (text[]) - e.g., ["Tuesday", "Friday"]
- drawTime (text) - e.g., "20:58"
- isActive (boolean)
```

#### 2. **lottery_results**
Stores lottery draw results
```
- id (varchar, UUID, PK)
- gameId (varchar, FK)
- gameName (text) - e.g., "Powerball"
- gameSlug (text) - e.g., "powerball"
- winningNumbers (integer[]) - Sorted array of numbers
- bonusNumber (integer) - Optional bonus/powerball
- drawDate (text) - ISO date format: "YYYY-MM-DD"
- jackpotAmount (text) - e.g., "R 1,234,567"
- nextJackpot (text)
```

#### 3. **news_articles**
Stores lottery news and information
```
- id (varchar, UUID, PK)
- title (text)
- slug (text, UNIQUE) - URL identifier
- excerpt (text)
- content (text) - Full article content
- imageUrl (text)
- category (text) - e.g., "news", "tips", "promotions"
- publishDate (text) - ISO date: "YYYY-MM-DD"
- isPublished (boolean)
```

#### 4. **scraper_settings**
Configuration for automated result scraping
```
- id (varchar, UUID, PK)
- gameSlug (text, UNIQUE)
- isEnabled (boolean) - Whether scraper runs for this game
- scheduleTime (text) - When to scrape (e.g., "21:30")
- lastScrapedAt (text) - Last successful scrape timestamp
```

#### 5. **users**
(Placeholder for future authentication)
```
- id (varchar, UUID, PK)
- username (text, UNIQUE)
- password (text)
```

### Key Relationships
- Results are linked to Games via `gameSlug`
- No explicit foreign keys; relationships are maintained via slug matching
- Scraper settings are per-game via `gameSlug`

---

## API Endpoints

### Public Endpoints (No Authentication)

#### Games
```
GET /api/games
→ Returns: LotteryGame[]
Used by: Homepage, Game selector

GET /api/games/:slug
→ Returns: LotteryGame
Used by: Individual game pages
```

#### Results
```
GET /api/results
→ Returns: LotteryResult[] (ordered by drawDate DESC)
Used by: Admin panel result listing

GET /api/results/latest
→ Returns: LotteryResult[] (one per game, latest draw)
Used by: Homepage Latest Results section
→ SORTING: Lotto, Lotto Plus 1, Lotto Plus 2, Powerball, Powerball Plus, Daily Lotto, Daily Lotto Plus

GET /api/results/game/:slug
→ Returns: LotteryResult[] (for specific game, ordered by drawDate DESC)
Used by: Individual game pages, Draw History

GET /api/results/group/:groupSlug
→ Returns: { group, latestResults, allResults }
Example: /api/results/group/powerball → Powerball + Powerball Plus
Groups: powerball, lotto, daily-lotto

GET /api/results/yesterday
→ Returns: LotteryResult[] for yesterday's draws (SAST timezone)
Used by: Yesterday result pages

GET /api/results/today
→ Returns: { date, games: {game, result}[] }
All games with their results or null if not drawn yet
Used by: Lotto Result Today page

GET /api/results/:id
→ Returns: LotteryResult
Individual result by ID
```

#### Statistics
```
GET /api/statistics/:gameSlug?draws=N
→ Returns: { hotNumbers, coldNumbers, totalDraws, dateRange }
Hot Numbers: Top 5 most frequently drawn
Cold Numbers: Top 5 least frequently drawn
Used by: Game pages for Hot/Cold number display
```

#### News
```
GET /api/news
→ Returns: NewsArticle[] (all, published and unpublished)
Used by: Admin panel

GET /api/news/published
→ Returns: NewsArticle[] (published only)
Used by: Frontend news section

GET /api/news/:slug
→ Returns: NewsArticle
Individual article by slug
```

#### Sitemap
```
GET /sitemap.xml
→ Returns: XML sitemap
Includes: All pages and date-specific pages for last 90 days
```

### Admin Endpoints (Hidden)

#### Authentication
```
POST /api/admin/login
Body: { password: string }
Returns: { success: true }
→ Default password: "admin123" (from ADMIN_PASSWORD env var)
→ Frontend stores auth state in localStorage as "adminAuth"
```

#### Results Management
```
POST /api/results
Body: { gameId, gameName, gameSlug, winningNumbers, bonusNumber, drawDate, jackpotAmount, nextJackpot }
Returns: LotteryResult
→ Validates via insertLotteryResultSchema
→ Deduplication: Checks if gameSlug + drawDate already exists

PATCH /api/results/:id
Body: Partial result object (any fields to update)
Returns: LotteryResult

DELETE /api/results/:id
Returns: { success: true }
```

#### News Management
```
POST /api/news
Body: { title, slug, excerpt, content, imageUrl, category, publishDate, isPublished }
Returns: NewsArticle

PATCH /api/news/:id
Body: Partial article object
Returns: NewsArticle

DELETE /api/news/:id
Returns: { success: true }
```

#### Scraper
```
POST /api/scrape
→ Triggers web scraper for all enabled games
→ Checks scraperSettings.isEnabled for each game
→ Saves new results, skips duplicates (gameSlug + drawDate)
Returns: { success: true, message, results }
```

#### Scraper Settings
```
GET /api/scraper-settings
→ Returns: ScraperSetting[] (all games)

GET /api/scraper-settings/:gameSlug
→ Returns: ScraperSetting (specific game)

POST /api/scraper-settings
Body: { gameSlug, isEnabled, scheduleTime }
→ Creates new setting or updates existing (upsert)
Returns: ScraperSetting
```

---

## Frontend Structure

### Routing (client/src/App.tsx via Wouter)

```
/                           → HomePage (Latest Results + News)
/game/:slug                 → GamePage (Powerball, Lotto, Daily Lotto grouped display)
/draw-history/:slug         → DrawHistoryPage (Date picker + historical results)
/lotto-result/today         → LottoResultTodayPage (All games for today with TBA)
/lotto-result/yesterday     → LottoResultYesterdayPage (All games from yesterday)
/lotto-result/:date         → DateResultPage (SEO: specific date results)
/powerball-result/:date     → DateResultPage (SEO: specific date results)
/daily-lotto-result/:date   → DateResultPage (SEO: specific date results)
/powerball-result/yesterday → PowerballResultYesterdayPage (Powerball + Plus)
/daily-lotto-result/yesterday → DailyLottoResultYesterdayPage (Daily Lotto + Plus)
/sa-lotto-result/yesterday  → LottoSaResultYesterdayPage (Lotto + Plus 1 & 2, Wed/Sat only)
/news                       → NewsPage (Article listing)
/news/:slug                 → NewsArticlePage (Individual article)
/about                      → AboutPage
/contact                    → ContactPage
/privacy                    → PrivacyPolicyPage
/encode                     → AdminLoginPage (Password entry)
/encode/dashboard           → AdminDashboard (Main admin panel)
```

### Page Components Structure

#### Public Pages
- **Home** (`home.tsx`): Latest results grid (sorted), News section
- **Game** (`game.tsx`): Grouped games (e.g., Powerball + Powerball Plus), countdown timer, Hot/Cold numbers, How to Play, FAQs
- **Draw History** (`draw-history.tsx`): Date picker, monthly view, 7-day default display
- **Date Result** (`date-result.tsx`): Results for specific date, prev/next navigation
- **Today/Yesterday/Date-Specific Pages**: Result displays with Reminders and FAQs sections

#### Admin Pages
- **Admin Login** (`admin-login.tsx`): Password entry, sets localStorage["adminAuth"]
- **Admin Dashboard** (`admin-dashboard.tsx`): Main admin panel with tabs
- **Admin Results** (`admin-results.tsx`): CRUD for lottery results, deduplication
- **Admin News** (`admin-news.tsx`): CRUD for news articles

### Key Hooks & Libraries
- `useQuery()`: Fetch data (TanStack Query)
- `useMutation()`: POST/PATCH/DELETE (TanStack Query)
- `useLocation()`: Get/set current URL (Wouter)
- `useToast()`: Show notifications
- `queryClient.invalidateQueries()`: Refetch data after mutations

### TanStack Query Usage

```typescript
// Fetching
const { data, isLoading } = useQuery({
  queryKey: ["/api/results/latest"],
  // No queryFn needed - default fetcher configured
});

// Mutating
const mutation = useMutation({
  mutationFn: (newResult) => apiRequest("POST", "/api/results", newResult),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/results"] });
  }
});
```

### Cache Invalidation Pattern
After mutations, invalidate affected queries:
```typescript
// Create result → invalidate results lists
queryClient.invalidateQueries({ queryKey: ["/api/results"] });
queryClient.invalidateQueries({ queryKey: ["/api/results/latest"] });

// Update news → invalidate news queries
queryClient.invalidateQueries({ queryKey: ["/api/news"] });
```

---

## Admin Panel Guide

### Access
- **URL**: `/encode` (hidden URL path)
- **Password**: "admin123" (configurable via ADMIN_PASSWORD env var)
- **Storage**: Auth state stored in localStorage["adminAuth"]

### Admin Dashboard Tabs

#### 1. Results Tab
**Function**: Create, Read, Update, Delete lottery results

**Operations**:
- **View Results**: Table of all results (most recent first)
- **Create**: Form to manually enter draw results
  - Select game, enter numbers (comma-separated), bonus number, draw date, jackpot amounts
  - Validates via Zod schema
  - Checks for duplicates: gameSlug + drawDate (prevents manual + scraper conflicts)
- **Update**: Click result to edit, change any field
- **Delete**: Remove result with confirmation

**Form Fields**:
- Game (dropdown selector)
- Winning Numbers (comma-separated, e.g., "1,5,12,24,38,45")
- Bonus Number (optional)
- Draw Date (date picker)
- Jackpot Amount (text, e.g., "R 1,234,567")
- Next Jackpot (text, e.g., "R 2,000,000")

**Deduplication Logic**:
- Before creating: Check if `gameSlug + drawDate` already exists
- If exists: Show warning, don't allow duplicate
- Prevents conflicts between manual entry and web scraper

#### 2. News Tab
**Function**: Manage news articles

**Operations**:
- **View Articles**: All articles (published and unpublished)
- **Create**: New article form
  - Title, slug (auto-generate or manual), excerpt, content, category, image URL, publish date, published flag
- **Update**: Edit existing article
- **Delete**: Remove article

**Categories**: news, tips, promotions, general

#### 3. Settings Tab
**Function**: Configure automated web scraper

**Per-Game Controls**:
- **Toggle Enable/Disable**: Toggle switch for each game
  - When enabled: Scraper will attempt to fetch results for this game
  - When disabled: Scraper skips this game
- **Schedule Time**: Set when scraper should run
  - Format: HH:MM (e.g., "21:30")
  - Applies to each enabled game
- **Last Scraped**: Timestamp when results were last successfully fetched

**Scrape Now Button**:
- Manually trigger scraper immediately
- Scrapes all enabled games in scraperSettings
- Shows success/failure toast notification
- Invalidates result caches to show new data

**How Scraper Works**:
1. Gets all scraperSettings where isEnabled = true
2. For each enabled game, fetches results from source website
3. Parses HTML via Cheerio
4. Creates new LotteryResult if gameSlug + drawDate doesn't exist
5. Logs scrape activity with timestamps

### Authentication Flow

```
User visits /encode
↓
Enters password "admin123"
↓
POST /api/admin/login { password }
↓
Backend validates password === ADMIN_PASSWORD
↓
Frontend receives success
↓
localStorage.setItem("adminAuth", true)
↓
Redirects to /encode/dashboard
↓
AdminDashboard useEffect checks localStorage["adminAuth"]
↓
If missing: redirects back to /encode
If present: Shows dashboard
```

### Logout
- Removes localStorage["adminAuth"]
- Redirects to /encode
- Clears all admin state

---

## Common Issues & Solutions

### Issue 1: Results showing in wrong order on homepage
**Symptom**: Results displayed as Daily Lotto, then Powerball, then Lotto

**Root Cause**: `/api/results/latest` returns unordered results; sorting should happen in frontend

**Solution**: Check `home.tsx` line 63-74 for sort function:
```typescript
[...results].sort((a, b) => {
  const order: Record<string, number> = {
    'lotto': 1,
    'lotto-plus-1': 2,
    'lotto-plus-2': 3,
    'powerball': 4,
    'powerball-plus': 5,
    'daily-lotto': 6,
    'daily-lotto-plus': 7,
  };
  return (order[a.gameSlug] || 99) - (order[b.gameSlug] || 99);
})
```

**Debug**: Console log `results` before and after sort to verify game slugs

### Issue 2: Hot/Cold numbers not showing on game pages
**Symptom**: "No hot/cold numbers displayed" or loading spinner hangs

**Possible Causes**:
- `/api/statistics/:gameSlug?draws=15` endpoint not called
- Not enough historical data (< 15 draws)
- gameSlug parameter incorrect

**Debug Steps**:
1. Open browser DevTools → Network tab
2. Navigate to `/game/powerball`
3. Check for request: `GET /api/statistics/powerball?draws=15`
4. Check response: Should have `hotNumbers[]` and `coldNumbers[]`
5. If error: Check backend logs

**Solution**: Verify `game.tsx` line 200-202:
```typescript
const { data: statistics } = useQuery<StatisticsResponse>({
  queryKey: [`/api/statistics/${mainGameSlug}?draws=15`],
  enabled: !!mainGameSlug,
});
```

### Issue 3: Admin login not working
**Symptom**: Password rejected even with correct password

**Root Cause**: ADMIN_PASSWORD env var not set, or localStorage issue

**Debug Steps**:
1. Check env var: `echo $ADMIN_PASSWORD` in terminal
2. If not set: Set via Replit Secrets tab or `.env.local`
3. Check browser localStorage: DevTools → Application → Storage → localStorage
4. Look for key: "adminAuth" (should be "true" if logged in)

**Solution**:
- Set `ADMIN_PASSWORD="admin123"` in Secrets (default if not set)
- Clear localStorage: DevTools → Application → Storage → Clear All
- Reload page and try again

### Issue 4: Duplicate results showing from scraper
**Symptom**: Same draw appears twice in admin panel

**Root Cause**: Deduplication check failing

**Debug**:
1. Check if both have same `gameSlug` and `drawDate`
2. One might be from manual entry, one from scraper
3. The check should prevent this

**Solution**: 
- In admin: Delete one result
- Check server logs for dedup messages
- Verify `createResult()` in `server/storage.ts` includes dedup check

### Issue 5: Scraper not fetching new results
**Symptom**: "Scrape Now" button runs but no new results appear

**Possible Causes**:
- Scraper disabled for that game in Settings tab
- Source website structure changed (scraper HTML parsing failed)
- Network error or timeout

**Debug Steps**:
1. Go to Admin → Settings tab
2. Verify game has toggle enabled
3. Check browser console for network errors
4. Check server logs for scraper errors
5. Manual backup: Use Admin → Results tab to manually enter results

### Issue 6: Dark theme not applying on first visit
**Symptom**: Site loads in light mode by default

**Root Cause**: localStorage.theme not set, system preference not used

**Solution**: Check `client/src/components/theme-toggle.tsx` line 9:
```typescript
const [isDark, setIsDark] = useState(true); // Default is true (dark mode)
```

**Fixed**: Should set isDark to true by default, dark class added to document.documentElement on mount

### Issue 7: Date-specific pages returning 404
**Symptom**: `/lotto-result/2025-11-29` shows 404 or no results

**Root Cause**: Date format issue or no results for that date

**Debug**:
1. Verify date format: Must be `YYYY-MM-DD`
2. Check if results exist in that date via `/api/results`
3. Look for results with matching `drawDate`

**Solution**: Use DateResultPage with proper date format

### Issue 8: TanStack Query cache not updating after mutation
**Symptom**: Create/update result, but old data still shows

**Root Cause**: `queryClient.invalidateQueries()` not called or wrong queryKey

**Debug**: Add console.log in mutation onSuccess:
```typescript
onSuccess: () => {
  console.log("Mutation success, invalidating...");
  queryClient.invalidateQueries({ queryKey: ["/api/results"] });
}
```

**Solution**: Ensure exact queryKey matches the useQuery call

### Issue 9: SAST timezone calculations incorrect
**Symptom**: Yesterday's results showing wrong date

**Root Cause**: SAST offset calculation (UTC+2) wrong

**Code** (should be in multiple places):
```typescript
const sastOffset = 2 * 60; // UTC+2, 120 minutes
const localOffset = now.getTimezoneOffset(); // User's local offset
const sastTime = new Date(now.getTime() + (sastOffset + localOffset) * 60000);
```

**Debug**: Log dates in browser console to verify

### Issue 10: Admin page not accessible, stuck redirecting
**Symptom**: Visiting `/encode/dashboard` redirects to `/encode` continuously

**Root Cause**: localStorage["adminAuth"] not set or cleared

**Debug**:
1. Open DevTools → Application → Storage → localStorage
2. Check for "adminAuth" key
3. If missing: Go to `/encode`, login again

**Solution**: Login process should set localStorage, then redirect

---

## Debugging Checklist

### Frontend Debugging

- [ ] Open browser DevTools (F12)
- [ ] Check Console tab for JavaScript errors
- [ ] Check Network tab:
  - [ ] Are API requests being made?
  - [ ] Are responses 200 OK or error codes?
  - [ ] Are response bodies what you expect?
- [ ] Check Application tab:
  - [ ] localStorage values set correctly?
  - [ ] sessionStorage empty (or expected)?
  - [ ] Cookies present?
- [ ] Check Elements tab:
  - [ ] DOM elements rendering?
  - [ ] CSS classes applied?
  - [ ] Dark mode class "dark" on documentElement?
- [ ] TanStack Query DevTools (if installed):
  - [ ] Cache keys and state?
  - [ ] Query status (loading/success/error)?

### Backend Debugging

- [ ] Check workflow logs: `/tmp/logs/Start_application_*.log`
- [ ] Monitor server startup:
  - [ ] "Database already has data, skipping initialization" = expected
  - [ ] "serving on port 5000" = server started
- [ ] Check express logs:
  - [ ] Request method and path
  - [ ] Response status code
  - [ ] Response time
  - [ ] Example: `6:02:04 AM [express] GET /api/games 304 in 118ms`
- [ ] Add console.log to routes.ts for debugging:
  ```typescript
  console.log("Creating result:", insertResult);
  const result = await storage.createResult(insertResult);
  console.log("Result created:", result);
  ```

### Database Debugging

- [ ] Check if tables exist: `npm run db:push` (dry run by default, shows what would change)
- [ ] View table schema: Use Replit Database panel or query directly
- [ ] Verify data exists: Query via Replit Database panel or API
- [ ] Check for duplicates: Run SQL query in Replit Database
  ```sql
  SELECT gameSlug, drawDate, COUNT(*) FROM lottery_results 
  GROUP BY gameSlug, drawDate 
  HAVING COUNT(*) > 1;
  ```

### Admin Panel Debugging

- [ ] Verify login:
  - [ ] Check console for POST /api/admin/login response
  - [ ] Verify localStorage["adminAuth"] set
- [ ] Check scraper:
  - [ ] Settings tab: Is game toggle enabled?
  - [ ] Last scraped timestamp updated?
  - [ ] Check server logs for scraper errors
- [ ] Verify deduplication:
  - [ ] Try creating duplicate result
  - [ ] Should show error about existing result
  - [ ] Check database for duplicates

### Performance Debugging

- [ ] Check DevTools Performance tab:
  - [ ] Page load time?
  - [ ] Interaction to paint time?
  - [ ] Long tasks blocking main thread?
- [ ] Check TanStack Query cache:
  - [ ] Is data being cached?
  - [ ] Are queries being refetched unnecessarily?
  - [ ] Can turn off automatic refetch for testing: `staleTime: Infinity`

### SEO Debugging

- [ ] Check meta tags in browser:
  - [ ] DevTools → Elements, search for `<meta name="description"`
  - [ ] Check title tag
  - [ ] Check Open Graph tags
- [ ] Test with SEO tools:
  - [ ] Lighthouse (DevTools → Lighthouse tab)
  - [ ] Schema.org validator for structured data

---

## Testing Workflow

### Manual Testing Checklist

#### Homepage
- [ ] Latest Results display in correct order (Lotto, Powerball, Daily Lotto)
- [ ] News section shows 3 articles
- [ ] Dark mode toggle works
- [ ] Navigation links work

#### Game Pages (/game/powerball, /game/lotto, /game/daily-lotto)
- [ ] Grouped variants display (e.g., Powerball + Powerball Plus)
- [ ] Hot & Cold numbers show with occurrence counts
- [ ] How to Play section displays
- [ ] FAQ accordion works
- [ ] Countdown timer shows days/hours/minutes (no seconds)

#### Result Pages
- [ ] Today page shows all 7 games with TBA or results
- [ ] Yesterday page shows only games from previous day
- [ ] Date-specific pages work with /lotto-result/2025-11-29 format
- [ ] Reminders and FAQs sections display on today/yesterday pages

#### Admin Panel
- [ ] Login with "admin123" works
- [ ] Results tab:
  - [ ] Can create new result
  - [ ] Can update existing result
  - [ ] Can delete result
  - [ ] Duplicate check works
- [ ] News tab:
  - [ ] Can create/update/delete articles
  - [ ] Slug auto-generates or allows manual
- [ ] Settings tab:
  - [ ] Can toggle scraper per game
  - [ ] Can set schedule time
  - [ ] "Scrape Now" button triggers scraper
- [ ] Logout removes auth and redirects

#### Responsive Design
- [ ] Mobile (375px width): All content readable, navigation works
- [ ] Tablet (768px width): Grid layout adjusts properly
- [ ] Desktop (1024px+ width): Full layout visible

#### Dark Mode
- [ ] Default is dark on first visit
- [ ] Toggle switches between dark and light
- [ ] localStorage persists preference

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Start dev server (Vite + Express)
npm run dev

# Push database schema changes
npm run db:push

# Force push if you're sure
npm run db:push --force

# Check logs
tail -f /tmp/logs/Start_application_*.log
```

---

## Environment Variables

```
# Backend
ADMIN_PASSWORD=admin123          # Admin panel password
DATABASE_URL=postgresql://...   # Auto-set by Replit
PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE  # Database config

# Frontend
VITE_API_BASE=http://localhost:5000  # API base URL (auto-set)
```

---

## File Structure Reference

```
project/
├── client/src/
│   ├── pages/
│   │   ├── home.tsx                    # Homepage with Latest Results
│   │   ├── game.tsx                    # Individual game pages
│   │   ├── admin-dashboard.tsx         # Admin main panel
│   │   ├── admin-results.tsx           # Admin results CRUD
│   │   ├── admin-news.tsx              # Admin news CRUD
│   │   ├── lotto-result-today.tsx      # Today's results
│   │   ├── lotto-result-yesterday.tsx  # Yesterday's results
│   │   └── ...other pages
│   ├── components/
│   │   ├── lottery-result-card.tsx     # Result display component
│   │   ├── lottery-ball.tsx            # Lottery ball UI
│   │   ├── theme-toggle.tsx            # Dark/Light mode toggle
│   │   └── ...other components
│   ├── lib/
│   │   └── queryClient.ts              # TanStack Query setup
│   ├── hooks/
│   │   └── use-countdown.ts            # Countdown timer hook
│   └── App.tsx                         # Router setup
├── server/
│   ├── routes.ts                       # API endpoints (500+ lines)
│   ├── storage.ts                      # Database operations
│   ├── db.ts                           # Database connection
│   ├── scraper.ts                      # Web scraper logic
│   ├── logger.ts                       # Logging utilities
│   └── index.ts                        # Server entry point
├── shared/
│   └── schema.ts                       # Data models & Zod schemas
└── package.json
```

---

## Summary

This guide covers the complete architecture, data flow, API endpoints, frontend structure, admin functionality, and debugging strategies for the African Lottery Results Website. Use this as your primary reference for understanding how the app works and solving problems.

**Key Takeaway**: The app follows a layered architecture (Frontend → API Routes → Storage Layer → Database) with clear separation of concerns. Use the API endpoints as documentation, leverage TanStack Query for caching, and always check browser DevTools + server logs when debugging.

Good luck! 🍀
