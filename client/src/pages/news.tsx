import { useQuery } from "@tanstack/react-query";
import { NewsCard } from "@/components/news-card";
import { NewsCardSkeleton } from "@/components/loading-skeleton";
import { Newspaper } from "lucide-react";
import type { NewsArticle } from "@shared/schema";

export default function NewsPage() {
  const { data: articles, isLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news"],
  });

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-b from-card to-background py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">
            Lottery News
          </h1>
          <p className="text-muted-foreground text-lg lg:text-xl max-w-2xl mx-auto">
            Stay updated with the latest South African lottery news, 
            jackpot announcements, and winner stories.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <NewsCardSkeleton key={i} />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-lg">
              <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No News Articles</h2>
              <p className="text-muted-foreground">
                News articles will appear here when published.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
