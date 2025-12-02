import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  CircleDot,
  LogOut,
  Newspaper,
  RefreshCw,
  Database,
  Download,
  Settings,
  Clock,
  CalendarRange
} from "lucide-react";
import type { LotteryResult, NewsArticle, LotteryGame, ScraperSetting } from "@shared/schema";
import AdminResults from "@/pages/admin-results";
import AdminNews from "@/pages/admin-news";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("results");
  const [globalScheduleTime, setGlobalScheduleTime] = useState("21:30");

  useEffect(() => {
    const isAuth = localStorage.getItem("adminAuth");
    if (!isAuth) {
      setLocation("/encode");
    }
  }, [setLocation]);

  const { data: results } = useQuery<LotteryResult[]>({
    queryKey: ["/api/results"],
  });

  const { data: news } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news"],
  });

  const { data: games } = useQuery<LotteryGame[]>({
    queryKey: ["/api/games"],
  });

  const { data: scraperSettings } = useQuery<ScraperSetting[]>({
    queryKey: ["/api/scraper-settings"],
  });

  const [scrapeStart, setScrapeStart] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(new Date()));
  const [scrapeEnd, setScrapeEnd] = useState(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(new Date()));

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/scrape/date-range", {
        startDate: scrapeStart,
        endDate: scrapeEnd,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/results/latest"] });

      if (data?.results && data.results.length > 0) {
        const resultsList = data.results.map((r: any) =>
          `${r.game}: ${r.numbers}${r.bonus ? ` + ${r.bonus}` : ''}`
        ).join('\n');

        toast({
          title: `Scraped ${data.scraped} Results (${data.added} New)`,
          description: resultsList.substring(0, 200) + (resultsList.length > 200 ? '...' : ''),
        });
      } else {
        toast({
          title: "Scraping Complete",
          description: data?.message || "Latest lottery results have been fetched.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Scraping Failed",
        description: error?.message || "Could not fetch lottery results. Please try again.",
        variant: "destructive",
      });
    },
  });

  const settingsMutation = useMutation({
    mutationFn: async (setting: { gameSlug: string; isEnabled: boolean; scheduleTime?: string }) => {
      const res = await apiRequest("POST", "/api/scraper-settings", setting);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scraper-settings"] });
      toast({
        title: "Settings Saved",
        description: "Scraper settings have been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Save",
        description: "Could not save scraper settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const drawDaysMutation = useMutation({
    mutationFn: async (payload: { gameSlug: string; drawDays: string[] }) => {
      const res = await apiRequest("PATCH", `/api/games/${payload.gameSlug}/draw-days`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      toast({
        title: "Draw Days Updated",
        description: "The draw days have been saved for this game.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to Save",
        description: "Could not save draw days. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setLocation("/encode");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const getSettingForGame = (gameSlug: string): ScraperSetting | undefined => {
    return scraperSettings?.find(s => s.gameSlug === gameSlug);
  };

  const handleToggle = (gameSlug: string, currentlyEnabled: boolean) => {
    const setting = getSettingForGame(gameSlug);
    settingsMutation.mutate({
      gameSlug,
      isEnabled: !currentlyEnabled,
      scheduleTime: setting?.scheduleTime || globalScheduleTime,
    });
  };

  const handleScheduleUpdate = (gameSlug: string, time: string) => {
    const setting = getSettingForGame(gameSlug);
    settingsMutation.mutate({
      gameSlug,
      isEnabled: setting?.isEnabled ?? true,
      scheduleTime: time,
    });
  };

  const handleDrawDaysUpdate = (gameSlug: string, drawDays: string[]) => {
    drawDaysMutation.mutate({ gameSlug, drawDays });
  };

  const applyGlobalSchedule = () => {
    games?.forEach((game) => {
      const setting = getSettingForGame(game.slug);
      settingsMutation.mutate({
        gameSlug: game.slug,
        isEnabled: setting?.isEnabled ?? true,
        scheduleTime: globalScheduleTime,
      });
    });
    toast({
      title: "Global Schedule Applied",
      description: `All games updated to run at ${globalScheduleTime}`,
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
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={scrapeStart}
                    onChange={(e) => setScrapeStart(e.target.value)}
                    className="flex-1"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={scrapeEnd}
                    onChange={(e) => setScrapeEnd(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <Button
                  onClick={() => scrapeMutation.mutate()}
                  disabled={scrapeMutation.isPending}
                  className="w-full"
                  data-testid="button-scrape"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${scrapeMutation.isPending ? "animate-spin" : ""}`} />
                  {scrapeMutation.isPending ? "Scraping..." : "Fetch Results"}
                </Button>
              </div>
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
              <Settings className="h-4 w-4 mr-2" />
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
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Global Schedule Time
                  </CardTitle>
                  <CardDescription>
                    Set the default time for the scraper to run (draws happen at 21:00)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Input
                      type="time"
                      value={globalScheduleTime}
                      onChange={(e) => setGlobalScheduleTime(e.target.value)}
                      className="w-32"
                      data-testid="input-global-schedule"
                    />
                    <Button
                      variant="outline"
                      onClick={applyGlobalSchedule}
                      disabled={settingsMutation.isPending}
                      data-testid="button-apply-global-schedule"
                    >
                      Apply to All Games
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Recommended: 21:30 (30 minutes after draw)
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Game Scraper Controls</CardTitle>
                  <CardDescription>
                    Enable or disable automatic scraping for each lottery game
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {games?.map((game) => {
                      const setting = getSettingForGame(game.slug);
                      const isEnabled = setting?.isEnabled ?? true;
                      const scheduleTime = setting?.scheduleTime || globalScheduleTime;

                      return (
                    <div key={game.slug} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <Switch
                          id={`scraper-${game.slug}`}
                          checked={isEnabled}
                              onCheckedChange={() => handleToggle(game.slug, isEnabled)}
                              disabled={settingsMutation.isPending}
                              data-testid={`switch-scraper-${game.slug}`}
                            />
                            <div>
                              <Label htmlFor={`scraper-${game.slug}`} className="font-medium cursor-pointer">
                                {game.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Draw days: {(Array.isArray(game.drawDays) ? game.drawDays : JSON.parse(game.drawDays as unknown as string || "[]")).join(", ") || "N/A"}
                              </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end min-w-[260px]">
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => handleScheduleUpdate(game.slug, e.target.value)}
                              className="w-28 text-sm"
                              disabled={!isEnabled || settingsMutation.isPending}
                              data-testid={`input-schedule-${game.slug}`}
                            />
                            <span className={`text-xs px-2 py-1 rounded ${isEnabled ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}>
                              {isEnabled ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <CalendarRange className="h-4 w-4 text-muted-foreground" />
                            {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((day) => {
                              const selectedDays = Array.isArray(game.drawDays) ? game.drawDays : (() => { try { return JSON.parse(game.drawDays as unknown as string || "[]"); } catch { return []; } })();
                              const checked = selectedDays.includes(day);
                              return (
                                <label key={`${game.slug}-${day}`} className="inline-flex items-center gap-1 px-2 py-1 rounded border text-muted-foreground hover:bg-muted cursor-pointer">
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={(val) => {
                                      const current = selectedDays;
                                      const next = val
                                        ? Array.from(new Set([...current, day]))
                                        : current.filter(d => d !== day);
                                      handleDrawDaysUpdate(game.slug, next);
                                    }}
                                    disabled={!isEnabled || drawDaysMutation.isPending}
                                  />
                                  <span className="text-[11px]">{day.slice(0,3)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Scraping</CardTitle>
                  <CardDescription>
                    Manually trigger the web scraper to fetch the latest results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => scrapeMutation.mutate()}
                    disabled={scrapeMutation.isPending}
                    className="w-full md:w-auto"
                    data-testid="button-manual-scrape"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${scrapeMutation.isPending ? "animate-spin" : ""}`} />
                    {scrapeMutation.isPending ? "Scraping..." : "Run Scraper Now"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    The scraper will fetch the latest results from the National Lottery website.
                    Results are sorted from lowest to highest (excluding bonus balls).
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
