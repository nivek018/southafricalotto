import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight, Clock4 } from "lucide-react";

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

  const skeletonItems = Array.from({ length: 10 });

  return (
    <section className="py-10 lg:py-14">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Clock4 className="w-5 h-5 text-primary" />
              <CardTitle className="text-2xl lg:text-3xl">Recent Lotto Results</CardTitle>
            </div>
            <p className="text-muted-foreground">
              Latest South Africa lotto draw dates with quick links to full results.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {skeletonItems.map((_, idx) => (
                  <Card key={idx} className="bg-card/50 border-dashed min-h-[140px]">
                    <CardContent className="p-4">
                      <div className="flex gap-4 items-start">
                        <div className="w-14 h-14 rounded-lg bg-muted animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2.5">
                          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-full bg-muted animate-pulse rounded" />
                          <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
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
                  const gameLinks = entry.games.map((g) => ({
                    name: g.gameName,
                    href: `/${(g.groupSlug || g.gameSlug)}-result/${entry.date}`
                  }));

                  const primarySlug =
                    priorityOrder.find((slug) => entry.games.some((g) => g.groupSlug === slug)) ||
                    entry.primaryGroupSlug ||
                    entry.games[0]?.groupSlug ||
                    null;
                  const primaryHref = primarySlug ? `/${primarySlug}-result/${entry.date}` : null;

                  return (
                    <Card key={entry.date} className="bg-card/70 min-h-[140px]">
                      <CardContent className="p-4">
                        <div className="flex gap-4 items-start">
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-b from-primary/15 to-primary/10 border flex flex-col items-center justify-center shrink-0">
                            <span className="text-xl font-bold leading-tight">{day}</span>
                            <span className="text-[11px] font-semibold text-muted-foreground">{month}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary shrink-0" />
                              <p className="font-semibold leading-tight">Lotto Results {formatLongDate(entry.date)}</p>
                            </div>
                            <p className="text-sm text-muted-foreground leading-snug">
                              Results for{" "}
                              {gameLinks.map((gl, idx) => (
                                <Link
                                  key={gl.href}
                                  href={gl.href}
                                  className="text-primary hover:underline font-semibold"
                                >
                                  {gl.name}
                                  {idx < gameLinks.length - 1 ? ", " : ""}
                                </Link>
                              ))}{" "}
                              drawn on {formatLongDate(entry.date)}.
                            </p>
                            {!gameLinks.length && primaryHref && (
                              <Link
                                href={primaryHref}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                              >
                                View full results
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
