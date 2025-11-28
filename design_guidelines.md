# African Lottery Results Website - Design Guidelines

## Design Approach
**Selected Approach:** Design System (Material Design-inspired)
**Rationale:** Lottery results sites prioritize quick information scanning, data clarity, and consistent user experience. The content is information-dense with structured data (numbers, dates, jackpots) requiring excellent readability and scannable layouts.

**Key Design Principles:**
1. Information hierarchy - Results take visual priority
2. Scannable data presentation
3. Trust and credibility through clean, professional design
4. Mobile-first responsive approach

## Typography System

**Font Stack:** Google Fonts
- Primary: Inter (headings, UI elements) - weights 400, 600, 700
- Secondary: Roboto Mono (lottery numbers) - weight 500, 700

**Hierarchy:**
- H1 (Page titles): text-4xl lg:text-5xl, font-bold
- H2 (Game names): text-2xl lg:text-3xl, font-semibold
- H3 (Section headers): text-xl lg:text-2xl, font-semibold
- Body text: text-base lg:text-lg
- Lottery numbers: text-2xl lg:text-3xl, font-mono, font-bold
- Meta info (dates, stats): text-sm lg:text-base
- Admin labels: text-sm, font-medium

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Card padding: p-6 lg:p-8
- Section spacing: py-12 lg:py-16
- Grid gaps: gap-4 lg:gap-6
- Element margins: mb-4, mb-6, mb-8

**Container Strategy:**
- Max-width: max-w-7xl mx-auto
- Page padding: px-4 lg:px-8
- Cards: Full-width on mobile, grid on desktop

## Component Library

### Core Components

**1. Navigation Header**
- Sticky top navigation with site logo/title
- Horizontal menu links to game categories
- Mobile: Hamburger menu with slide-out drawer
- Height: h-16 lg:h-20

**2. Lottery Result Cards** (Homepage)
- Card layout with shadow and rounded corners (rounded-lg)
- Game title header section
- Lottery numbers displayed as circular badges in horizontal row
- Bonus number (if applicable) displayed separately with "+" prefix
- Draw date and jackpot estimate below numbers
- "View Details" link at bottom
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

**3. Number Badges**
- Circular containers: w-12 h-12 lg:w-16 lg:h-16
- Centered number display with mono font
- Rounded: rounded-full
- Spaced horizontally: gap-2 lg:gap-3
- Bonus numbers: Slightly larger or distinct border treatment

**4. Statistics Display**
- "Hot Number" and "Cold Number" indicators
- Inline layout with icon/label: flex items-center gap-2
- Small text size: text-sm

**5. News Article Cards**
- Card with image placeholder (aspect-ratio-16/9 or 4/3)
- Article title: text-lg font-semibold, line-clamp-2
- Excerpt: text-sm, line-clamp-3
- Date badge: text-xs
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

**6. Admin Panel**
- Clean form layouts with labeled inputs
- Table views for existing data
- Action buttons (Add, Edit, Delete)
- Form groups with mb-6 spacing
- Input fields: Full-width with p-3, rounded-md, border

**7. Data Tables** (Admin & Results History)
- Responsive table with horizontal scroll on mobile
- Striped rows for readability
- Column headers: font-semibold, text-sm
- Cell padding: px-4 py-3

### Navigation Patterns
- Top navbar with dropdown menus for game categories
- Breadcrumb navigation on detail pages
- "Back to Results" links
- Footer with quick links, contact info, disclaimer text

### Forms (Admin)
- Input groups with label above input
- Select dropdowns for game selection
- Number inputs for lottery balls
- Date pickers for draw dates
- Text areas for news content
- Submit buttons: Full-width on mobile, auto-width on desktop

## Page Layouts

**Homepage:**
- Hero banner with site title and tagline (h-32 lg:h-40)
- Featured latest results section
- Grid of lottery game cards (3-column on desktop)
- News highlights section below
- Footer

**Game Detail Pages:**
- Game header with title and description
- Latest result prominently displayed
- "Draw Summary" link/button
- Results history table
- Hot/cold numbers statistics sidebar (desktop)

**News Article Page:**
- Article header with title and date
- Content area: max-w-3xl for readability
- Related articles sidebar or footer section

**Admin Dashboard:**
- Sidebar navigation (desktop) or top tabs (mobile)
- Main content area for forms/tables
- Success/error message alerts at top

## Images

**Homepage:**
- No large hero image - prioritize immediate results visibility
- Small lottery ball/ticket icon in header logo area

**News Section:**
- Article thumbnail images: 16:9 aspect ratio, 400x225px minimum
- Placeholder images showing lottery themes (balls, tickets, winners)

**Admin Panel:**
- No images needed - functional interface only

## Responsive Breakpoints
- Mobile: Base styles (< 768px)
- Tablet: md: (768px - 1024px)
- Desktop: lg: (1024px+)

**Mobile Optimizations:**
- Single column card layouts
- Stacked number badges if needed for smaller screens
- Collapsible navigation
- Full-width tables with horizontal scroll
- Touch-friendly button sizes (min h-12)

## Animations
**Minimal approach - use sparingly:**
- Hover state transitions on cards: transition-shadow duration-200
- Button hover: transition-colors duration-150
- No complex animations or scroll effects