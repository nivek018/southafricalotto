import { useQuery } from "@tanstack/react-query";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CircleDot } from "lucide-react";
import type { LotteryResult } from "@shared/schema";
import { useEffect } from "react";
import { AdSlot } from "@/components/ad-slot";

function getYesterdayDateSAST(): string {
  const now = new Date();
  // SAST is UTC+2
  const sastOffset = 2 * 60 * 60 * 1000;
  const sastTime = new Date(now.getTime() + sastOffset);
  sastTime.setUTCDate(sastTime.getUTCDate() - 1);
  return sastTime.toISOString().split("T")[0];
}

export default function PowerballResultYesterdayPage() {
  const { data: results, isLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/yesterday"],
  });

  const yesterdayDate = getYesterdayDateSAST();

  const powerballResults = results?.filter(
    (r) => r.gameSlug === "powerball" || r.gameSlug === "powerball-plus"
  ) || [];

  useEffect(() => {
    document.title = "Powerball Results Yesterday - South African Powerball & Powerball Plus | African Lottery";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Check yesterday's South African Powerball and Powerball Plus lottery results. View winning numbers, bonus ball, and jackpot information. Draws on Tuesday and Friday.");
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'powerball results yesterday, powerball plus, south african powerball, lottery results, winning numbers, jackpot';
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
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-powerball-yesterday">
              Powerball Results Yesterday
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-powerball-date">
            Powerball and Powerball Plus results from {new Date(yesterdayDate).toLocaleDateString('en-ZA', {
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
          <Link href="/sa-lotto-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-sa-lotto-yesterday">
              SA Lotto Yesterday
            </Button>
          </Link>
          <Link href="/daily-lotto-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-daily-lotto-yesterday">
              Daily Lotto Yesterday
            </Button>
          </Link>
        </div>
        <div className="max-w-5xl mx-auto w-full mb-6">
          <AdSlot slot="5683668562" className="hidden md:block" />
          <AdSlot slot="3057505225" className="block md:hidden" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : powerballResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {powerballResults.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-powerball">
            <CircleDot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Powerball Results Yesterday</h3>
            <p className="text-muted-foreground mb-4">
              Powerball draws are held on Tuesday and Friday at approximately 20:58 SAST.
            </p>
            <p className="text-sm text-muted-foreground">
              Check back after the next scheduled draw.
            </p>
          </div>
        )}

        <div className="mt-12 bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About Powerball</h2>
          <p className="text-muted-foreground mb-4">
            Powerball is South Africa's biggest lottery game with jackpots starting at R3 million.
            Players choose 5 numbers from 1-50 and 1 Powerball number from 1-20.
          </p>
          <p className="text-muted-foreground mb-4">
            <strong>Draw Schedule:</strong> Tuesday and Friday at approximately 20:58 SAST
          </p>
          <p className="text-muted-foreground">
            Powerball Plus is an additional game using the same numbers with a separate prize pool.
          </p>
        </div>
      </div>
    </div>
  );
}
