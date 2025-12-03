const CF_API_BASE = "https://api.cloudflare.com/client/v4";

function getConfig() {
  const apiToken = process.env.CF_API_TOKEN || process.env.CF_API_KEY;
  const zoneId = process.env.CF_ZONE_ID;
  const email = process.env.CF_EMAIL;
  const baseUrl = process.env.CF_BASE_URL || "https://za.pwedeh.com";
  if (!apiToken || !zoneId) return null;
  const useTokenAuth = Boolean(process.env.CF_API_TOKEN);
  if (!useTokenAuth && !email) return null;
  return {
    apiToken,
    zoneId,
    email,
    useTokenAuth,
    baseUrl: baseUrl.replace(/\/+$/, "")
  };
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
      "/game/lotto",
      "/game/daily-lotto",
      "/lotto-result/today",
      "/lotto-result/yesterday",
      "/powerball-result/yesterday",
      "/daily-lotto-result/yesterday",
      "/sa-lotto-result/yesterday",
      "/news",
    ]);

  if (targets.length === 0) return;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (cfg.useTokenAuth) {
      headers["Authorization"] = `Bearer ${cfg.apiToken}`;
    } else {
      headers["X-Auth-Key"] = cfg.apiToken;
      if (cfg.email) headers["X-Auth-Email"] = cfg.email;
    }

    const res = await fetch(`${CF_API_BASE}/zones/${cfg.zoneId}/purge_cache`, {
      method: "POST",
      headers,
      body: JSON.stringify({ files: targets }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`[Cloudflare] URL purge failed: ${res.status} ${body}`);
    } else {
      console.log("[Cloudflare] URL purge triggered", targets, body || "");
    }
  } catch (err) {
    console.error("[Cloudflare] URL purge error:", err);
  }
}
