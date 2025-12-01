import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";
import { subMonths, parseISO, format } from "date-fns";
import type { LotteryResult } from "@shared/schema";

interface PrizeHistoryChartProps {
  groupSlug: string;
  variants: string[];
}

type TimeRange = "3m" | "6m" | "1y";

export function PrizeHistoryChart({ groupSlug, variants }: PrizeHistoryChartProps) {
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

    const filteredResults = results.filter(r => {
      const resultDate = parseISO(r.drawDate);
      return resultDate >= cutoffDate;
    });

    const parsePrize = (amount: string | null | undefined): number => {
      if (!amount) return 0;
      const cleaned = amount.replace(/[R,\s]/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const data = filteredResults
      .map(result => ({
        date: result.drawDate,
        displayDate: format(parseISO(result.drawDate), "MMM d"),
        jackpot: parsePrize(result.jackpotAmount),
        formattedJackpot: result.jackpotAmount || "N/A"
      }))
      .reverse();

    return data;
  }, [groupedData, variants, timeRange, selectedVariant]);

  const formatYAxis = (value: number): string => {
    if (value >= 1000000) {
      return `R${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R${(value / 1000).toFixed(0)}K`;
    }
    return `R${value}`;
  };

  if (chartData.length === 0) {
    return null;
  }

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

  return (
    <Card className="mt-8" data-testid="card-prize-history-chart">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-lottery-ball-main" />
            <CardTitle className="text-lg">Prize History</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={timeRange === "3m" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("3m")}
              data-testid="button-range-3m"
            >
              3 Months
            </Button>
            <Button
              variant={timeRange === "6m" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("6m")}
              data-testid="button-range-6m"
            >
              6 Months
            </Button>
            <Button
              variant={timeRange === "1y" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange("1y")}
              data-testid="button-range-1y"
            >
              1 Year
            </Button>
          </div>
          {variants.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              {variants.map((variant) => (
                <Button
                  key={variant}
                  variant={selectedVariant === variant ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedVariant(variant)}
                  data-testid={`button-variant-${variant}`}
                >
                  {getVariantDisplayName(variant)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="jackpotGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                width={70}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3">
                        <p className="text-sm font-medium">{data.date}</p>
                        <p className="text-lg font-bold text-lottery-ball-main">
                          {data.formattedJackpot}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="jackpot"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#jackpotGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-4">
          Jackpot amounts over the selected time period. Data based on recorded draw results.
        </p>
      </CardContent>
    </Card>
  );
}
