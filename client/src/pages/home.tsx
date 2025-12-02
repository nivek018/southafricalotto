import { useQuery } from "@tanstack/react-query";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { NewsCard } from "@/components/news-card";
import { ResultCardSkeleton, NewsCardSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, CircleDot, Newspaper } from "lucide-react";
import type { LotteryResult, NewsArticle } from "@shared/schema";
import { useEffect } from "react";
import { AdSlot } from "@/components/ad-slot";

export default function HomePage() {
  useEffect(() => {
    document.title = "South Africa Lotto Results - Powerball, Lotto, Daily Lotto";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Check the latest South Africa lotto results for Powerball, Lotto, Lotto Plus, and Daily Lotto. Updated immediately after every draw. View winning numbers, jackpots, and hot/cold numbers.");
    }
  }, []);
  const { data: results, isLoading: resultsLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/latest"],
  });

  const { data: news, isLoading: newsLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news"],
  });

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-card to-background pt-12 pb-6 lg:pt-16 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CircleDot className="h-8 w-8 text-lottery-ball-main" />
            <CircleDot className="h-7 w-7 text-lottery-ball-bonus -ml-3" />
            <CircleDot className="h-6 w-6 text-lottery-ball-main -ml-3" />
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">
            South Africa Lotto Results
          </h1>
          <p className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto">
            View the latest PowerBall, Powerball Plus, Lotto, Lotto Plus, Daily Lotto, and Daily Lotto Plus results, updated after each draw.
          </p>
          <div className="max-w-5xl mx-auto w-full mt-4 mb-6">
            <AdSlot slot="5683668562" className="hidden md:block" />
            <AdSlot slot="3057505225" className="block md:hidden" />
          </div>
        </div>
      </section>

      <section className="pt-6 pb-12 lg:pt-8 lg:pb-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl lg:text-3xl font-semibold">Latest Results</h2>
          </div>
          
          {resultsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(6)].map((_, i) => (
                <ResultCardSkeleton key={i} />
              ))}
            </div>
          ) : results && results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...results].sort((a, b) => {
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
              }).map((result) => (
                <LotteryResultCard key={result.id} result={result} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-lg">
              <CircleDot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
              <p className="text-muted-foreground">
                Lottery results will appear here after they are added.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-card">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Newspaper className="h-6 w-6 text-muted-foreground" />
              <h2 className="text-2xl lg:text-3xl font-semibold">Lottery News</h2>
            </div>
            <Link href="/news">
              <Button variant="ghost" className="group" data-testid="button-view-all-news">
                View All News
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {newsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : news && news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.slice(0, 3).map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-background rounded-lg">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No News Articles</h3>
              <p className="text-muted-foreground">
                News articles will appear here when published.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="bg-card rounded-lg p-8 lg:p-12">
            <h2 className="text-2xl lg:text-3xl font-semibold mb-6">
              About South African Lottery
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground mb-4">
                This is your trusted source for South African lottery results including 
                Powerball, Lotto, Lotto Plus, and Daily Lotto. Results are published 
                immediately after each official draw broadcast.
              </p>
              <p className="text-muted-foreground mb-4">
                <strong>Draw Schedule:</strong> Lotto and Powerball draws are held on 
                Tuesday, Wednesday, and Saturday nights at approximately 9:00 PM. 
                Daily Lotto draws happen every night.
              </p>
              <p className="text-muted-foreground">
                Since 2015, Ithuba has been the official operator of the South African 
                National Lottery. Always verify your results with official sources and 
                remember to check your tickets!
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
