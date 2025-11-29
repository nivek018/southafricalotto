import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Link } from "wouter";
import { LotteryResultCard } from "@/components/lottery-result-card";
import { ResultCardSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import type { LotteryResult, LotteryGame } from "@shared/schema";

export default function DrawHistoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: game, isLoading: gameLoading } = useQuery<LotteryGame>({
    queryKey: [`/api/games/${slug}`],
  });

  const { data: results, isLoading: resultsLoading } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results/game", slug],
  });

  const isLoading = gameLoading || resultsLoading;

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
          {game && (
            <>
              <h1 className="text-4xl font-bold mb-2">{game.name} - Draw History</h1>
              <p className="text-muted-foreground">
                Complete history of {game.name} results
              </p>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        ) : results && results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <LotteryResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg">
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">
              No draw history available for this game yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
