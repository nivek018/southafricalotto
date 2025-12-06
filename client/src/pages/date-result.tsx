import { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { LotteryBall } from "@/components/lottery-ball";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, CircleDot, Trophy, History, Users } from "lucide-react";
import { format, addDays, subDays, parseISO } from "date-fns";
import type { LotteryResult } from "@shared/schema";
import { LOTTERY_GROUPS, canonicalSlug } from "@shared/schema";

interface DateResultsResponse {
  date: string;
  groupSlug: string;
  groupName: string;
  results: Record<string, LotteryResult>;
  previousDate: string | null;
  nextDate: string | null;
  variants: string[];
}

const DRAW_COPY: Record<string, {
  intro: ((links: { powerball: string; lotto: string; daily: string; jackpot: string }) => string) | null;
  reminders: string[];
  faqs: { question: string; answer: string }[];
}> = {
  "daily-lotto": {
    intro: null,
    reminders: [
      "Draws happen every evening around 21:00 SAST; ticket cut-off is shortly before draw time.",
      "Jackpot is shared among all top-division winners; amounts shown here reflect the per-winner share.",
      "Prizes must be claimed within 365 days of the draw date with a valid ticket.",
      "No bonus ball in Daily Lotto; five main numbers determine all prize divisions.",
      "Results usually appear within minutes after the official draw verification.",
    ],
    faqs: [
      { question: "When are Daily Lotto draws?", answer: "Every evening around 21:00 SAST, seven days a week." },
      { question: "Do Daily Lotto jackpots roll over?", answer: "No. The top prize is shared among winners and does not roll over." },
      { question: "How many numbers are drawn?", answer: "Five numbers from 1 to 36. There is no bonus ball." },
      { question: "How is the jackpot split?", answer: "The top prize is divided equally among all top-division winners for that draw." },
      { question: "How long to claim?", answer: "You generally have 365 days from the draw date to claim prizes in South Africa." },
    ],
  },
  "powerball": {
    intro: null,
    reminders: [
      "Draws run on Tuesdays and Fridays at about 20:58 SAST.",
      "Jackpots roll over when not won and can grow quickly; amounts shown are per winner for this draw.",
      "Check tickets and claim prizes within 365 days of the draw date.",
      "PowerBall is drawn from 1–20 and is required for the jackpot; it also boosts secondary prizes.",
      "Results typically publish within minutes after the official confirmation.",
    ],
    faqs: [
      { question: "What is the PowerBall number?", answer: "It is a separate ball from 1–20. Matching it can boost secondary prizes and is required for the jackpot." },
      { question: "Do jackpots roll over?", answer: "Yes. If no one wins the top prize, the jackpot carries into the next draw." },
      { question: "How many numbers are drawn?", answer: "Five main numbers (1–50) plus one PowerBall (1–20)." },
      { question: "Can I see previous draws?", answer: "Yes. Use the Powerball game page or draw history to browse prior results." },
      { question: "How long to claim?", answer: "Prizes generally must be claimed within 365 days of the draw date in South Africa." },
    ],
  },
  "lotto": {
    intro: null,
    reminders: [
      "Draws occur every Wednesday and Saturday evening in South Africa.",
      "Jackpots roll over when not won; amounts shown are per winner for this draw.",
      "Claim prizes within 365 days; keep your ticket safe until verified.",
      "Bonus ball applies to secondary divisions; the jackpot requires all six main numbers.",
      "Results are usually posted within minutes after official confirmation.",
    ],
    faqs: [
      { question: "How many numbers are drawn?", answer: "Six main numbers from 1–58, plus one bonus ball used for secondary divisions." },
      { question: "When are Lotto draws?", answer: "Every Wednesday and Saturday evening (SAST)." },
      { question: "Do Lotto jackpots roll over?", answer: "Yes. If the top prize isn’t won, it rolls to the next draw." },
      { question: "How do Plus draws work?", answer: "Lotto Plus 1 and Plus 2 use the same numbers you pick, with separate prize pools and draws." },
      { question: "How long to claim?", answer: "Prizes generally must be claimed within 365 days of the draw date in South Africa." },
    ],
  },
};

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
  const normalizedSlug = useMemo(() => {
    if (gameSlug) return canonicalSlug(gameSlug);
    if (data?.groupSlug) return canonicalSlug(data.groupSlug);
    return null;
  }, [gameSlug, data?.groupSlug]);

  useEffect(() => {
    if (data) {
      document.title = `${groupName} Results for ${formatDisplayDate(data.date)} | African Lottery`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", `${groupName} lottery results and winning numbers for ${formatDisplayDate(data.date)}. View the complete draw results with jackpot, winners, and variants for this date.`);
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

        <div className="mb-8 text-muted-foreground">
          <p className="text-base leading-relaxed text-foreground">
            {normalizedSlug === "daily-lotto" && (
              <>
                Daily Lotto results are posted right after the official evening draw. Five numbers from 1–36 are pulled nightly—see the winning numbers below, explore more draws on the{" "}
                <Link href="/game/daily-lotto" className="text-primary underline underline-offset-4">Daily Lotto page</Link>, check the{" "}
                <Link href="/game/lotto" className="text-primary underline underline-offset-4">Lotto page</Link> for other 6-ball draws, or view all jackpots on{" "}
                <Link href="/game/jackpot" className="text-primary underline underline-offset-4">Jackpot Central</Link>.
              </>
            )}
            {normalizedSlug === "powerball" && (
              <>
                Powerball results post moments after the Tuesday/Friday draw. Check the winning numbers below, visit the{" "}
                <Link href="/game/powerball" className="text-primary underline underline-offset-4">Powerball page</Link> for more draws, the{" "}
                <Link href="/game/lotto" className="text-primary underline underline-offset-4">Lotto page</Link> for 6-ball games, see nightly draws on{" "}
                <Link href="/game/daily-lotto" className="text-primary underline underline-offset-4">Daily Lotto</Link>, or view current jackpots on{" "}
                <Link href="/game/jackpot" className="text-primary underline underline-offset-4">Jackpot Central</Link>.
              </>
            )}
            {normalizedSlug === "lotto" && (
              <>
                Lotto results cover the Wednesday/Saturday main draw and Plus variants. Six numbers from 1–58 are drawn, plus a bonus ball for secondary prizes. See the numbers below, visit the{" "}
                <Link href="/game/lotto" className="text-primary underline underline-offset-4">Lotto page</Link> for more draws, check{" "}
                <Link href="/game/powerball" className="text-primary underline underline-offset-4">Powerball</Link> for the 5+PB game, view nightly draws on{" "}
                <Link href="/game/daily-lotto" className="text-primary underline underline-offset-4">Daily Lotto</Link>, or see all jackpots on{" "}
                <Link href="/game/jackpot" className="text-primary underline underline-offset-4">Jackpot Central</Link>.
              </>
            )}
            {!normalizedSlug && (
              <>
                Official {groupName} winning numbers. Explore more on{" "}
                <Link href="/game/powerball" className="text-primary underline underline-offset-4">Powerball</Link>,{" "}
                <Link href="/game/lotto" className="text-primary underline underline-offset-4">Lotto</Link>,{" "}
                <Link href="/game/daily-lotto" className="text-primary underline underline-offset-4">Daily Lotto</Link>, and{" "}
                <Link href="/game/jackpot" className="text-primary underline underline-offset-4">Jackpot Central</Link>.
              </>
            )}
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
                    {(result.jackpotAmount || typeof (result as any).winner === "number") && (
                      <div className="flex flex-wrap justify-center items-center gap-3 mt-1">
                        {result.jackpotAmount && (
                          <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                            <Trophy className="h-4 w-4 text-lottery-ball-bonus" />
                            <span className="text-sm text-muted-foreground">Jackpot:</span>
                            <span className="text-base font-semibold text-foreground">{result.jackpotAmount}</span>
                          </div>
                        )}
                        {typeof (result as any).winner === "number" && (
                          <div className="inline-flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="text-sm text-muted-foreground">Winners:</span>
                            <span className="text-base font-semibold text-primary">{(result as any).winner}</span>
                          </div>
                        )}
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

        <Card className="mt-10 shadow-sm border">
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <History className="h-5 w-5 text-primary" />
                Reminders
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {(DRAW_COPY[normalizedSlug || ""]?.reminders || [
                  "Check the published numbers against your ticket and keep it safe until prizes are claimed.",
                  "Jackpot amounts reflect the per-winner share for the top division.",
                  "Most South African lottery prizes must be claimed within 365 days of the draw date.",
                  "Bonus balls apply only to specific games—verify the rules for your ticket.",
                  "Results typically appear within minutes after official confirmation; verify against the official ticket if in doubt.",
                ]).map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Users className="h-5 w-5 text-primary" />
                FAQs
              </h3>
              <div className="space-y-2">
                {(DRAW_COPY[normalizedSlug || ""]?.faqs || [
                  { question: "When are draws held?", answer: "Draw schedules depend on the game; check the game page for exact days and times." },
                  { question: "How are jackpots shown?", answer: "Amounts shown here are per-winner shares when the top division is won; rollovers apply when not won for rollover games." },
                  { question: "How long do I have to claim?", answer: "In South Africa, prizes generally must be claimed within 365 days of the draw date." },
                  { question: "Where can I see more draws?", answer: "Visit the game pages or draw history to browse previous results and jackpots." },
                  { question: "Do results include Plus variants?", answer: "Where applicable, Plus variants are shown alongside the main game on this page." },
                ]).map((faq, idx) => (
                  <div key={idx} className="rounded-md bg-muted/40 p-3 border border-border/60">
                    <p className="text-sm font-semibold text-foreground">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
