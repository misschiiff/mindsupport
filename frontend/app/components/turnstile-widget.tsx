"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";

type TurnstileInstance = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
    theme?: "light" | "dark" | "auto";
  }) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileInstance }
}

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function TurnstileWidget({ onToken, resetKey = 0 }: { onToken: (token: string) => void; resetKey?: number }) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const mountWidget = useCallback(() => {
    if (!siteKey || !container.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      callback: onToken,
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
      theme: "light",
    });
  }, [onToken]);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, [resetKey]);

  if (!siteKey) return null;
  return <div className="turnstile-control"><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={mountWidget}/><div ref={container}/><span>Complete the security check to send this form.</span></div>;
}

export function HoneypotField() {
  return <label className="form-honeypot" aria-hidden="true">Leave this field empty<input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue=""/></label>;
}
