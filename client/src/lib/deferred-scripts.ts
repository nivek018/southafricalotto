declare global {
  interface Window {
    dataLayer?: any[];
    adsbygoogle?: any[];
  }
}

const loadScript = (src: string, attrs: Record<string, string> = {}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
};

let initialized = false;

export const initDeferredScripts = () => {
  if (initialized) return;
  initialized = true;

  const loadAll = async () => {
    try {
      // GA
      window.dataLayer = window.dataLayer || [];
      // @ts-ignore
      function gtag() { window.dataLayer?.push(arguments); }
      // @ts-ignore
      window.gtag = gtag;
      await loadScript("https://www.googletagmanager.com/gtag/js?id=G-B8TX7CM02Q");
      // @ts-ignore
      gtag("js", new Date());
      // @ts-ignore
      gtag("config", "G-B8TX7CM02Q");

      // AdSense
      await loadScript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3980043434451295", {
        crossOrigin: "anonymous"
      });
      window.adsbygoogle = window.adsbygoogle || [];
      window.dispatchEvent(new Event("adsbygoogle-loaded"));
    } catch (e) {
      console.warn("Deferred scripts failed to load", e);
    }
  };

  const trigger = () => {
    loadAll();
    ["mousemove", "scroll", "touchstart", "keydown", "pointerdown"].forEach((evt) =>
      window.removeEventListener(evt, trigger)
    );
  };

  ["mousemove", "scroll", "touchstart", "keydown", "pointerdown"].forEach((evt) =>
    window.addEventListener(evt, trigger, { once: true, passive: true })
  );
};
