import { info as logInfo, warn as logWarn, error as logError } from "./logger";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

function getConfig() {
  const apiToken = process.env.CF_API_TOKEN || process.env.CF_API_KEY;
  const zoneId = process.env.CF_ZONE_ID;
  const email = process.env.CF_EMAIL;
  const baseUrl = process.env.CF_BASE_URL || "https://za.pwedeh.com";
  if (!apiToken || !zoneId) return null;
  const useTokenAuth = Boolean(process.env.CF_API_TOKEN);
  if (!useTokenAuth && !email) return null;
  let host: string | null = null;
  try {
    host = new URL(baseUrl).host;
  } catch {
    /* ignore bad host */
  }
  return {
    apiToken,
    zoneId,
    email,
    useTokenAuth,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    host,
  };
}

function buildUrls(paths: string[]): string[] {
  const cfg = getConfig();
  if (!cfg) return [];
  return Array.from(new Set(paths.map(p => `${cfg.baseUrl}${p.startsWith("/") ? "" : "/"}${p}`)));
}

export async function purgeCloudflareSite(paths?: string[]): Promise<void> {
  const cfg = getConfig();
  if (!cfg) {
    logWarn("[Cloudflare] Purge skipped: missing CF config (token/key or zone/email/base URL)");
    return;
  }

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

  const strategy = (process.env.CF_PURGE_STRATEGY || "files").toLowerCase();
  const payload =
    strategy === "everything"
      ? { purge_everything: true }
      : strategy === "hosts" && cfg.host
        ? { hosts: [cfg.host] }
        : { files: targets };

  const attemptPurge = async (label: string, body: any) => {
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
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const logPayload = { label, status: res.status, body, response: text };
    if (!res.ok) {
      logError(`[Cloudflare] ${label} purge failed: ${res.status}`, logPayload);
    } else {
      logInfo(`[Cloudflare] ${label} purge triggered`, logPayload);
    }
    return res.ok;
  };

  try {
    logInfo("[Cloudflare] Purge request prepared", { strategy, targetCount: targets.length, payload });

    const primaryOk = await attemptPurge(strategy === "files" ? "URL" : strategy.toUpperCase(), payload);

    // If file purge fails (common with custom cache keys), attempt host purge as a fallback when allowed
    if (!primaryOk && strategy === "files" && cfg.host) {
      await attemptPurge("Host-fallback", { hosts: [cfg.host] });
    }
  } catch (err) {
    logError("[Cloudflare] URL purge error", err instanceof Error ? err.message : String(err));
  }
}
