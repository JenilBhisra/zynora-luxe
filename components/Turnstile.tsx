"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
}

export default function Turnstile({ siteKey, onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeTurnstile = () => {
      if (!window.turnstile || !containerRef.current) return;

      try {
        // Clear container to avoid duplicate widgets during hot reloads or state toggles
        containerRef.current.innerHTML = "";
        
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            onVerify(token);
          },
        });
        
        widgetIdRef.current = id;
      } catch (err) {
        console.error("Failed to render Cloudflare Turnstile:", err);
      }
    };

    // Check if script is already present in document body
    let script = document.querySelector('script[src*="turnstile/v0/api.js"]') as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = initializeTurnstile;
      document.body.appendChild(script);
    } else {
      if (window.turnstile) {
        initializeTurnstile();
      } else {
        script.addEventListener("load", initializeTurnstile);
      }
    }

    return () => {
      // Cleanup widget
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch (e) {}
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [siteKey, onVerify]);

  return <div ref={containerRef} className="turnstile-container my-4 flex justify-center" />;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}
