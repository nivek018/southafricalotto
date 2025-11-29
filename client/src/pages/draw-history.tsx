import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, CalendarIcon, History } from "lucide-react";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import type { LotteryResult, LotteryGame } from "@shared/schema";
import { useEffect } from "react";

export default function DrawHistoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);

  const { data: game, isLoading: gameLoading } = useQuery<LotteryGame>({
    queryKey: ["/api/games", slug],
    enabled: !!slug,
  });

  const { data: results, isLoading: resultsLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/game", slug],
    enabled: !!slug,
  });

  const isLoading = gameLoading || resultsLoading;
  const gameName = game?.name || slug?.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") || "Lottery";

  const datesWithResults = useMemo(() => {
    if (!results) return new Set<string>();
    return new Set(results.map(r => r.drawDate));
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!results) return [];
    
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      return results.filter(r => r.drawDate === dateStr);
    }
    
    if (showAll) {
      return results;
    }
    
    return results.slice(0, 7);
  }, [results, selectedDate, showAll]);

  const hasResultsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return datesWithResults.has(dateStr);
  };

  useEffect(() => {
    document.title = `${gameName} Draw History - Complete Results Archive | African Lottery`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", `Complete ${gameName} draw history and past results. View all previous winning numbers, jackpots, and statistics for South African ${gameName}.`);
    }
  }, [gameName]);

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
              {gameName} - Draw History
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete history of {gameName} results. Select a date to view specific results.
          </p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal" data-testid="button-date-picker">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  modifiers={{
                    hasResults: (date) => hasResultsForDate(date),
                    noResults: (date) => !hasResultsForDate(date) && date <= new Date(),
                  }}
                  modifiersClassNames={{
                    hasResults: "bg-primary/20 font-bold",
                    noResults: "text-muted-foreground/50",
                  }}
                  disabled={(date) => date > new Date() || !hasResultsForDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {selectedDate && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedDate(undefined)}
                data-testid="button-clear-date"
              >
                Clear Date
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {results?.length || 0} total results
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map((result) => (
                <LotteryResultCard key={result.id} result={result} />
              ))}
            </div>
            
            {!selectedDate && !showAll && results && results.length > 7 && (
              <div className="mt-8 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAll(true)}
                  data-testid="button-show-all"
                >
                  Show All {results.length} Results
                </Button>
              </div>
            )}
            
            {showAll && (
              <div className="mt-8 text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAll(false)}
                  data-testid="button-show-less"
                >
                  Show Last 7 Results
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg" data-testid="text-no-results">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {selectedDate ? "No Results for Selected Date" : "No Results Found"}
            </h3>
            <p className="text-muted-foreground">
              {selectedDate 
                ? `No ${gameName} results were recorded on ${format(selectedDate, "PPP")}.`
                : `No draw history available for ${gameName} yet.`
              }
            </p>
            {selectedDate && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSelectedDate(undefined)}
              >
                View All Results
              </Button>
            )}
          </div>
        )}

        <Card className="mt-12">
          <CardHeader>
            <CardTitle>About {gameName} Draw History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This page shows the complete history of {gameName} lottery draws. Use the date picker 
              above to find results from a specific date. Dates with available results are highlighted.
            </p>
            <p className="text-muted-foreground">
              Greyed out dates indicate no results are available for that day - either no draw was 
              held or the results haven't been recorded yet.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href={`/game/${slug}`}>
                <Button variant="outline" data-testid="link-game-page">
                  View Latest {gameName} Results
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
