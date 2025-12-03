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
  const [scrapeUserAgent, setScrapeUserAgent] = useState("desktop");
  const [customUserAgent, setCustomUserAgent] = useState("");
  const [scrapeTargetUrl, setScrapeTargetUrl] = useState("https://www.example.com/");
  const [scrapeLog, setScrapeLog] = useState("");
  const [acceptLanguage, setAcceptLanguage] = useState("en-US,en;q=0.9");
  const [useAmp, setUseAmp] = useState(true);

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
  const [scrapeController, setScrapeController] = useState<AbortController | null>(null);
  const [debugScrapePending, setDebugScrapePending] = useState(false);

  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const controller = new AbortController();
      setScrapeController(controller);
      const res = await apiRequest("POST", "/api/scrape/date-range", {
        startDate: scrapeStart,
        endDate: scrapeEnd,
      }, { signal: controller.signal });
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
      if (error?.name === "AbortError") {
        toast({
          title: "Scraper Stopped",
          description: "The scraping request was cancelled.",
        });
      } else {
        toast({
          title: "Scraping Failed",
          description: error?.message || "Could not fetch lottery results. Please try again.",
          variant: "destructive",
        });
      }
    },
    onSettled: () => {
      setScrapeController(null);
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

  const USER_AGENT_PRESETS: Record<string, string> = {
    google: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    bing: "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    duckduck: "Mozilla/5.0 (compatible; DuckDuckBot/1.0; +http://duckduckgo.com/duckduckbot.html)",
    desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  };

  const resolveUserAgent = () => {
    if (scrapeUserAgent === "custom") {
      return customUserAgent.trim() || USER_AGENT_PRESETS.google;
    }
    return USER_AGENT_PRESETS[scrapeUserAgent] || USER_AGENT_PRESETS.google;
  };

  const handleDebugScrape = async () => {
    if (!scrapeTargetUrl) {
      toast({
        title: "Target URL required",
        description: "Please enter a URL to scrape.",
        variant: "destructive",
      });
      return;
    }
    setDebugScrapePending(true);
    setScrapeLog("Running request...");
    try {
      const res = await apiRequest("POST", "/api/debug/scrape-proxy", {
        url: scrapeTargetUrl,
        userAgent: resolveUserAgent(),
        acceptLanguage,
        useAmp,
      });
      const body = await res.json();
      setScrapeLog(JSON.stringify(body, null, 2));
    } catch (error: any) {
      setScrapeLog(error?.message || "Failed to run debug scrape.");
      toast({
        title: "Debug scrape failed",
        description: error?.message || "Unable to fetch target URL.",
        variant: "destructive",
      });
    } finally {
      setDebugScrapePending(false);
    }
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
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={() => {
                      const confirmRun = window.confirm(`Fetch results from ${scrapeStart} to ${scrapeEnd}?`);
                      if (!confirmRun) return;
                      scrapeMutation.mutate();
                    }}
                    disabled={scrapeMutation.isPending}
                    className="w-full sm:w-auto flex-1"
                    data-testid="button-scrape"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${scrapeMutation.isPending ? "animate-spin" : ""}`} />
                    {scrapeMutation.isPending ? "Scraping..." : "Fetch Results"}
                  </Button>
                  {scrapeMutation.isPending && (
                    <Button
                      variant="destructive"
                      onClick={() => scrapeController?.abort()}
                      className="w-full sm:w-auto"
                      data-testid="button-scrape-stop"
                    >
                      Force Stop
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
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
            <TabsTrigger value="scraping" data-testid="tab-scraping">
              <Download className="h-4 w-4 mr-2" />
              Scraping
            </TabsTrigger>
            <TabsTrigger value="debug" data-testid="tab-debug">
              <Clock className="h-4 w-4 mr-2" />
              Debug
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
                              onBlur={(e) => handleScheduleUpdate(game.slug, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleScheduleUpdate(game.slug, (e.target as HTMLInputElement).value);
                                }
                              }}
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
                  <p className="text-sm text-muted-foreground">
                    The scraper will fetch the latest results from AfricanLottery.net. Use the date range above to control what days you fetch.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="scraping" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Scraping Debugger</CardTitle>
                <CardDescription>Simulate requests with custom user agents and view the raw response.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>User Agent</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["google", "bing", "duckduck", "desktop", "custom"] as const).map((opt) => (
                        <Button
                          key={opt}
                          size="sm"
                          variant={scrapeUserAgent === opt ? "default" : "outline"}
                          onClick={() => setScrapeUserAgent(opt)}
                        >
                          {opt === "google" && "Googlebot"}
                          {opt === "bing" && "Bingbot"}
                          {opt === "duckduck" && "DuckDuckBot"}
                          {opt === "desktop" && "Desktop Chrome"}
                          {opt === "custom" && "Custom"}
                        </Button>
                      ))}
                    </div>
                    <Input
                      placeholder="Enter custom user agent"
                      value={scrapeUserAgent === "custom" ? customUserAgent : resolveUserAgent()}
                      onChange={(e) => {
                        setCustomUserAgent(e.target.value);
                        setScrapeUserAgent("custom");
                      }}
                      disabled={scrapeUserAgent !== "custom"}
                      className="w-full"
                      data-testid="input-custom-ua"
                    />
                    <p className="text-xs text-muted-foreground">
                      Samples: Googlebot, Bingbot, DuckDuckBot, Desktop Chrome. Switch to Custom to edit.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scrape-target">Target URL</Label>
                    <Input
                      id="scrape-target"
                      placeholder="https://example.com/page"
                      value={scrapeTargetUrl}
                      onChange={(e) => setScrapeTargetUrl(e.target.value)}
                      data-testid="input-scrape-target"
                    />
                    <p className="text-xs text-muted-foreground">Full URL to fetch using the selected user agent.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="toggle-amp"
                      type="checkbox"
                      checked={useAmp}
                      onChange={(e) => setUseAmp(e.target.checked)}
                      className="h-4 w-4 rounded border"
                      data-testid="toggle-use-amp"
                    />
                    <Label htmlFor="toggle-amp">Try AMP version (if available)</Label>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    When enabled, the request rewrites to `/amp/...` which often returns a static, scrape-friendly page.
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accept-language">Accept-Language</Label>
                    <Input
                      id="accept-language"
                      placeholder="en-US,en;q=0.9"
                      value={acceptLanguage}
                      onChange={(e) => setAcceptLanguage(e.target.value)}
                      data-testid="input-accept-language"
                    />
                    <p className="text-xs text-muted-foreground">Use your browser's language header for closer parity.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDebugScrape}
                    disabled={debugScrapePending}
                    data-testid="button-run-debug-scrape"
                  >
                    {debugScrapePending ? "Running..." : "Run Debug Scrape"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setScrapeLog("")}
                    data-testid="button-clear-debug-log"
                  >
                    Clear Log
                  </Button>
                </div>
                <div>
                  <Label>Response Log</Label>
                  <pre className="mt-2 h-64 overflow-auto rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-wrap" data-testid="debug-log">
                    {scrapeLog || "Run a debug scrape to see output here."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Debug Tools</CardTitle>
                <CardDescription>Use the Scraping tab to probe URLs with different user agents.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Additional debug utilities can be added here. Current focus: scraping diagnostics in the Scraping tab.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
