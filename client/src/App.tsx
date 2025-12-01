import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { RecentResultsSection } from "@/components/recent-results";
import HomePage from "@/pages/home";
import GamePage from "@/pages/game";
import NewsPage from "@/pages/news";
import NewsArticlePage from "@/pages/news-article";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import LottoResultTodayPage from "@/pages/lotto-result-today";
import LottoResultYesterdayPage from "@/pages/lotto-result-yesterday";
import PowerballResultYesterdayPage from "@/pages/powerball-result-yesterday";
import DailyLottoResultYesterdayPage from "@/pages/daily-lotto-result-yesterday";
import LottoSaResultYesterdayPage from "@/pages/lotto-sa-result-yesterday";
import DrawHistoryPage from "@/pages/draw-history";
import DateResultPage from "@/pages/date-result";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import PrivacyPolicyPage from "@/pages/privacy";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
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

  useEffect(() => {
    if (!isAdminRoute) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [location, isAdminRoute]);

  if (isAdminRoute) {
    return <Router />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Router />
      </main>
      <RecentResultsSection />
      <Footer />
    </div>
  );
}

function App() {
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
