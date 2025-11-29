import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  CircleDot, 
  LogOut, 
  Newspaper, 
  RefreshCw, 
  Plus,
  Database,
  Download
} from "lucide-react";
import type { LotteryResult, NewsArticle } from "@shared/schema";
import AdminResults from "@/pages/admin-results";
import AdminNews from "@/pages/admin-news";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("results");

  useEffect(() => {
    const isAuth = localStorage.getItem("adminAuth");
    if (!isAuth) {
      setLocation("/admin");
    }
  }, [setLocation]);

  const { data: results } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results"],
  });

  const { data: news } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news"],
  });

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/scrape");
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results/latest"] });
      toast({
        title: "Scraping Complete",
        description: data?.message || "Latest lottery results have been fetched.",
      });
    },
    onError: () => {
      toast({
        title: "Scraping Failed",
        description: "Could not fetch lottery results. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setLocation("/admin");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <div className="flex items-center gap-1 cursor-pointer">
                  <CircleDot className="h-6 w-6 text-lottery-ball-main" />
                  <CircleDot className="h-5 w-5 text-lottery-ball-bonus -ml-2" />
                </div>
              </Link>
              <div>
                <h1 className="font-semibold">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Manage lottery results and news</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-view-site">
                  View Site
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-lottery-ball-main" />
                Total Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{results?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Lottery results stored</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-lottery-ball-bonus" />
                News Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{news?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Articles published</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                Web Scraper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => scrapeMutation.mutate()}
                disabled={scrapeMutation.isPending}
                className="w-full"
                data-testid="button-scrape"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${scrapeMutation.isPending ? "animate-spin" : ""}`} />
                {scrapeMutation.isPending ? "Scraping..." : "Fetch Latest Results"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="results" data-testid="tab-results">
              <CircleDot className="h-4 w-4 mr-2" />
              Lottery Results
            </TabsTrigger>
            <TabsTrigger value="news" data-testid="tab-news">
              <Newspaper className="h-4 w-4 mr-2" />
              News Articles
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-6">
            <AdminResults />
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            <AdminNews />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Scraper Settings</CardTitle>
                  <CardDescription>
                    Configure automated web scraping for lottery results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Scraper settings management coming soon. You can manually trigger scraping using the "Fetch Latest Results" button above.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
