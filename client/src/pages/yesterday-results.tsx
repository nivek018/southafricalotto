import { useQuery } from "@tanstack/react-query";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { LotteryResult } from "@shared/schema";

function getYesterdayDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

export default function YesterdayResultsPage() {
  const { data: results, isLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results"],
  });

  const yesterdayDate = getYesterdayDate();
  const yesterdayResults = results?.filter(
    (r) => r.drawDate === yesterdayDate
  ) || [];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Yesterday's Results</h1>
          <p className="text-muted-foreground">
            All lottery draws from {new Date(yesterdayDate).toLocaleDateString('en-ZA')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : yesterdayResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yesterdayResults.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No Results Yesterday</h3>
            <p className="text-muted-foreground">
              No lottery draws were held on this date.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
