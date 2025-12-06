import { Switch, Route, useLocation } from "wouter";
import { useEffect, Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RecentResultsSection } from "@/components/recent-results";
import { AdSlot } from "@/components/ad-slot";
import { initDeferredScripts } from "@/lib/deferred-scripts";
import HomePage from "@/pages/home";

const JackpotPage = lazy(() => import("@/pages/jackpot"));
const GamePage = lazy(() => import("@/pages/game"));
const NewsPage = lazy(() => import("@/pages/news"));
const NewsArticlePage = lazy(() => import("@/pages/news-article"));
const AdminLoginPage = lazy(() => import("@/pages/admin-login"));
const AdminDashboard = lazy(() => import("@/pages/admin-dashboard"));
const LottoResultTodayPage = lazy(() => import("@/pages/lotto-result-today"));
const LottoResultYesterdayPage = lazy(() => import("@/pages/lotto-result-yesterday"));
const PowerballResultYesterdayPage = lazy(() => import("@/pages/powerball-result-yesterday"));
const DailyLottoResultYesterdayPage = lazy(() => import("@/pages/daily-lotto-result-yesterday"));
const LottoSaResultYesterdayPage = lazy(() => import("@/pages/lotto-sa-result-yesterday"));
const DrawHistoryPage = lazy(() => import("@/pages/draw-history"));
const DateResultPage = lazy(() => import("@/pages/date-result"));
const AboutPage = lazy(() => import("@/pages/about"));
const ContactPage = lazy(() => import("@/pages/contact"));
const PrivacyPolicyPage = lazy(() => import("@/pages/privacy"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/game/jackpot" component={JackpotPage} />
      <Route path="/game/:slug" component={GamePage} />
      <Route path="/draw-history/:slug" component={DrawHistoryPage} />
      <Route path="/lotto-result/today" component={LottoResultTodayPage} />
      <Route path="/lotto-result/yesterday" component={LottoResultYesterdayPage} />
      <Route path="/powerball-result/yesterday" component={PowerballResultYesterdayPage} />
      <Route path="/daily-lotto-result/yesterday" component={DailyLottoResultYesterdayPage} />
      <Route path="/sa-lotto-result/yesterday" component={LottoSaResultYesterdayPage} />
      <Route path="/lotto-result/:date" component={DateResultPage} />
      <Route path="/powerball-result/:date" component={DateResultPage} />
      <Route path="/daily-lotto-result/:date" component={DateResultPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:slug" component={NewsArticlePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/privacy" component={PrivacyPolicyPage} />
      <Route path="/encode" component={AdminLoginPage} />
      <Route path="/encode/dashboard" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const isAdminRoute = location.startsWith("/encode");
  const router = (
    <Suspense fallback={<div className="p-6 text-center text-muted-foreground">Loading...</div>}>
      <Router />
    </Suspense>
  );

  useEffect(() => {
    if (!isAdminRoute) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [location, isAdminRoute]);

  useEffect(() => {
    const setCanonical = (href: string) => {
      let link = document.querySelector("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", href);
    };

    const formatSastDate = (offsetDays = 0) => {
      const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Johannesburg",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const base = new Date();
      base.setUTCDate(base.getUTCDate() + offsetDays);
      return fmt.format(base);
    };

    const origin = window.location.origin;
    const lowerPath = (location || "/").toLowerCase();
    let canonicalPath = location || "/";

    const lottoDateMatch = lowerPath.match(/^\/lotto-result\/(\d{4}-\d{2}-\d{2})$/);
    if (lottoDateMatch) {
      const dateStr = lottoDateMatch[1];
      const today = formatSastDate(0);
      const yesterday = formatSastDate(-1);
      if (dateStr === today) {
        canonicalPath = "/lotto-result/today";
      } else if (dateStr === yesterday) {
        canonicalPath = "/lotto-result/yesterday";
      }
    }

    const finalHref = `${origin}${canonicalPath}`;
    setCanonical(finalHref);
  }, [location, isAdminRoute]);

  if (isAdminRoute) {
    return router;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {router}
      </main>
      <div className="max-w-5xl mx-auto px-4 lg:px-8 w-full space-y-4 my-6">
        <AdSlot
          slot="5683668562"
          className="hidden md:block"
        />
        <AdSlot
          slot="3057505225"
          className="block md:hidden"
        />
      </div>
      <RecentResultsSection />
      <div className="max-w-5xl mx-auto px-4 lg:px-8 w-full space-y-4 my-6">
        <AdSlot
          slot="5683668562"
          className="hidden md:block"
        />
        <AdSlot
          slot="3057505225"
          className="block md:hidden"
        />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  useEffect(() => {
    initDeferredScripts();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
