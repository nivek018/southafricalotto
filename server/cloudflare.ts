const CF_API_BASE = "https://api.cloudflare.com/client/v4";

function getConfig() {
  const apiKey = process.env.CF_API_KEY;
  const zoneId = process.env.CF_ZONE_ID;
  const email = process.env.CF_EMAIL;
  const baseUrl = process.env.CF_BASE_URL;
  if (!apiKey || !zoneId || !email || !baseUrl) return null;
  return { apiKey, zoneId, email, baseUrl: baseUrl.replace(/\/+$/, "") };
}

function buildUrls(paths: string[]): string[] {
  const cfg = getConfig();
  if (!cfg) return [];
  return Array.from(new Set(paths.map(p => `${cfg.baseUrl}${p.startsWith("/") ? "" : "/"}${p}`)));
}

export async function purgeCloudflareSite(paths?: string[]): Promise<void> {
  const cfg = getConfig();
  if (!cfg) return;

  const targets = paths && paths.length > 0
    ? buildUrls(paths)
    : buildUrls([
        "/",
        "/sitemap.xml",
        "/game/powerball",
        "/game/powerball-plus",
        "/game/lotto",
        "/game/lotto-plus-1",
        "/game/lotto-plus-2",
        "/game/daily-lotto",
        "/game/daily-lotto-plus",
        "/lotto-result/today",
        "/lotto-result/yesterday",
        "/powerball-result/yesterday",
        "/daily-lotto-result/yesterday",
        "/sa-lotto-result/yesterday",
        "/news",
      ]);

  if (targets.length === 0) return;

  try {
    const res = await fetch(`${CF_API_BASE}/zones/${cfg.zoneId}/purge_cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Key": cfg.apiKey,
        "X-Auth-Email": cfg.email,
      },
      body: JSON.stringify({ files: targets }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[Cloudflare] URL purge failed: ${res.status} ${text}`);
    } else {
      console.log("[Cloudflare] URL purge triggered", targets);
    }
  } catch (err) {
    console.error("[Cloudflare] URL purge error:", err);
  }
}
