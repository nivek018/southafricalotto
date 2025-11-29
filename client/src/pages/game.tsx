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
  CircleDot,
  History
} from "lucide-react";
import type { LotteryResult } from "@shared/schema";
import { getGroupForSlug } from "@shared/schema";
import { useEffect, useMemo } from "react";

interface GroupedResultsResponse {
  group: {
    slug: string;
    name: string;
    description: string;
    variants: string[];
  };
  latestResults: Record<string, LotteryResult>;
  allResults: Record<string, LotteryResult[]>;
}

export default function GamePage() {
  const [, params] = useRoute("/game/:slug");
  const slug = params?.slug || "";

  const groupInfo = useMemo(() => getGroupForSlug(slug), [slug]);
  const groupSlug = groupInfo?.groupSlug || null;
  const hasGroup = !!groupInfo;

  const { data: groupedData, isLoading: groupLoading } = useQuery<GroupedResultsResponse>({
    queryKey: ["/api/results/group", groupSlug],
    enabled: !!slug && hasGroup && !!groupSlug,
  });

  const { data: singleResults, isLoading: singleLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/game", slug],
    enabled: !!slug && !hasGroup,
  });

  const isLoading = hasGroup ? groupLoading : singleLoading;

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

  const groupName = hasGroup 
    ? groupedData?.group?.name || groupInfo?.group?.name || slug
    : singleResults?.[0]?.gameName || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const groupDescription = hasGroup
    ? groupedData?.group?.description || groupInfo?.group?.description
    : null;

  useEffect(() => {
    if (!isLoading) {
      document.title = `${groupName} Results - Latest Winning Numbers | African Lottery`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", `Check the latest ${groupName} results and winning numbers. View draw history, hot/cold numbers, and jackpot information for South African ${groupName}.`);
      }
    }
  }, [groupName, isLoading]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <GameDetailSkeleton />
      </div>
    );
  }

  const hasResults = hasGroup 
    ? groupedData && Object.keys(groupedData.latestResults).length > 0
    : singleResults && singleResults.length > 0;

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
              <CircleDot className="h-6 w-6 text-lottery-ball-bonus -ml-2" />
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold mb-2" data-testid="heading-game-title">{groupName} Results</h1>
            {groupDescription && (
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {groupDescription}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {hasResults ? (
            <>
              {hasGroup && groupedData ? (
                <div className="space-y-12">
                  {groupedData.group.variants.map((variantSlug) => {
                    const latestResult = groupedData.latestResults[variantSlug];
                    const allVariantResults = groupedData.allResults[variantSlug] || [];
                    const variantName = getVariantDisplayName(variantSlug);

                    if (!latestResult) {
                      return (
                        <div key={variantSlug} className="mb-8">
                          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" data-testid={`heading-variant-${variantSlug}`}>
                            <CircleDot className="h-6 w-6 text-lottery-ball-main" />
                            {variantName}
                          </h2>
                          <Card>
                            <CardContent className="py-8 text-center">
                              <p className="text-muted-foreground">No results available for {variantName} yet.</p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }

                    return (
                      <div key={variantSlug} className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2" data-testid={`heading-variant-${variantSlug}`}>
                          <CircleDot className="h-6 w-6 text-lottery-ball-main" />
                          {variantName}
                        </h2>

                        <Card className="mb-6" data-testid={`card-latest-${variantSlug}`}>
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

                            {latestResult.jackpotAmount && (
                              <div className="bg-gradient-to-r from-lottery-ball-main/10 to-lottery-ball-bonus/10 rounded-lg p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-1">Jackpot</p>
                                <p className="text-2xl font-bold">{latestResult.jackpotAmount}</p>
                              </div>
                            )}

                            {latestResult.nextJackpot && (
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">
                                  Estimated Next Jackpot: <span className="font-semibold">{latestResult.nextJackpot}</span>
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {allVariantResults.length > 1 && (
                          <div className="mb-4">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                              <History className="h-4 w-4" />
                              Previous {variantName} Results
                            </h3>
                            <div className="space-y-3">
                              {allVariantResults.slice(1, 4).map((result) => (
                                <Card key={result.id} data-testid={`card-history-${result.id}`}>
                                  <CardContent className="py-3">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                      <Badge variant="outline">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatShortDate(result.drawDate)}
                                      </Badge>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {sortNumbers(result.winningNumbers).map((num, idx) => (
                                          <LotteryBall key={idx} number={num} size="sm" />
                                        ))}
                                        {result.bonusNumber && (
                                          <>
                                            <span className="text-sm font-bold text-muted-foreground">+</span>
                                            <LotteryBall number={result.bonusNumber} isBonus size="sm" />
                                          </>
                                        )}
                                      </div>
                                      {result.jackpotAmount && (
                                        <span className="text-sm font-semibold">{result.jackpotAmount}</span>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            {allVariantResults.length > 4 && (
                              <div className="mt-3 text-center">
                                <Link href={`/draw-history/${variantSlug}`}>
                                  <Button variant="outline" size="sm" data-testid={`button-history-${variantSlug}`}>
                                    View All {variantName} History
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  {singleResults && singleResults[0] && (
                    <>
                      <Card className="max-w-3xl mx-auto mb-12">
                        <CardHeader className="text-center pb-4">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Trophy className="h-5 w-5 text-lottery-ball-bonus" />
                            <CardTitle className="text-xl">Latest Draw</CardTitle>
                          </div>
                          <Badge variant="secondary" className="mx-auto">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(singleResults[0].drawDate)}
                          </Badge>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="flex flex-wrap justify-center items-center gap-3">
                            {sortNumbers(singleResults[0].winningNumbers).map((num, idx) => (
                              <LotteryBall key={idx} number={num} size="lg" />
                            ))}
                            {singleResults[0].bonusNumber && (
                              <>
                                <span className="text-2xl font-bold text-muted-foreground mx-2">+</span>
                                <LotteryBall number={singleResults[0].bonusNumber} isBonus size="lg" />
                              </>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {singleResults[0].hotNumber && (
                              <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <TrendingUp className="w-5 h-5 text-lottery-hot" />
                                  <span className="text-sm text-muted-foreground">Hot Number</span>
                                </div>
                                <span className="text-2xl font-mono font-bold">{singleResults[0].hotNumber}</span>
                              </div>
                            )}
                            {singleResults[0].coldNumber && (
                              <div className="bg-muted/50 rounded-lg p-4 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <TrendingDown className="w-5 h-5 text-lottery-cold" />
                                  <span className="text-sm text-muted-foreground">Cold Number</span>
                                </div>
                                <span className="text-2xl font-mono font-bold">{singleResults[0].coldNumber}</span>
                              </div>
                            )}
                          </div>

                          {singleResults[0].nextJackpot && (
                            <div className="bg-gradient-to-r from-lottery-ball-main/10 to-lottery-ball-bonus/10 rounded-lg p-6 text-center">
                              <p className="text-sm text-muted-foreground mb-1">Estimated Next Jackpot</p>
                              <p className="text-3xl font-bold">{singleResults[0].nextJackpot}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {singleResults.length > 1 && (
                        <div>
                          <h2 className="text-2xl font-semibold mb-6">Previous Results</h2>
                          <div className="space-y-4">
                            {singleResults.slice(1).map((result) => (
                              <Card key={result.id} data-testid={`card-history-${result.id}`}>
                                <CardContent className="py-4">
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <Badge variant="outline">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {formatShortDate(result.drawDate)}
                                    </Badge>
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
                  )}
                </>
              )}

              <div className="mt-8 text-center">
                <Link href={`/draw-history/${slug}`}>
                  <Button variant="outline" data-testid="button-view-draw-history">
                    View Complete Draw History
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <CircleDot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Results Available</h2>
              <p className="text-muted-foreground mb-6">
                Results for {groupName} will appear here after they are published.
              </p>
              <Link href="/">
                <Button data-testid="button-back-home-empty">Return to Homepage</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 lg:py-12 bg-card">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>How to Play {groupName}</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                {groupDescription || `${groupName} is one of South Africa's most popular lottery games. 
                Select your numbers, purchase your ticket, and check back here 
                after each draw to see if you've won!`}
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
