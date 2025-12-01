import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LotteryBall } from "@/components/lottery-ball";
import { Calendar, ArrowRight, Trophy } from "lucide-react";
import type { LotteryResult } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface LotteryResultCardProps {
  result: LotteryResult;
}

export function LotteryResultCard({ result }: LotteryResultCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const sortedNumbers = (() => {
    if (!result.winningNumbers) return [];
    let nums: number[] = [];
    if (Array.isArray(result.winningNumbers)) {
      nums = result.winningNumbers;
    } else if (typeof result.winningNumbers === "string") {
      try {
        nums = JSON.parse(result.winningNumbers);
      } catch {
        return [];
      }
    }
    return [...nums].sort((a, b) => a - b);
  })();

  return (
    <Card className="hover-elevate" data-testid={`card-result-${result.gameSlug}`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-lottery-ball-main/10 to-lottery-ball-bonus/10">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-xl lg:text-2xl font-semibold">
            {result.gameName}
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(result.drawDate)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 text-center pt-4">
        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 mt-3 mb-1">
          {sortedNumbers.map((num, idx) => (
            <LotteryBall key={idx} number={num} size="md" />
          ))}
          {result.bonusNumber && (
            <>
              <span className="text-lg md:text-xl font-bold text-muted-foreground mx-1.5">+</span>
              <LotteryBall number={result.bonusNumber} isBonus size="md" />
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-3 mt-2">
          {result.jackpotAmount && (
            <div className="inline-flex items-center gap-2 rounded-md bg-muted/50 px-4 py-2 text-sm font-semibold mt-1">
              <Trophy className="w-4 h-4 text-lottery-ball-bonus" />
              <span className="text-muted-foreground">Jackpot:</span>
              <span className="text-foreground">{result.jackpotAmount}</span>
            </div>
          )}

          <Link href={`/game/${result.gameSlug}`}>
            <Button
              variant="ghost"
              className="group px-4 py-2"
              data-testid={`button-view-${result.gameSlug}`}
            >
              <span className="inline-flex items-center gap-2">
                View Draw Summary
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
