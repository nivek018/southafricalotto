import { useState, useMemo, useEffect } from "react";
import { AdSlot } from "@/components/ad-slot";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { LotteryBall } from "@/components/lottery-ball";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, History, Calendar, CircleDot, Trophy } from "lucide-react";
import { format } from "date-fns";
import type { LotteryResult } from "@shared/schema";
import { getGroupForSlug, LOTTERY_GROUPS, canonicalSlug } from "@shared/schema";

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

export default function DrawHistoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const canonical = canonicalSlug(slug || "");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (canonical && canonical !== slug) {
      setLocation(`/draw-history/${canonical}`);
    }
  }, [canonical, slug, setLocation]);

  const groupInfo = useMemo(() => getGroupForSlug(canonical || ""), [canonical]);
  const groupSlug = groupInfo?.groupSlug || null;
  const hasGroup = !!groupInfo;

  const { data: groupedData, isLoading: groupLoading } = useQuery<GroupedResultsResponse>({
    queryKey: ["/api/results/group", groupSlug],
    enabled: !!canonical && hasGroup && !!groupSlug,
  });

  const { data: singleResults, isLoading: singleLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/game", canonical],
    enabled: !!canonical && !hasGroup,
  });

  const isLoading = hasGroup ? groupLoading : singleLoading;

  const groupName = hasGroup 
    ? groupedData?.group?.name || groupInfo?.group?.name || canonical
    : singleResults?.[0]?.gameName || canonical?.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Lottery";

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

  const sortNumbers = (nums: number[] | string | undefined) => {
    if (!nums) return [];
    if (Array.isArray(nums)) return [...nums].sort((a, b) => a - b);
    try {
      const parsed = JSON.parse(nums);
      return Array.isArray(parsed) ? [...parsed].sort((a, b) => a - b) : [];
    } catch {
      return [];
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDateSlug = (dateStr: string) => {
    const effectiveGroupSlug = groupSlug || slug;
    return `/${effectiveGroupSlug}-result/${dateStr}`;
  };

  const allDates = useMemo(() => {
    if (hasGroup && groupedData) {
      const dateMap: Record<string, boolean> = {};
      Object.values(groupedData.allResults).forEach(results => {
        results.forEach(r => { dateMap[r.drawDate] = true; });
      });
      return Object.keys(dateMap).sort((a, b) => b.localeCompare(a));
    } else if (singleResults) {
      const dateMap: Record<string, boolean> = {};
      singleResults.forEach(r => { dateMap[r.drawDate] = true; });
      return Object.keys(dateMap).sort((a, b) => b.localeCompare(a));
    }
    return [];
  }, [hasGroup, groupedData, singleResults]);

  const displayDates = showAll ? allDates : allDates.slice(0, 7);

  const getResultsForDate = (date: string) => {
    if (hasGroup && groupedData) {
      const results: Record<string, LotteryResult> = {};
      groupedData.group.variants.forEach(variantSlug => {
        const variantResults = groupedData.allResults[variantSlug] || [];
        const result = variantResults.find(r => r.drawDate === date);
        if (result) {
          results[variantSlug] = result;
        }
      });
      return results;
    } else if (singleResults) {
      const result = singleResults.find(r => r.drawDate === date);
      if (result) {
        return { [slug || ""]: result };
      }
    }
    return {};
  };

  useEffect(() => {
    document.title = `${groupName} Draw History - Complete Results Archive | African Lottery`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `Complete ${groupName} draw history and past results. View all previous winning numbers, jackpots for South African ${groupName}.`);
    }
  }, [groupName]);

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
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-draw-history">
              {groupName} - Draw History
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete history of {groupName} results{hasGroup ? " including all variants" : ""}. Click on any date to view the full results page.
          </p>
          {hasGroup && groupedData && (
            <div className="flex flex-wrap gap-2 mt-3">
              {groupedData.group.variants.map(v => (
                <Badge key={v} variant="secondary" data-testid={`badge-variant-${v}`}>
                  {getVariantDisplayName(v)}
                </Badge>
              ))}
            </div>
          )}
          <div className="max-w-5xl mx-auto w-full mt-4">
            <AdSlot slot="5683668562" className="hidden md:block" />
            <AdSlot slot="3057505225" className="block md:hidden" />
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {allDates.length} draw dates available
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[...Array(4)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : displayDates.length > 0 ? (
          <>
            <div className="space-y-6">
              {displayDates.map((date) => {
                const resultsForDate = getResultsForDate(date);
                const variants = hasGroup && groupedData ? groupedData.group.variants : [canonical || ""];
                
                return (
                  <Card key={date} className="overflow-hidden" data-testid={`card-date-${date}`}>
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{formatDate(date)}</CardTitle>
                        </div>
                        <Link href={getDateSlug(date)}>
                          <Button variant="outline" size="sm" data-testid={`button-view-${date}`}>
                            View Full Results
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {variants.map(variantSlug => {
                          const result = resultsForDate[variantSlug];
                          if (!result) {
                            return (
                              <div key={variantSlug} className="py-2 px-3 bg-muted/20 rounded-md">
                                <span className="text-sm text-muted-foreground">
                                  {getVariantDisplayName(variantSlug)}: No draw
                                </span>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={variantSlug} className="py-3 px-4 bg-muted/20 rounded-lg" data-testid={`result-${variantSlug}-${date}`}>
                              <div className="grid grid-cols-1 lg:grid-cols-[200px,1fr,200px] items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <CircleDot className="h-4 w-4 text-lottery-ball-main" />
                                  <span className="font-semibold">{getVariantDisplayName(variantSlug)}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-center">
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
                                  <div className="flex items-center gap-1 justify-start lg:justify-end">
                                    <Trophy className="h-4 w-4 text-lottery-ball-bonus" />
                                    <span className="font-semibold text-sm">Jackpot {result.jackpotAmount}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {!showAll && allDates.length > 7 && (
              <div className="mt-8 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAll(true)}
                  data-testid="button-show-all"
                >
                  Show All {allDates.length} Draw Dates
                </Button>
              </div>
            )}
            
            {showAll && allDates.length > 7 && (
              <div className="mt-8 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAll(false)}
                  data-testid="button-show-less"
                >
                  Show Last 7 Draw Dates
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-results">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              No draw history available for {groupName} yet.
            </p>
          </div>
        )}

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>About {groupName} Draw History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page shows the complete history of {groupName} lottery draws
              {hasGroup ? " including all game variants" : ""}. Click on any draw date 
              to view the detailed results page and past winning numbers.
            </p>
            <p className="text-muted-foreground">
              Browse previous draws to compare winning numbers and jackpots over time.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href={`/game/${slug}`}>
                <Button variant="outline" data-testid="link-game-page">
                  View Latest {groupName} Results
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
