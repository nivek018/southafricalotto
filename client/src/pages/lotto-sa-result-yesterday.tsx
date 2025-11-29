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

export default function LottoSaResultYesterdayPage() {
  const { data: results, isLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/yesterday"],
  });

  const yesterdayDate = getYesterdayDateSAST();
  
  const lottoResults = results?.filter(
    (r) => r.gameSlug === "lotto" || r.gameSlug === "lotto-plus-1" || r.gameSlug === "lotto-plus-2"
  ) || [];

  useEffect(() => {
    document.title = "SA Lotto Results Yesterday - Lotto, Lotto Plus 1 & 2 | African Lottery";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Check yesterday's South African Lotto, Lotto Plus 1, and Lotto Plus 2 results. View winning numbers, bonus ball, and jackpot information. Draws on Wednesday and Saturday.");
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'lotto results yesterday, lotto plus 1, lotto plus 2, south african lotto, lottery results, winning numbers, jackpot';
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
            <CircleDot className="h-8 w-8 text-lottery-ball-main" />
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-lotto-sa-yesterday">
              SA Lotto Results Yesterday
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-lotto-sa-date">
            Lotto, Lotto Plus 1 & Lotto Plus 2 results from {new Date(yesterdayDate).toLocaleDateString('en-ZA', { 
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
          <Link href="/daily-lotto-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-daily-lotto-yesterday">
              Daily Lotto Yesterday
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : lottoResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lottoResults.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-lotto-sa">
            <CircleDot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No SA Lotto Results Yesterday</h3>
            <p className="text-muted-foreground mb-4">
              SA Lotto draws are held on Wednesday and Saturday at approximately 20:57 SAST.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back after the next scheduled draw.
            </p>
          </div>
        )}

        <div className="mt-12 bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About SA Lotto</h2>
          <p className="text-muted-foreground mb-4">
            SA Lotto is South Africa's original lottery game with guaranteed jackpots starting at R2 million. 
            Players choose 6 numbers from 1-52, plus a bonus ball is drawn.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Draw Schedule:</strong> Wednesday and Saturday at approximately 20:57 SAST
          </p>
          <p className="text-muted-foreground">
            Lotto Plus 1 and Lotto Plus 2 are additional games using the same numbers with separate prize pools.
          </p>
        </div>
      </div>
    </div>
  );
}
