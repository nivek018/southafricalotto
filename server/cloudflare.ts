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
  const extraHosts = (process.env.CF_PURGE_HOSTS || "")
    .split(",")
    .map(h => h.trim())
    .filter(Boolean);

  // If CF_PURGE_HOSTS is provided, use only those; otherwise fall back to the host derived from CF_BASE_URL
  const hosts = extraHosts.length > 0
    ? Array.from(new Set(extraHosts))
    : Array.from(new Set([host].filter(Boolean)));
  return {
    apiToken,
    zoneId,
    email,
    useTokenAuth,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    host,
    hosts,
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

  // Default to host-level purge because Cloudflare full-page caching often uses host cache keys
  const strategy = (process.env.CF_PURGE_STRATEGY || "hosts").toLowerCase();
  const hostList = cfg.hosts && cfg.hosts.length > 0 ? cfg.hosts : (cfg.host ? [cfg.host] : []);
  const payload =
    strategy === "everything"
      ? { purge_everything: true }
      : strategy === "hosts"
        ? { hosts: hostList }
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

    if (strategy === "hosts" && hostList.length === 0) {
      logWarn("[Cloudflare] Host purge requested but no hosts resolved; skipping");
      return;
    }

    const primaryOk = await attemptPurge(strategy === "files" ? "URL" : strategy.toUpperCase(), payload);

    // If file purge fails (common with custom cache keys), attempt host purge as a fallback when allowed
    if (!primaryOk && strategy === "files" && hostList.length > 0) {
      await attemptPurge("Host-fallback", { hosts: hostList });
    }

    // If primary strategy is not hosts and host is available, optionally also purge host to cover custom cache keys
    if (strategy !== "hosts" && hostList.length > 0) {
      await attemptPurge("Host-secondary", { hosts: hostList });
    }
  } catch (err) {
    logError("[Cloudflare] URL purge error", err instanceof Error ? err.message : String(err));
  }
}
