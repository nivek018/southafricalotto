import { useQuery } from "@tanstack/react-query";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LotteryBall } from "@/components/lottery-ball";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronLeft, Calendar, Clock, CircleDot, Bell, HelpCircle, AlertCircle } from "lucide-react";
import type { LotteryResult, LotteryGame } from "@shared/schema";
import { canonicalSlug } from "@shared/schema";
import { useEffect, useMemo } from "react";
import { AdSlot } from "@/components/ad-slot";

const REMINDERS = [
  {
    title: "Check Your Tickets",
    description: "Always verify your lottery tickets against the official results. Keep your tickets in a safe place until you've confirmed whether you've won.",
  },
  {
    title: "Claim Deadlines",
    description: "Winners have 365 days from the draw date to claim prizes. Don't let your winnings expire!",
  },
  {
    title: "Play Responsibly",
    description: "Set a budget for lottery play and stick to it. Remember, lottery should be fun entertainment, not a financial strategy.",
  },
  {
    title: "Multiple Games",
    description: "Playing Plus games (Powerball Plus, Lotto Plus 1 & 2) gives you additional chances to win with the same numbers.",
  },
];

const FAQS = [
  {
    question: "When are lottery results updated on this page?",
    answer: "Results are updated immediately after each official draw. Daily Lotto draws at 21:00, Lotto draws on Wednesday and Saturday at 20:57, and Powerball draws on Tuesday and Friday at 20:58 SAST.",
  },
  {
    question: "Why do some games show 'TBA' instead of numbers?",
    answer: "TBA (To Be Announced) means the draw hasn't happened yet for that game. Check back after the scheduled draw time for the official results.",
  },
  {
    question: "What does the 'Live' badge mean?",
    answer: "The 'Live' badge indicates that results for that game are now available. The 'Pending' badge means the draw hasn't occurred yet.",
  },
  {
    question: "How do I claim a lottery prize?",
    answer: "Prizes up to R2,000 can be claimed at any lottery retailer. Larger prizes must be claimed at a regional lottery office or the head office. You'll need your winning ticket and valid ID.",
  },
  {
    question: "Are these results official?",
    answer: "We source our results from official lottery data. However, always verify your tickets against the official National Lottery website or authorized retailers.",
  },
];

function getTodayDateSAST(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const now = new Date();
  const parts = fmt.formatToParts(now);
  const year = Number(parts.find(p => p.type === "year")?.value || 0);
  const month = Number(parts.find(p => p.type === "month")?.value || 1);
  const day = Number(parts.find(p => p.type === "day")?.value || 1);
  const base = new Date(Date.UTC(year, month - 1, day));
  return fmt.format(base);
}

function getTodayWeekdaySAST(): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Johannesburg",
    weekday: "long",
  });
  return fmt.format(new Date());
}

const SCHEDULE_MAP: Record<string, string[]> = {
  "powerball": ["tuesday", "friday"],
  "powerball-plus": ["tuesday", "friday"],
  "lotto": ["wednesday", "saturday"],
  "lotto-plus-1": ["wednesday", "saturday"],
  "lotto-plus-2": ["wednesday", "saturday"],
  "daily-lotto": ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  "daily-lotto-plus": ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
};

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
  const todayWeekday = getTodayWeekdaySAST();
  useEffect(() => {
    const formattedDate = new Date(todayDate).toLocaleDateString("en-ZA", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    document.title = `Lotto Result Today \u2014 ${formattedDate} | Official Results`;
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

  const normalizeDateStr = (str: string | null | undefined): string | null => {
    if (!str) return null;
    const match = str.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : str.slice(0, 10);
  };
  const serverToday = data?.date || todayDate;

  const todayGames = useMemo(() => {
    if (!data) return [];
    return data.games.map(({ game, result }) => {
      const drawDateNormalized = normalizeDateStr(result?.drawDate);
      const isTodayResult = drawDateNormalized === serverToday;
      return {
        game,
        result: isTodayResult ? result : null
      };
    });
  }, [data, serverToday]);

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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-today-results">
              Lotto Results Today
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-today-date">
            All South Africa Lotto Result Today - {formatDate(todayDate)}
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
        <div className="max-w-5xl mx-auto w-full mb-6">
          <AdSlot slot="5683668562" className="hidden md:block" />
          <AdSlot slot="3057505225" className="block md:hidden" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(7)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : data ? (
          (() => {
            const parseDrawDays = (game: LotteryGame): string[] => {
              if (Array.isArray(game.drawDays)) return game.drawDays;
              if (typeof game.drawDays === "string") {
                try {
                  const parsed = JSON.parse(game.drawDays);
                  if (Array.isArray(parsed)) return parsed;
                } catch {
                  /* ignore invalid drawDays */
                }
              }
              return [];
            };

            const normalizeDay = (day: string) => {
              const key = day.trim().toLowerCase();
              const map: Record<string, string> = {
                sun: "sunday", sunday: "sunday",
                mon: "monday", monday: "monday",
                tue: "tuesday", tues: "tuesday", tuesday: "tuesday",
                wed: "wednesday", weds: "wednesday", wednesday: "wednesday",
                thu: "thursday", thur: "thursday", thurs: "thursday", thursday: "thursday",
                fri: "friday", friday: "friday",
                sat: "saturday", saturday: "saturday",
              };
              return map[key] || key;
            };

            const todayKey = normalizeDay(todayWeekday);

            const gamesForToday = todayGames.filter(({ game }) => {
              const schedule = SCHEDULE_MAP[game.slug] || [];
              const normalizedSchedule = schedule.map(normalizeDay);

              if (normalizedSchedule.includes(todayKey)) return true;

              const days = parseDrawDays(game).map((d) => normalizeDay(d));
              return days.includes(todayKey);
            });

            if (gamesForToday.length === 0) {
              return (
                <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-scheduled-games">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No scheduled draws today</h3>
                  <p className="text-muted-foreground">
                    There are no lottery games scheduled to draw today.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gamesForToday.map(({ game, result }) => (
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
                    <CardContent className="pt-8 pb-8 text-center flex flex-col items-center gap-6">
                      {result ? (
                        <div className="w-full flex flex-col items-center gap-5">
                          <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 mt-1.5">
                            {sortNumbers(result.winningNumbers).map((num, idx) => (
                              <LotteryBall key={idx} number={num} size="md" />
                            ))}
                            {result.bonusNumber && (
                              <>
                                <span className="text-lg font-bold text-muted-foreground mx-1.5">+</span>
                                <LotteryBall number={result.bonusNumber} isBonus size="md" />
                              </>
                            )}
                          </div>
                          <div className="text-center min-h-[44px] flex flex-col items-center justify-center">
                            {result.jackpotAmount ? (
                              <>
                                <p className="text-xs text-muted-foreground">Jackpot</p>
                                <p className="font-bold text-lottery-ball-bonus">{result.jackpotAmount}</p>
                              </>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center pt-1 pb-1 w-full flex flex-col items-center gap-5">
                          <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 mt-1.5">
                            {Array.from({ length: game.numberCount || 6 }).map((_, idx) => (
                              <div
                                key={idx}
                                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
                              >
                                <span className="text-base font-semibold text-muted-foreground">?</span>
                              </div>
                            ))}
                            {game.hasBonusBall && (
                              <>
                                <span className="text-lg font-bold text-muted-foreground mx-1.5">+</span>
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-base font-semibold text-muted-foreground">?</span>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="text-center min-h-[44px] flex flex-col items-center justify-center">
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              TBA
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Results will be available after the draw
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 text-center">
                        <Link href={`/game/${canonicalSlug(game.slug)}`}>
                          <Button variant="ghost" size="sm" data-testid={`link-game-${game.slug}`}>
                            View Game Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })()
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
            This page displays all South Africa lotto results for today. Results are updated live
            as draws take place throughout the day. Games marked as "TBA" (To Be Announced) will be
            updated once the official draw has been completed.
          </p>
          <p className="text-muted-foreground">
            Draw times are: Daily Lotto at 21:00, Lotto on Wednesday/Saturday at 20:57, and
            Powerball on Tuesday/Friday at 20:58 South African Standard Time (SAST).
          </p>
        </div>

        <div className="mt-8" data-testid="section-reminders">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-500/10 rounded-full">
              <Bell className="h-6 w-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold">Reminders</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REMINDERS.map((reminder, index) => (
              <Card key={index} data-testid={`reminder-${index}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">{reminder.title}</h3>
                      <p className="text-sm text-muted-foreground">{reminder.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-8" data-testid="section-faqs">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-full">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>
          <Card>
            <CardContent className="pt-4">
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
