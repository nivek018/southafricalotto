import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSlotProps {
  slot: string;
  className?: string;
  format?: string;
}

const AD_CLIENT = "ca-pub-3980043434451295";

export function AdSlot({ slot, className = "", format = "auto" }: AdSlotProps) {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tryPush = () => {
      try {
        if (window.adsbygoogle && adRef.current) {
          (window.adsbygoogle as unknown[]).push({});
        }
      } catch {
        // ignore ad load errors
      }
    };

    try {
      tryPush();
      const handler = () => tryPush();
      window.addEventListener("adsbygoogle-loaded", handler);
      return () => {
        window.removeEventListener("adsbygoogle-loaded", handler);
      };
    } catch {
      // ignore ad load errors
    }
  }, []);

  return (
    <div className={`${className} min-h-[280px] w-full`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: "280px", height: "280px", width: "100%" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
        ref={adRef as any}
      />
    </div>
  );
}
