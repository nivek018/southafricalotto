import { info as logInfo, warn as logWarn, error as logError } from "./logger";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

function getConfig() {
  const apiToken = process.env.CF_API_TOKEN || process.env.CF_API_KEY;
  const zoneId = process.env.CF_ZONE_ID;
  const baseUrl = process.env.CF_BASE_URL || "https://za.pwedeh.com";
  if (!apiToken || !zoneId) return null;

  const hosts = Array.from(
    new Set(
      (process.env.CF_PURGE_HOSTS || "")
        .split(",")
        .map(h => h.trim())
        .filter(Boolean)
    )
  );

  return {
    apiToken,
    zoneId,
    baseUrl: baseUrl.replace(/\/+$/, ""),
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
  const hostList = cfg.hosts && cfg.hosts.length > 0 ? cfg.hosts : [];
  const payload =
    strategy === "everything"
      ? { purge_everything: true }
      : strategy === "hosts"
        ? { hosts: hostList }
        : { files: targets };

  const attemptPurge = async (label: string, body: any) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cfg.apiToken}`,
    };

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

    await attemptPurge(strategy === "hosts" ? "HOSTS" : strategy.toUpperCase(), payload);
  } catch (err) {
    logError("[Cloudflare] URL purge error", err instanceof Error ? err.message : String(err));
  }
}
