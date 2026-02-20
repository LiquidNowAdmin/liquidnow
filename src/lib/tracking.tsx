"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

const VISITOR_ID_KEY = "ln_visitor_id";
const COOKIE_CONSENT_KEY = "cookie_consent";

// Single-tenant for now (liqinow)
const TENANT_ID = "c81022c9-48c5-4946-aa3e-deb25af89013";

type TrackingContextValue = {
  trackEvent: (type: string, properties?: Record<string, unknown>) => void;
  sessionId: string | null;
};

const TrackingContext = createContext<TrackingContextValue>({
  trackEvent: () => {},
  sessionId: null,
});

export function useTracking() {
  return useContext(TrackingContext);
}

function getDeviceType(): string {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function getUtmParams(): Record<string, string | null> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
  };
}

function isConsentGiven(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) !== "declined";
}

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const sessionIdRef = useRef<string | null>(null);
  const initRef = useRef(false);
  const supabaseRef = useRef(createClient());
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  // Initialize session
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!isConsentGiven()) return;

    const supabase = supabaseRef.current;

    (async () => {
      const visitorId = getOrCreateVisitorId();
      const utm = getUtmParams();
      const sessionId = crypto.randomUUID();

      const { error } = await supabase
        .from("marketing_sessions")
        .insert({
          id: sessionId,
          tenant_id: TENANT_ID,
          visitor_id: visitorId,
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          referrer: document.referrer || null,
          landing_page: window.location.pathname,
          device_type: getDeviceType(),
        });

      if (!error) {
        sessionIdRef.current = sessionId;

        // Track initial page view
        await supabase.from("marketing_events").insert({
          tenant_id: TENANT_ID,
          session_id: sessionId,
          event_type: "page_view",
          properties: { path: window.location.pathname },
        });
      }
    })();
  }, []);

  // Track page views on navigation
  useEffect(() => {
    if (!sessionIdRef.current) return;
    if (!isConsentGiven()) return;
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return; // Skip — initial page_view already tracked above
    }
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    supabaseRef.current.from("marketing_events").insert({
      tenant_id: TENANT_ID,
      session_id: sessionIdRef.current,
      event_type: "page_view",
      properties: { path: pathname },
    });
  }, [pathname]);

  const trackEvent = useCallback(
    (type: string, properties?: Record<string, unknown>) => {
      if (!sessionIdRef.current) return;
      if (!isConsentGiven()) return;

      supabaseRef.current.from("marketing_events").insert({
        tenant_id: TENANT_ID,
        session_id: sessionIdRef.current,
        event_type: type,
        properties: properties ?? {},
      });
    },
    []
  );

  return (
    <TrackingContext.Provider
      value={{ trackEvent, sessionId: sessionIdRef.current }}
    >
      {children}
    </TrackingContext.Provider>
  );
}
