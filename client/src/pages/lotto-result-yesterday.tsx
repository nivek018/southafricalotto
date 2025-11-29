import { useQuery } from "@tanstack/react-query";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar } from "lucide-react";
import type { LotteryResult } from "@shared/schema";
import { useEffect } from "react";

function getYesterdayDateSAST(): string {
  const now = new Date();
  const sastOffset = 2 * 60;
  const localOffset = now.getTimezoneOffset();
  const sastTime = new Date(now.getTime() + (sastOffset + localOffset) * 60000);
  sastTime.setDate(sastTime.getDate() - 1);
  return sastTime.toISOString().split("T")[0];
}

export default function LottoResultYesterdayPage() {
  const { data: results, isLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/yesterday"],
  });

  const yesterdayDate = getYesterdayDateSAST();

  useEffect(() => {
    document.title = "Lotto Results Yesterday - South African Lottery Results | African Lottery";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Check yesterday's South African lottery results including Powerball, Lotto, Lotto Plus, and Daily Lotto. Updated daily with winning numbers and jackpot amounts.");
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'lotto results yesterday, south african lottery, powerball results, lotto plus results, daily lotto, winning numbers';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-yesterday-results">
              Lotto Results Yesterday
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-yesterday-date">
            All South African lottery draws from {new Date(yesterdayDate).toLocaleDateString('en-ZA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/powerball-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-powerball-yesterday">
              Powerball Yesterday
            </Button>
          </Link>
          <Link href="/daily-lotto-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-daily-lotto-yesterday">
              Daily Lotto Yesterday
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-results">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Results Yesterday</h3>
            <p className="text-muted-foreground">
              No lottery draws were held on {new Date(yesterdayDate).toLocaleDateString('en-ZA')}.
            </p>
          </div>
        )}

        <div className="mt-12 bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About Yesterday's Lottery Results</h2>
          <p className="text-muted-foreground mb-4">
            This page displays all South African lottery results from the previous day. Results include 
            Powerball, Powerball Plus, Lotto, Lotto Plus 1, Lotto Plus 2, Daily Lotto, and Daily Lotto Plus.
          </p>
          <p className="text-muted-foreground">
            Draw times are: Daily Lotto at 21:00, Lotto on Wednesday/Saturday at 20:57, and 
            Powerball on Tuesday/Friday at 20:58 South African Standard Time (SAST).
          </p>
        </div>
      </div>
    </div>
  );
}
