import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LotteryBall } from "@/components/lottery-ball";
import { GameDetailSkeleton } from "@/components/loading-skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Calendar,
  ArrowLeft,
  Trophy,
  CircleDot,
  History,
  Clock,
  Timer,
  Flame,
  Snowflake,
  HelpCircle,
  BookOpen
} from "lucide-react";
import type { LotteryResult, LotteryGame } from "@shared/schema";
import { getGroupForSlug } from "@shared/schema";
import { useEffect, useMemo, useState } from "react";
import { useCountdown, getNextDrawDate } from "@/hooks/use-countdown";
import { PrizeHistoryChart } from "@/components/prize-history-chart";

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

interface StatisticsResponse {
  hotNumbers: { number: number; count: number }[];
  coldNumbers: { number: number; count: number }[];
  frequencyMap: Record<number, number>;
  dateRange: { from: string | null; to: string | null };
  totalDraws: number;
  analyzedDraws: number;
}

const GAME_HOW_TO_PLAY: Record<string, { steps: string[]; tips: string[] }> = {
  powerball: {
    steps: [
      "Choose 5 numbers from 1 to 50 for the main draw",
      "Choose 1 PowerBall number from 1 to 20",
      "Purchase your ticket at any authorized lottery retailer or online",
      "Keep your ticket safe and check the results after the draw",
      "Match all 5 main numbers plus the PowerBall to win the jackpot"
    ],
    tips: [
      "You can use Quick Pick to let the computer randomly select your numbers",
      "Consider joining a lottery syndicate to increase your chances",
      "Set a budget and stick to it - play responsibly",
      "Check results within 365 days to claim your prize"
    ]
  },
  lotto: {
    steps: [
      "Choose 6 numbers from 1 to 58",
      "Select your draw days (Wednesday and/or Saturday)",
      "Purchase your ticket at any authorized lottery retailer or online",
      "Keep your ticket safe and check the results after each draw",
      "Match all 6 numbers to win the jackpot, or win smaller prizes with fewer matches"
    ],
    tips: [
      "You can play Lotto Plus 1 and Lotto Plus 2 for additional chances to win",
      "Multi-draw options allow you to play the same numbers for multiple weeks",
      "The bonus ball increases your chances of winning secondary prizes",
      "Jackpots roll over when not won, potentially reaching millions"
    ]
  },
  "daily-lotto": {
    steps: [
      "Choose 5 numbers from 1 to 36",
      "Purchase your ticket before the daily 21:00 SAST draw time",
      "Tickets can be bought at authorized retailers or online",
      "Check the results after 21:00 SAST every day",
      "Match all 5 numbers to share in the guaranteed R400,000+ jackpot"
    ],
    tips: [
      "Daily Lotto has a fixed jackpot that is shared among all winners",
      "No bonus ball means simpler gameplay",
      "Play every day for more chances to win",
      "Results are available immediately after the draw"
    ]
  }
};

const GAME_FAQS: Record<string, { question: string; answer: string }[]> = {
  powerball: [
    {
      question: "When are Powerball draws held?",
      answer: "Powerball draws take place every Tuesday and Friday at 20:58 SAST (South African Standard Time)."
    },
    {
      question: "What is the minimum Powerball jackpot?",
      answer: "The minimum Powerball jackpot starts at R3 million. If there's no jackpot winner, the prize rolls over to the next draw."
    },
    {
      question: "How much does a Powerball ticket cost?",
      answer: "A single Powerball ticket costs R5. You can also add Powerball Plus for an additional R2.50."
    },
    {
      question: "What are the odds of winning the Powerball jackpot?",
      answer: "The odds of winning the Powerball jackpot are approximately 1 in 42 million. However, there are 9 prize divisions with better odds for smaller prizes."
    },
    {
      question: "How long do I have to claim my Powerball prize?",
      answer: "You have 365 days from the date of the draw to claim your prize. Prizes not claimed within this period are forfeited."
    }
  ],
  lotto: [
    {
      question: "When are Lotto draws held?",
      answer: "Lotto draws take place every Wednesday and Saturday at 20:57 SAST (South African Standard Time)."
    },
    {
      question: "What is the difference between Lotto, Lotto Plus 1, and Lotto Plus 2?",
      answer: "All three use the same numbers you select, but they are separate draws with separate jackpots. Lotto Plus 1 and Plus 2 give you additional chances to win with the same numbers."
    },
    {
      question: "How much does a Lotto ticket cost?",
      answer: "A Lotto ticket costs R5. Adding Lotto Plus 1 costs an additional R2.50, and Lotto Plus 2 costs another R2.50."
    },
    {
      question: "What are the odds of winning the Lotto jackpot?",
      answer: "The odds of winning the Lotto jackpot are approximately 1 in 20 million. There are 8 prize divisions with varying odds."
    },
    {
      question: "What is the bonus ball used for?",
      answer: "The bonus ball is used to determine winners in certain prize divisions. It can help you win secondary prizes if you match some main numbers plus the bonus."
    }
  ],
  "daily-lotto": [
    {
      question: "When is the Daily Lotto draw held?",
      answer: "Daily Lotto draws take place every day at 21:00 SAST (South African Standard Time), including weekends and public holidays."
    },
    {
      question: "What is the Daily Lotto jackpot?",
      answer: "Daily Lotto has a guaranteed minimum jackpot of R400,000 that is shared among all jackpot winners. Unlike other lottos, it doesn't roll over."
    },
    {
      question: "How much does a Daily Lotto ticket cost?",
      answer: "A Daily Lotto ticket costs R3, making it the most affordable lottery option in South Africa."
    },
    {
      question: "What are the odds of winning Daily Lotto?",
      answer: "The odds of winning the Daily Lotto jackpot are approximately 1 in 376,992, making it one of the easiest lottery jackpots to win."
    },
    {
      question: "Is there a bonus ball in Daily Lotto?",
      answer: "No, Daily Lotto does not have a bonus ball. You simply need to match all 5 main numbers to win the jackpot."
    }
  ]
};

const HOT_COLD_GAMES = ["powerball", "lotto", "daily-lotto"];

export default function GamePage() {
  const [, params] = useRoute("/game/:slug");
  const slug = params?.slug || "";

  const getSASTDateString = () => {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Johannesburg",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(new Date());
  };
  const [sastDay, setSastDay] = useState(getSASTDateString());

  const groupInfo = useMemo(() => getGroupForSlug(slug), [slug]);
  const groupSlug = groupInfo?.groupSlug || null;
  const hasGroup = !!groupInfo;

  const mainGameSlug = hasGroup ? (groupInfo?.group?.slugs?.[0] || slug) : slug;

  const { data: gameData, refetch: refetchGame } = useQuery<LotteryGame>({
    queryKey: ["/api/games", mainGameSlug],
    enabled: !!mainGameSlug,
  });

  const { data: groupedData, isLoading: groupLoading, refetch: refetchGrouped } = useQuery<GroupedResultsResponse>({
    queryKey: ["/api/results/group", groupSlug],
    enabled: !!slug && hasGroup && !!groupSlug,
  });

  const { data: singleResults, isLoading: singleLoading, refetch: refetchSingle } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/game", slug],
    enabled: !!slug && !hasGroup,
  });

  const { data: statistics, refetch: refetchStats } = useQuery<StatisticsResponse>({
    queryKey: [`/api/statistics/${mainGameSlug}?draws=15`],
    enabled: !!mainGameSlug,
  });

  const isLoading = hasGroup ? groupLoading : singleLoading;

  const nextDrawDate = useMemo(() => {
    if (!gameData) return null;
    return getNextDrawDate(gameData.drawDays, gameData.drawTime);
  }, [gameData]);

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

  const latestJackpots = useMemo(() => {
    if (hasGroup && groupedData) {
      return groupedData.group.variants
        .map((variant) => {
          const res = groupedData.latestResults[variant];
          const amount = res?.jackpotAmount || null;
          return amount ? { name: getVariantDisplayName(variant), amount } : null;
        })
        .filter(Boolean) as { name: string; amount: string }[];
    }
    if (singleResults && singleResults[0]?.jackpotAmount) {
      const displayName = singleResults[0].gameName || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return [{ name: displayName, amount: singleResults[0].jackpotAmount }];
    }
    return [];
  }, [hasGroup, groupedData, singleResults, slug]);

  const countdown = useCountdown(nextDrawDate);

  const parsedDrawDays = useMemo(() => {
    if (!gameData?.drawDays) return [];
    if (Array.isArray(gameData.drawDays)) return gameData.drawDays;
    try {
      return JSON.parse(gameData.drawDays);
    } catch {
      return [];
    }
  }, [gameData]);

  const sortNumbers = (nums: number[] | string | undefined) => {
    if (!nums) return [];
    let parsedNums: number[] = [];
    if (Array.isArray(nums)) {
      parsedNums = nums;
    } else if (typeof nums === "string") {
      try {
        parsedNums = JSON.parse(nums);
      } catch (e) {
        console.error("Failed to parse winningNumbers:", nums);
        return [];
      }
    }
    return [...parsedNums].sort((a, b) => a - b);
  };

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

  const groupName = hasGroup
    ? groupedData?.group?.name || groupInfo?.group?.name || slug
    : singleResults?.[0]?.gameName || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  const groupDescription = hasGroup
    ? groupedData?.group?.description || groupInfo?.group?.description
    : null;

  const showHotColdSection = HOT_COLD_GAMES.includes(groupSlug || slug);

  const getLatestDrawDate = () => {
    if (hasGroup && groupedData) {
      const dates = Object.values(groupedData.latestResults || {})
        .map((r) => r?.drawDate)
        .filter(Boolean) as string[];
      if (dates.length === 0) return null;
      return dates.sort((a, b) => b.localeCompare(a))[0];
    }
    if (singleResults && singleResults.length > 0) {
      return singleResults[0].drawDate;
    }
    return null;
  };

  const formatTitleDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    if (isLoading) return;

    const latestDate = getLatestDrawDate();
    const formattedDate = latestDate ? formatTitleDate(latestDate) : null;
    let title = `${groupName} Results - Latest Winning Numbers | SA Lotto Results`;

    if (groupSlug === "powerball" && formattedDate) {
      title = `Powerball Results — ${formattedDate} | Powerball & Powerball Plus`;
    } else if (groupSlug === "lotto" && formattedDate) {
      title = `Lotto Results — ${formattedDate} | Lotto, Lotto Plus 1 & Plus 2`;
    } else if (groupSlug === "daily-lotto" && formattedDate) {
      title = `Daily Lotto Results — ${formattedDate} | Daily Lotto & Daily Lotto Plus`;
    }

    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `Check the latest ${groupName} results and winning numbers. View draw history, hot/cold numbers, and jackpot information for South African ${groupName}.`);
    }
  }, [groupName, isLoading, groupSlug, groupedData, singleResults]);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getSASTDateString();
      setSastDay((prev) => {
        if (prev !== current) {
          // SAST day rolled; refetch to get latest draws
          void refetchGame();
          void refetchGrouped();
          void refetchSingle();
          void refetchStats();
          return current;
        }
        return prev;
      });
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [refetchGame, refetchGrouped, refetchSingle, refetchStats]);

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

      {(nextDrawDate || latestJackpots.length > 0) && (
        <section className="py-6 bg-gradient-to-r from-lottery-ball-main/5 to-lottery-ball-bonus/5 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nextDrawDate && !countdown.isExpired && (
                <Card className="bg-background/80 backdrop-blur" data-testid="card-next-draw">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-lottery-ball-main/10 rounded-full">
                        <Timer className="h-5 w-5 text-lottery-ball-main" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Next Draw</h3>
                        <p className="text-lg font-bold" data-testid="text-countdown">{countdown.relativeTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{countdown.formattedTime} remaining</span>
                    </div>
                    {gameData?.drawDays && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Draws: {parsedDrawDays.join(", ")} at {gameData.drawTime} SAST
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {latestJackpots.length > 0 && (
                <Card className="bg-background/80 backdrop-blur" data-testid="card-latest-jackpot">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-lottery-ball-bonus/10 rounded-full">
                        <Trophy className="h-5 w-5 text-lottery-ball-bonus" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-muted-foreground">Latest Jackpots</h3>
                        <p className="text-xs text-muted-foreground">Most recent recorded draw</p>
                      </div>
                    </div>
                    <div
                      className="grid gap-3"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, latestJackpots.length))}, minmax(0, 1fr))`
                      }}
                    >
                      {latestJackpots.map((item, idx) => (
                        <div key={idx} className="rounded-lg border bg-muted/40 px-3 py-2 text-center">
                          <p className="text-sm font-semibold text-foreground mb-1">{item.name}</p>
                          <p className="text-lg font-bold text-lottery-ball-bonus">{item.amount}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </section>
      )}

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

                            {latestResult.jackpotAmount && (
                              <div className="flex justify-center">
                                <div className="inline-flex flex-col items-center rounded-lg bg-gradient-to-r from-lottery-ball-main/10 to-lottery-ball-bonus/10 px-4 py-3 min-w-[240px]">
                                  <p className="text-xs text-muted-foreground mb-1">Jackpot</p>
                                  <p className="text-2xl font-bold">{latestResult.jackpotAmount}</p>
                                </div>
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

              {showHotColdSection && statistics && (statistics.hotNumbers.length > 0 || statistics.coldNumbers.length > 0) && (
                <section className="mt-12" data-testid="section-hot-cold-numbers">
                  <div className="bg-card/60 border rounded-xl p-6 lg:p-8 shadow-sm">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold mb-1">Hot & Cold Numbers</h2>
                      <p className="text-muted-foreground">
                        Analysis based on the last {statistics.totalDraws} draws
                        {statistics.dateRange.from && statistics.dateRange.to && (
                          <span className="block text-sm mt-1">
                            From {new Date(statistics.dateRange.from).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} to {new Date(statistics.dateRange.to).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {statistics.hotNumbers.length > 0 && (
                        <Card className="bg-muted/40" data-testid="card-hot-numbers">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-red-500/10 rounded-full">
                                <Flame className="h-5 w-5 text-red-500" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">Hot Numbers</CardTitle>
                                <p className="text-xs text-muted-foreground">Most frequently drawn in last {statistics.totalDraws} draws</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap items-center gap-3">
                              {statistics.hotNumbers.slice(0, 5).map((item) => (
                                <div key={item.number} className="flex flex-col items-center" data-testid={`hot-number-${item.number}`}>
                                  <LotteryBall number={item.number} size="lg" />
                                  <Badge variant="secondary" className="mt-2 text-xs bg-red-500/10 text-red-600 dark:text-red-400">
                                    {item.count}x
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {statistics.coldNumbers.length > 0 && (
                        <Card className="bg-muted/40" data-testid="card-cold-numbers">
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-500/10 rounded-full">
                                <Snowflake className="h-5 w-5 text-blue-500" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">Cold Numbers</CardTitle>
                                <p className="text-xs text-muted-foreground">Least frequently drawn in last {statistics.totalDraws} draws</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap items-center gap-3">
                              {statistics.coldNumbers.slice(0, 5).map((item) => (
                                <div key={item.number} className="flex flex-col items-center" data-testid={`cold-number-${item.number}`}>
                                  <LotteryBall number={item.number} size="lg" />
                                  <Badge variant="secondary" className="mt-2 text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    {item.count}x
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    <p className="text-center text-xs text-muted-foreground mt-6">
                      Note: Past performance does not guarantee future results. All lottery draws are random.
                    </p>
                  </div>
                </section>
              )}

              {hasGroup && groupedData && (
                <PrizeHistoryChart
                  groupSlug={groupSlug || ""}
                  variants={groupedData.group.variants}
                />
              )}
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

      <section className="py-8 lg:py-12 bg-card" data-testid="section-how-to-play">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle>How to Play {groupName}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {GAME_HOW_TO_PLAY[groupSlug || slug] ? (
                <>
                  <div>
                    <h3 className="font-semibold mb-3">Steps to Play</h3>
                    <ol className="space-y-2">
                      {GAME_HOW_TO_PLAY[groupSlug || slug].steps.map((step, idx) => (
                        <li key={idx} className="flex gap-3 text-muted-foreground">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Tips & Information</h3>
                    <ul className="space-y-2">
                      {GAME_HOW_TO_PLAY[groupSlug || slug].tips.map((tip, idx) => (
                        <li key={idx} className="flex gap-3 text-muted-foreground">
                          <span className="flex-shrink-0 text-primary">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">
                  <p className="mb-4">
                    {groupDescription || `${groupName} is one of South Africa's most popular lottery games. 
                    Select your numbers, purchase your ticket, and check back here 
                    after each draw to see if you've won!`}
                  </p>
                  <p>
                    Remember to always verify your results with official lottery retailers
                    and keep your ticket safe until you've claimed any winnings.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {GAME_FAQS[groupSlug || slug] && (
        <section className="py-8 lg:py-12" data-testid="section-faqs">
          <div className="max-w-7xl mx-auto px-4 lg:px-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-6 w-6 text-primary" />
                  <CardTitle>Frequently Asked Questions about {groupName}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {GAME_FAQS[groupSlug || slug].map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`} data-testid={`faq-item-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
