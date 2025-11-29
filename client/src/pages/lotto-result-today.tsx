import { useQuery } from "@tanstack/react-query";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LotteryBall } from "@/components/lottery-ball";
import { ChevronLeft, Calendar, Clock, CircleDot } from "lucide-react";
import type { LotteryResult, LotteryGame } from "@shared/schema";
import { useEffect } from "react";

function getTodayDateSAST(): string {
  const now = new Date();
  const sastOffset = 2 * 60;
  const localOffset = now.getTimezoneOffset();
  const sastTime = new Date(now.getTime() + (sastOffset + localOffset) * 60000);
  return sastTime.toISOString().split("T")[0];
}

interface TodayResultsResponse {
  date: string;
  games: {
    game: LotteryGame;
    result: LotteryResult | null;
  }[];
}

export default function LottoResultTodayPage() {
  const { data, isLoading } = useQuery<TodayResultsResponse>({
    queryKey: ["/api/results/today"],
  });

  const todayDate = getTodayDateSAST();

  useEffect(() => {
    document.title = "Lotto Results Today - South African Lottery Results | African Lottery";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Check today's South African lottery results including Powerball, Lotto, Lotto Plus, and Daily Lotto. Live updates with winning numbers and jackpot amounts.");
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'lotto results today, south african lottery, powerball results today, lotto plus results, daily lotto today, winning numbers';
      document.head.appendChild(meta);
    }
  }, []);

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
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-today-results">
              Lotto Results Today
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-today-date">
            All South African lottery draws for {formatDate(todayDate)}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/lotto-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-yesterday">
              Yesterday's Results
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
            {[...Array(7)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.games.map(({ game, result }) => (
              <Card key={game.slug} className="overflow-hidden" data-testid={`card-game-${game.slug}`}>
                <CardHeader className="pb-3 bg-gradient-to-r from-lottery-ball-main/10 to-lottery-ball-bonus/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircleDot className="h-5 w-5 text-lottery-ball-main" />
                      <CardTitle className="text-lg">{game.name}</CardTitle>
                    </div>
                    {result ? (
                      <Badge variant="default" className="bg-green-600">Live</Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>Draw at {game.drawTime} SAST</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {result ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {sortNumbers(result.winningNumbers).map((num, idx) => (
                          <LotteryBall key={idx} number={num} size="md" />
                        ))}
                        {result.bonusNumber && (
                          <>
                            <span className="text-lg font-bold text-muted-foreground">+</span>
                            <LotteryBall number={result.bonusNumber} isBonus size="md" />
                          </>
                        )}
                      </div>
                      {result.jackpotAmount && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Jackpot</p>
                          <p className="font-bold text-lottery-ball-bonus">{result.jackpotAmount}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                        {Array.from({ length: game.numberCount || 6 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                          >
                            <span className="text-sm font-medium text-muted-foreground">?</span>
                          </div>
                        ))}
                        {game.hasBonusBall && (
                          <>
                            <span className="text-lg font-bold text-muted-foreground">+</span>
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium text-muted-foreground">?</span>
                            </div>
                          </>
                        )}
                      </div>
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        TBA
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        Results will be available after the draw
                      </p>
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <Link href={`/game/${game.slug}`}>
                      <Button variant="ghost" size="sm" data-testid={`link-game-${game.slug}`}>
                        View Game Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-data">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unable to Load Results</h3>
            <p className="text-muted-foreground">
              Please try again later.
            </p>
          </div>
        )}

        <div className="mt-12 bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About Today's Lottery Results</h2>
          <p className="text-muted-foreground mb-4">
            This page displays all South African lottery results for today. Results are updated live 
            as draws take place throughout the day. Games marked as "TBA" (To Be Announced) will be 
            updated once the official draw has been completed.
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
