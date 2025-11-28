import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import type { NewsArticle } from "@shared/schema";

interface NewsCardProps {
  article: NewsArticle;
}

export function NewsCard({ article }: NewsCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Link href={`/news/${article.slug}`}>
      <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-news-${article.slug}`}>
        {article.imageUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {article.category || "General"}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(article.publishDate)}
            </span>
          </div>
          <h3 className="font-semibold text-lg line-clamp-2 leading-tight">
            {article.title}
          </h3>
        </CardHeader>
        <CardContent>
          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {article.excerpt}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
