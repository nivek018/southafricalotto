import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LotteryBall } from "@/components/lottery-ball";
import { GameDetailSkeleton } from "@/components/loading-skeleton";
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  Trophy,
  CircleDot 
} from "lucide-react";
import type { LotteryResult, LotteryGame } from "@shared/schema";
import { useEffect } from "react";

export default function GamePage() {
  const [, params] = useRoute("/game/:slug");
  const slug = params?.slug || "";

  const { data: game, isLoading: gameLoading } = useQuery<LotteryGame>({
    queryKey: ["/api/games", slug],
    enabled: !!slug,
  });

  const { data: results, isLoading: resultsLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/game", slug],
    enabled: !!slug,
  });

  const latestResult = results?.[0];

  const sortNumbers = (nums: number[] | undefined) => 
    nums ? [...nums].sort((a, b) => a - b) : [];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const gameName = latestResult?.gameName || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  useEffect(() => {
    if (!gameLoading && !resultsLoading) {
      document.title = `${gameName} Results - Latest Winning Numbers | African Lottery`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", `Check the latest ${gameName} results and winning numbers. View draw history, hot/cold numbers, and jackpot information for South African ${gameName}.`);
      }
    }
  }, [gameName, gameLoading, resultsLoading]);

  if (gameLoading || resultsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <GameDetailSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-card to-background py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Link href="/">
            <Button variant="ghost" className="mb-6" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Button>
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CircleDot className="h-8 w-8 text-lottery-ball-main" />
              {game?.hasBonusBall && (
                <CircleDot className="h-6 w-6 text-lottery-ball-bonus -ml-2" />
              )}
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">{gameName} Results</h1>
            {game?.description && (
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {game.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {latestResult ? (
            <>
              <Card className="max-w-3xl mx-auto mb-12">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="h-5 w-5 text-lottery-ball-bonus" />
                    <CardTitle className="text-xl">Latest Draw</CardTitle>
                  </div>
                  <Badge variant="secondary" className="mx-auto">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(latestResult.drawDate)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-wrap justify-center items-center gap-3">
                    {sortNumbers(latestResult.winningNumbers).map((num, idx) => (
                      <LotteryBall key={idx} number={num} size="lg" />
                    ))}
                    {latestResult.bonusNumber && (
                      <>
                        <span className="text-2xl font-bold text-muted-foreground mx-2">+</span>
                        <LotteryBall number={latestResult.bonusNumber} isBonus size="lg" />
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {latestResult.hotNumber && (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <TrendingUp className="w-5 h-5 text-lottery-hot" />
                          <span className="text-sm text-muted-foreground">Hot Number</span>
                        </div>
                        <span className="text-2xl font-mono font-bold">{latestResult.hotNumber}</span>
                      </div>
                    )}
                    {latestResult.coldNumber && (
                      <div className="bg-muted/50 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <TrendingDown className="w-5 h-5 text-lottery-cold" />
                          <span className="text-sm text-muted-foreground">Cold Number</span>
                        </div>
                        <span className="text-2xl font-mono font-bold">{latestResult.coldNumber}</span>
                      </div>
                    )}
                  </div>

                  {latestResult.nextJackpot && (
                    <div className="bg-gradient-to-r from-lottery-ball-main/10 to-lottery-ball-bonus/10 rounded-lg p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Estimated Next Jackpot</p>
                      <p className="text-3xl font-bold">{latestResult.nextJackpot}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {results && results.length > 1 && (
                <div>
                  <h2 className="text-2xl font-semibold mb-6">Previous Results</h2>
                  <div className="space-y-4">
                    {results.slice(1).map((result) => (
                      <Card key={result.id} data-testid={`card-history-${result.id}`}>
                        <CardContent className="py-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatShortDate(result.drawDate)}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {sortNumbers(result.winningNumbers).map((num, idx) => (
                                <LotteryBall key={idx} number={num} size="sm" />
                              ))}
                              {result.bonusNumber && (
                                <>
                                  <span className="text-lg font-bold text-muted-foreground">+</span>
                                  <LotteryBall number={result.bonusNumber} isBonus size="sm" />
                                </>
                              )}
                            </div>
                            {result.jackpotAmount && (
                              <div className="text-right">
                                <span className="text-sm text-muted-foreground">Jackpot: </span>
                                <span className="font-semibold">{result.jackpotAmount}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <CircleDot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Results Available</h2>
              <p className="text-muted-foreground mb-6">
                Results for {gameName} will appear here after they are published.
              </p>
              <Link href="/">
                <Button data-testid="button-back-home-empty">Return to Homepage</Button>
              </Link>
            </div>
          )}
          
          {latestResult && (
            <div className="mt-8 text-center">
              <Link href={`/draw-history/${slug}`}>
                <Button variant="outline" data-testid="button-view-draw-history">
                  View Complete Draw History
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 lg:py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>How to Play {gameName}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                {gameName} is one of South Africa's most popular lottery games. 
                Select your numbers, purchase your ticket, and check back here 
                after each draw to see if you've won!
              </p>
              <p className="text-muted-foreground">
                Remember to always verify your results with official lottery retailers 
                and keep your ticket safe until you've claimed any winnings.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
