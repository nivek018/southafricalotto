import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
import type { NewsArticle } from "@shared/schema";

export default function NewsArticlePage() {
  const [, params] = useRoute("/news/:slug");
  const slug = params?.slug || "";

  const { data: article, isLoading } = useQuery<NewsArticle>({
    queryKey: ["/api/news", slug],
    enabled: !!slug,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-6 w-48 mb-8" />
        <Skeleton className="aspect-video w-full rounded-lg mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 text-center">
        <Newspaper className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The article you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/news">
          <Button data-testid="button-back-news">Back to News</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
        <Link href="/news">
          <Button variant="ghost" className="mb-6" data-testid="button-back-news">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to News
          </Button>
        </Link>

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline">{article.category || "General"}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(article.publishDate)}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-4">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-xl text-muted-foreground">
                {article.excerpt}
              </p>
            )}
          </header>

          {article.imageUrl && (
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-8">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Card>
            <CardContent className="py-8">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {article.content.split("\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        </article>

        <div className="mt-12 pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Related Information</h2>
          <Card>
            <CardContent className="py-6">
              <p className="text-muted-foreground">
                For the latest lottery results and updates, visit our{" "}
                <Link href="/" className="text-foreground underline hover:no-underline">
                  homepage
                </Link>
                . Results are updated immediately after each draw.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
