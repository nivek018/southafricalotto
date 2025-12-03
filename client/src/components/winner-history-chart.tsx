import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trophy } from "lucide-react";
import { format, parseISO, subMonths } from "date-fns";
import type { LotteryResult } from "@shared/schema";

interface WinnerHistoryChartProps {
  groupSlug: string;
  variants: string[];
}

type TimeRange = "3m" | "6m" | "1y";

export function WinnerHistoryChart({ groupSlug, variants }: WinnerHistoryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("3m");
  const [selectedVariant, setSelectedVariant] = useState<string>(variants[0]);

  useEffect(() => {
    if (variants.length > 0) {
      setSelectedVariant((prev) => (variants.includes(prev) ? prev : variants[0]));
    }
  }, [variants]);

  const { data: groupedData } = useQuery<{
    allResults: Record<string, LotteryResult[]>;
  }>({
    queryKey: ["/api/results/group", groupSlug],
    enabled: !!groupSlug,
  });

  const chartData = useMemo(() => {
    if (!groupedData?.allResults) return [];

    const now = new Date();
    let cutoffDate: Date;
    switch (timeRange) {
      case "3m":
        cutoffDate = subMonths(now, 3);
        break;
      case "6m":
        cutoffDate = subMonths(now, 6);
        break;
      case "1y":
      default:
        cutoffDate = subMonths(now, 12);
        break;
    }

    const results = groupedData.allResults[selectedVariant] || [];

    const filteredResults = results.filter((r) => {
      const resultDate = parseISO(r.drawDate);
      return resultDate >= cutoffDate;
    });

    const parseWinners = (value: unknown): number => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    return filteredResults
      .map((result) => ({
        date: result.drawDate,
        displayDate: format(parseISO(result.drawDate), "MMM d"),
        winners: parseWinners((result as any)?.winner),
      }))
      .reverse();
  }, [groupedData, timeRange, selectedVariant]);

  if (chartData.length === 0) return null;

  const getVariantDisplayName = (variantSlug: string): string => {
    const nameMap: Record<string, string> = {
      "powerball": "Powerball",
      "powerball-plus": "Powerball Plus",
      "lotto": "Lotto",
      "lotto-plus-1": "Lotto Plus 1",
      "lotto-plus-2": "Lotto Plus 2",
      "daily-lotto": "Daily Lotto",
      "daily-lotto-plus": "Daily Lotto Plus",
    };
    return nameMap[variantSlug] || variantSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  return (
    <Card className="mt-8" data-testid="card-winner-history-chart">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-lottery-ball-bonus" />
            <CardTitle className="text-2xl">Winner Trend</CardTitle>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {variants.length > 1 &&
                variants.map((variant) => (
                  <Button
                    key={variant}
                    variant={selectedVariant === variant ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVariant(variant)}
                    data-testid={`winner-variant-${variant}`}
                  >
                    {getVariantDisplayName(variant)}
                  </Button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant={timeRange === "3m" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("3m")}
                data-testid="winner-range-3m"
              >
                3 Months
              </Button>
              <Button
                variant={timeRange === "6m" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("6m")}
                data-testid="winner-range-6m"
              >
                6 Months
              </Button>
              <Button
                variant={timeRange === "1y" ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange("1y")}
                data-testid="winner-range-1y"
              >
                1 Year
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="winnerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--lottery-ball-bonus))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--lottery-ball-bonus))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                className="fill-muted-foreground"
                width={60}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">{data.date}</p>
                        <p className="text-lg font-bold text-lottery-ball-bonus">
                          {data.winners} winner{data.winners === 1 ? "" : "s"}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="winners"
                stroke="hsl(var(--lottery-ball-bonus))"
                strokeWidth={2}
                fill="url(#winnerGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Number of winners per draw over the selected period.
        </p>
      </CardContent>
    </Card>
  );
}
