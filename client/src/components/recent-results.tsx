import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";

type RecentResultsResponse = {
  dates: {
    date: string;
    games: {
      gameSlug: string;
      gameName: string;
      jackpotAmount: string | null;
      groupSlug: string | null;
    }[];
    primaryGroupSlug: string | null;
  }[];
};

const priorityOrder = ["lotto", "powerball", "daily-lotto"];

const formatLongDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatBadge = (dateStr: string) => {
  const d = new Date(dateStr);
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleDateString("en-ZA", { month: "short" }).toUpperCase(),
  };
};

export function RecentResultsSection() {
  const { data, isLoading } = useQuery<RecentResultsResponse>({
    queryKey: ["/api/results/recent-dates?limit=10"],
  });

  const entries = data?.dates || [];

  const skeletonItems = Array.from({ length: 6 });

  return (
    <section className="bg-muted/20 border-t border-border/60 py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold">Recent Lotto Results</h2>
            <p className="text-muted-foreground">
              Latest South Africa lotto draw dates with quick links to full results.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {skeletonItems.map((_, idx) => (
              <Card key={idx} className="bg-card/50 border-dashed">
                <CardContent className="p-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-lg bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-full bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card className="bg-card/60">
            <CardContent className="p-6 text-center text-muted-foreground">
              No recent results available yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {entries.map((entry) => {
              const { day, month } = formatBadge(entry.date);
              const gameNames = entry.games.map((g) => g.gameName).join(", ");
              const gameLinks = entry.games.map((g) => {
                const group = g.groupSlug || g.gameSlug;
                return {
                  name: g.gameName,
                  href: `/${group}-result/${entry.date}`
                };
              });

              const primarySlug =
                priorityOrder.find((slug) => entry.games.some((g) => g.groupSlug === slug)) ||
                entry.primaryGroupSlug ||
                entry.games[0]?.groupSlug ||
                null;
              const primaryHref = primarySlug ? `/${primarySlug}-result/${entry.date}` : null;

              return (
                <Card key={entry.date} className="bg-card/70">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-b from-primary/15 to-primary/10 border flex flex-col items-center justify-center">
                        <span className="text-xl font-bold leading-tight">{day}</span>
                        <span className="text-[11px] font-semibold text-muted-foreground">{month}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          <p className="font-semibold leading-tight">Lotto Results {formatLongDate(entry.date)}</p>
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">
                          Results for {gameNames} drawn on {formatLongDate(entry.date)}.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {gameLinks.map((gl) => (
                            <Link
                              key={gl.href}
                              href={gl.href}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                            >
                              {gl.name}
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          ))}
                          {primaryHref && gameLinks.length === 0 && (
                            <Link
                              href={primaryHref}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors"
                            >
                              View full results
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
