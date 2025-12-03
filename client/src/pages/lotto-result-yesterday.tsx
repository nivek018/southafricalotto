import { useQuery } from "@tanstack/react-query";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronLeft, Calendar, Bell, HelpCircle, AlertCircle } from "lucide-react";
import type { LotteryResult } from "@shared/schema";
import { useEffect } from "react";
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
    question: "When are yesterday's lottery results available?",
    answer: "Results from the previous day are available immediately after midnight SAST. All draws from the previous day will be displayed on this page.",
  },
  {
    question: "Which games are shown on this page?",
    answer: "This page shows all South Africa lottery games that had draws yesterday, including Powerball, Powerball Plus, Lotto, Lotto Plus 1, Lotto Plus 2, Daily Lotto, and Daily Lotto Plus.",
  },
  {
    question: "Why might there be no results for yesterday?",
    answer: "Not all games have draws every day. Powerball draws on Tuesday and Friday, Lotto draws on Wednesday and Saturday. Only Daily Lotto has draws every day.",
  },
  {
    question: "How do I claim a lottery prize?",
    answer: "Prizes up to R2,000 can be claimed at any lottery retailer. Larger prizes must be claimed at a regional lottery office or the head office. You'll need your winning ticket and valid ID.",
  },
  {
    question: "How long do I have to claim my prize?",
    answer: "You have 365 days from the draw date to claim your prize. After this period, unclaimed prizes are forfeited and used for good causes.",
  },
];

function getYesterdayDateSAST(): string {
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
  base.setUTCDate(base.getUTCDate() - 1);
  return fmt.format(base);
}

export default function LottoResultYesterdayPage() {
  const { data: results, isLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/yesterday"],
  });

  const yesterdayDate = getYesterdayDateSAST();
  const formattedYesterday = new Date(yesterdayDate).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    document.title = `Lotto Result Yesterday —" ${formattedYesterday} | Draw Summary`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Check yesterday's South African lottery results including Powerball, Lotto, Lotto Plus, and Daily Lotto. Updated daily with winning numbers and jackpot amounts.");
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      const meta = document.createElement('meta');
      meta.name = 'keywords';
      meta.content = 'lotto results yesterday, south african lottery, powerball results, lotto plus results, daily lotto, winning numbers';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl lg:text-4xl font-bold" data-testid="heading-yesterday-results">
              Lotto Results Yesterday
            </h1>
          </div>
          <p className="text-muted-foreground text-lg" data-testid="text-yesterday-date">
            South Africa Lotto Result Yesterday —" {new Date(yesterdayDate).toLocaleDateString('en-ZA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/powerball-result/yesterday">
            <Button variant="outline" size="sm" data-testid="link-powerball-yesterday">
              Powerball Yesterday
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
            {[...Array(6)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-results">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Results Yesterday</h3>
            <p className="text-muted-foreground">
              No lottery draws were held on {new Date(yesterdayDate).toLocaleDateString('en-ZA')}.
            </p>
          </div>
        )}

        <div className="mt-12 bg-card rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">About Yesterday's Lottery Results</h2>
          <p className="text-muted-foreground mb-4">
               lottery results from the previous day. Results include 
            Powerball, Powerball Plus, Lotto, Lotto Plus 1, Lotto Plus 2, Daily Lotto, and Daily Lotto Plus.
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
