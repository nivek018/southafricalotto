import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { LotteryBall } from "@/components/lottery-ball";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, CircleDot, Trophy, History } from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";
import type { LotteryResult } from "@shared/schema";
import { LOTTERY_GROUPS } from "@shared/schema";

interface DateResultsResponse {
  date: string;
  groupSlug: string;
  groupName: string;
  results: Record<string, LotteryResult>;
  previousDate: string | null;
  nextDate: string | null;
  variants: string[];
}

export default function DateResultPage() {
  const { date } = useParams<{ date: string }>();
  const [location] = useLocation();
  
  const gameSlug = useMemo(() => {
    if (location.startsWith("/lotto-result/")) return "lotto";
    if (location.startsWith("/powerball-result/")) return "powerball";
    if (location.startsWith("/daily-lotto-result/")) return "daily-lotto";
    return null;
  }, [location]);

  const { data, isLoading, error } = useQuery<DateResultsResponse>({
    queryKey: ["/api/results/date", gameSlug, date],
    enabled: !!gameSlug && !!date,
  });

  const getVariantDisplayName = (variantSlug: string): string => {
    const nameMap: Record<string, string> = {
      "powerball": "Powerball",
      "powerball-plus": "Powerball Plus",
      "lotto": "Lotto",
      "lotto-plus-1": "Lotto Plus 1",
      "lotto-plus-2": "Lotto Plus 2",
      "daily-lotto": "Daily Lotto",
      "daily-lotto-plus": "Daily Lotto Plus"
    };
    return nameMap[variantSlug] || variantSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const sortNumbers = (nums: number[] | undefined) => 
    nums ? [...nums].sort((a, b) => a - b) : [];

  const formatDisplayDate = (dateStr: string) => {
    try {
      const parsedDate = parseISO(dateStr);
      return format(parsedDate, "EEEE, d MMMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const parsedDate = parseISO(dateStr);
      return format(parsedDate, "d MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const groupName = data?.groupName || gameSlug?.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Lottery";
  const variants = data?.variants || [];

  useEffect(() => {
    if (data) {
      document.title = `${groupName} Results for ${formatDisplayDate(data.date)} | African Lottery`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", `${groupName} lottery results and winning numbers for ${formatDisplayDate(data.date)}. View the complete draw results including jackpot information.`);
      }
    }
  }, [data, groupName]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <ResultCardSkeleton />
          <ResultCardSkeleton />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-home">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div className="text-center py-16 bg-card rounded-lg">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-6">
              No {groupName} results were recorded for {date ? formatDisplayDate(date) : "this date"}.
            </p>
            <Link href={`/draw-history/${gameSlug}`}>
              <Button variant="outline" data-testid="button-view-history">
                View Draw History
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasResults = Object.keys(data.results).length > 0;

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
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-date-result">
              {groupName} Results
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            {formatDisplayDate(data.date)}
          </p>
        </div>

        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          {data.previousDate ? (
            <Link href={`/${gameSlug}-result/${data.previousDate}`}>
              <Button variant="outline" size="sm" data-testid="button-previous-date">
                <ChevronLeft className="h-4 w-4 mr-1" />
                {formatShortDate(data.previousDate)}
              </Button>
            </Link>
          ) : (
            <div />
          )}
          
          {data.nextDate ? (
            <Link href={`/${gameSlug}-result/${data.nextDate}`}>
              <Button variant="outline" size="sm" data-testid="button-next-date">
                {formatShortDate(data.nextDate)}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <Badge variant="secondary">Latest Available</Badge>
          )}
        </div>

        {hasResults ? (
          <div className="space-y-6">
            {variants.map(variantSlug => {
              const result = data.results[variantSlug];
              
              if (!result) {
                return (
                  <Card key={variantSlug} className="bg-muted/30" data-testid={`card-no-result-${variantSlug}`}>
                    <CardContent className="py-6 text-center">
                      <p className="text-muted-foreground">
                        No {getVariantDisplayName(variantSlug)} draw on this date
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              return (
                <Card key={variantSlug} data-testid={`card-result-${variantSlug}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-5 w-5 text-lottery-ball-main" />
                        <CardTitle className="text-xl">{getVariantDisplayName(variantSlug)}</CardTitle>
                      </div>
                      {result.jackpotAmount && (
                        <div className="flex items-center gap-2 bg-gradient-to-r from-lottery-ball-main/10 to-lottery-ball-bonus/10 px-4 py-2 rounded-lg">
                          <Trophy className="h-5 w-5 text-lottery-ball-bonus" />
                          <span className="font-bold">{result.jackpotAmount}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap justify-center items-center gap-4 py-6">
                      {sortNumbers(result.winningNumbers).map((num, idx) => (
                        <LotteryBall key={idx} number={num} size="lg" />
                      ))}
                      {result.bonusNumber && (
                        <>
                          <span className="text-2xl font-bold text-muted-foreground mx-2">+</span>
                          <LotteryBall number={result.bonusNumber} isBonus size="lg" />
                        </>
                      )}
                    </div>

                    {result.nextJackpot && (
                      <div className="text-center pt-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Next Draw Estimated Jackpot: <span className="font-semibold">{result.nextJackpot}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-results">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Results Available</h3>
            <p className="text-muted-foreground">
              No {groupName} results were recorded for this date.
            </p>
          </div>
        )}

        <div className="mt-12 flex flex-wrap gap-4 justify-center">
          <Link href={`/draw-history/${gameSlug}`}>
            <Button variant="outline" data-testid="button-view-all-history">
              <History className="h-4 w-4 mr-2" />
              View All Draw History
            </Button>
          </Link>
          <Link href={`/game/${gameSlug}`}>
            <Button variant="outline" data-testid="button-view-latest">
              View Latest Results
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
