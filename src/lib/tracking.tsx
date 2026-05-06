"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

const VISITOR_ID_KEY = "ln_visitor_id";
const COOKIE_CONSENT_KEY = "cookie_consent";
const SESSION_ID_KEY = "mkt_session_id";
const TENANT_ID_KEY = "mkt_tenant_id";
const GCLID_KEY = "ln_gclid";

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

/** GCLID ist Googles Click-Identifier. Wir persistieren ihn beim ersten Hit
 * aus der URL nach localStorage; spätere Conversions können darüber dem
 * ursprünglichen Klick zugeordnet werden (auch nach Page-Reloads). */
function getOrCaptureGclid(): string | null {
  if (typeof window === "undefined") return null;
  const fromUrl = new URLSearchParams(window.location.search).get("gclid");
  if (fromUrl) {
    try { localStorage.setItem(GCLID_KEY, fromUrl); } catch { /* ignore */ }
    return fromUrl;
  }
  try { return localStorage.getItem(GCLID_KEY); } catch { return null; }
}

function isConsentGiven(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) !== "declined";
}

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16); });
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const sessionIdRef = useRef<string | null>(null);
  const tenantIdRef = useRef<string | null>(null);
  const initRef = useRef(false);
  const supabaseRef = useRef(createClient());
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  // Initialize session via Edge Function
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!isConsentGiven()) return;

    (async () => {
      const visitorId = getOrCreateVisitorId();
      const utm = getUtmParams();
      const gclid = getOrCaptureGclid();

      const { data, error } = await supabaseRef.current.functions.invoke("marketing-track", {
        body: {
          action: "session",
          visitor_id: visitorId,
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          gclid,
          referrer: document.referrer || null,
          landing_page: window.location.pathname,
          device_type: getDeviceType(),
        },
      });

      if (!error && data?.data?.session_id) {
        sessionIdRef.current = data.data.session_id;
        tenantIdRef.current = data.data.tenant_id;
        localStorage.setItem(SESSION_ID_KEY, data.data.session_id);
        localStorage.setItem(TENANT_ID_KEY, data.data.tenant_id);
      }
    })();
  }, []);

  // Track page views on navigation via Edge Function
  useEffect(() => {
    if (!sessionIdRef.current) return;
    if (!isConsentGiven()) return;
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname;
      return; // Skip — initial page_view already tracked by session creation
    }
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    supabaseRef.current.functions.invoke("marketing-track", {
      body: {
        action: "event",
        session_id: sessionIdRef.current,
        tenant_id: tenantIdRef.current,
        event_type: "page_view",
        properties: { path: pathname },
      },
    });
  }, [pathname]);

  const trackEvent = useCallback(
    (type: string, properties?: Record<string, unknown>) => {
      if (!sessionIdRef.current) return;
      if (!isConsentGiven()) return;

      supabaseRef.current.functions.invoke("marketing-track", {
        body: {
          action: "event",
          session_id: sessionIdRef.current,
          tenant_id: tenantIdRef.current,
          event_type: type,
          properties: properties ?? {},
        },
      }).then(({ error, data }) => {
        // Session expired — clear so next page load creates a fresh one
        if (error || data?.error === "session_expired") {
          localStorage.removeItem(SESSION_ID_KEY);
          localStorage.removeItem(TENANT_ID_KEY);
        }
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
