import { useQuery } from "@tanstack/react-query";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CircleDot } from "lucide-react";
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

export default function DailyLottoResultYesterdayPage() {
  const { data: results, isLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/yesterday"],
  });

  const yesterdayDate = getYesterdayDateSAST();
  
  const dailyLottoResults = results?.filter(
    (r) => r.gameSlug === "daily-lotto" || r.gameSlug === "daily-lotto-plus"
  ) || [];

  useEffect(() => {
    document.title = "Daily Lotto Results Yesterday - South African Daily Lotto | African Lottery";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Check yesterday's South African Daily Lotto and Daily Lotto Plus results. View winning numbers drawn daily at 21:00 SAST. Best odds in South Africa!");
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'daily lotto results yesterday, daily lotto plus, south african daily lotto, lottery results, winning numbers';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <Link href="/lotto-result/yesterday">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-yesterday">
            <ChevronLeft className="h-4 w-4 mr-2" />
            All Yesterday's Results
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CircleDot className="h-8 w-8 text-lottery-ball-bonus" />
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-daily-lotto-yesterday">
              Daily Lotto Results Yesterday
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-daily-lotto-date">
            Daily Lotto and Daily Lotto Plus results from {new Date(yesterdayDate).toLocaleDateString('en-ZA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/lotto-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-all-yesterday">
              All Results Yesterday
            </Button>
          </Link>
          <Link href="/powerball-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-powerball-yesterday">
              Powerball Yesterday
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : dailyLottoResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dailyLottoResults.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-daily-lotto">
            <CircleDot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Daily Lotto Results Yesterday</h3>
            <p className="text-muted-foreground mb-4">
              Daily Lotto draws are held every day at 21:00 SAST.
            </p>
            <p className="text-sm text-muted-foreground">
              Results should be available shortly after the draw.
            </p>
          </div>
        )}

        <div className="mt-12 bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About Daily Lotto</h2>
          <p className="text-muted-foreground mb-4">
            Daily Lotto offers the best odds of any South African lottery game. Players choose 
            5 numbers from 1-36. There is no bonus ball in Daily Lotto.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Draw Schedule:</strong> Every day at 21:00 SAST (South African Standard Time)
          </p>
          <p className="text-muted-foreground">
            Daily Lotto Plus is an additional game using the same numbers with a separate prize pool.
          </p>
        </div>
      </div>
    </div>
  );
}
