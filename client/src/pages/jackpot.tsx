import { useEffect, useRef, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { LOTTERY_GROUPS } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { lazy, Suspense } from "react";
const PrizeHistoryChart = lazy(async () => {
  const mod = await import("@/components/prize-history-chart");
  return { default: mod.PrizeHistoryChart };
});
import { Calendar, Trophy, CircleDot } from "lucide-react";
import type { LotteryResult } from "@shared/schema";
import { AdSlot } from "@/components/ad-slot";

type GroupedResultsResponse = {
  group: {
    slug: string;
    name: string;
    description: string;
    variants: string[];
  };
  latestResults: Record<string, LotteryResult>;
  allResults: Record<string, LotteryResult[]>;
};

const GROUP_SLUGS = ["powerball", "lotto", "daily-lotto"];

const formatDrawDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-ZA", {
    weekday: "short",
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

export default function JackpotPage() {
  const queries = useQueries({
    queries: GROUP_SLUGS.map((slug) => ({
      queryKey: ["/api/results/group", slug],
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const chartRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [chartVisible, setChartVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = "Lotto, Daily Lotto, & Powerball Jackpot Prize and History | SA Lotto Results";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Browse current South Africa Powerball, Lotto, and Daily Lotto jackpots plus recent prize history."
      );
    }
  }, []);

  useEffect(() => {
    setChartVisible({
      "powerball": true,
      "lotto": true,
      "daily-lotto": true,
    });
  }, []);

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-card to-background py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <CircleDot className="h-8 w-8 text-lottery-ball-main" />
            <CircleDot className="h-6 w-6 text-lottery-ball-bonus -ml-2" />
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-2">Lotto Jackpot Prize</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See the Latest Jackpot Prize History for Powerball, Lotto, and Daily Lotto and Stay Updated on the Most Recent Winning Amounts.
          </p>
          <div className="max-w-5xl mx-auto w-full mt-4">
            <AdSlot slot="5683668562" className="hidden md:block" />
            <AdSlot slot="3057505225" className="block md:hidden" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14 space-y-10">
        {isLoading && (
          <Card className="bg-card/60">
            <CardContent className="p-6 text-center text-muted-foreground">
              Loading jackpots...
            </CardContent>
          </Card>
        )}

        {queries.map((query, idx) => {
          const data = query.data as GroupedResultsResponse | undefined;
          const groupSlug = GROUP_SLUGS[idx];
          const group = LOTTERY_GROUPS[groupSlug];

          if (!data || !group) {
            return (
              <Card key={groupSlug} className="bg-card/60">
                <CardContent className="p-6 text-center text-muted-foreground">
                  Loading {group?.name || groupSlug} jackpots...
                </CardContent>
              </Card>
            );
          }

          const mainVariant = data.group.variants[0];
          const mainResult = data.latestResults[mainVariant];
          const drawDate = mainResult?.drawDate ? formatDrawDate(mainResult.drawDate) : "No draws recorded";

          return (
            <div key={groupSlug} className="space-y-6">
              <Card className="bg-card/70">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CircleDot className="h-5 w-5 text-lottery-ball-main" />
                      <CardTitle className="text-xl">{group.name}</CardTitle>
                    </div>
                    {mainResult?.drawDate && (
                      <Badge variant="outline" className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {drawDate}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{group.description}</p>
                </CardHeader>
                <CardContent>
                  <div
                    className="grid gap-3"
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
                  >
                    {data.group.variants.map((variant) => {
                      const variantResult = data.latestResults[variant];
                      const amount = variantResult?.jackpotAmount || "Unavailable";
                      const variantName = getVariantDisplayName(variant);

                      return (
                        <div
                          key={variant}
                          className="rounded-lg border bg-muted/40 px-4 py-3 flex flex-col gap-1"
                        >
                          <div className="text-sm font-semibold text-foreground leading-tight">
                            {variantName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-lottery-ball-bonus" />
                            <span className="text-lg font-bold text-lottery-ball-bonus break-words">
                              {amount}
                            </span>
                          </div>
                          {variantResult?.drawDate && (
                            <span className="text-xs text-muted-foreground">
                              Draw: {formatDrawDate(variantResult.drawDate)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div ref={(el) => (chartRefs.current[idx] = el)} data-group={groupSlug} className="mt-4" />
              {chartVisible[groupSlug] && (
                <Suspense fallback={<div className="text-center text-muted-foreground py-4">Loading chart...</div>}>
                  <PrizeHistoryChart groupSlug={groupSlug} variants={data.group.variants} />
                </Suspense>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
