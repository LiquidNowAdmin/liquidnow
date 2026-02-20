"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

const COOKIE_CONSENT_KEY = "cookie_consent";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);

    // Google Tag laden
    if (typeof window !== "undefined" && typeof (window as any).loadGoogleTag === "function") {
      (window as any).loadGoogleTag();
    }

    // Verzögertes Page Load Tracking senden
    if (typeof window !== "undefined" && typeof (window as any).sendPageLoadTracking === "function") {
      (window as any).sendPageLoadTracking();
    }
  };

  const handleAnalyticsOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);

    // Google Tag laden
    if (typeof window !== "undefined" && typeof (window as any).loadGoogleTag === "function") {
      (window as any).loadGoogleTag();
    }

    // Verzögertes Page Load Tracking senden
    if (typeof window !== "undefined" && typeof (window as any).sendPageLoadTracking === "function") {
      (window as any).sendPageLoadTracking();
    }
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setIsVisible(false);
    // Kein Tracking wird geladen
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/5 z-40"
            onClick={handleAccept}
          />

          {/* Banner */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          >
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header mit Trust-Signal */}
              <div className="bg-gradient-to-r from-[#00CED1]/5 to-[#FFD700]/10 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-turquoise rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark">
                      Ihre Daten sind geschützt
                    </h3>
                    <p className="text-xs text-subtle">Datenschutzkonform & sicher</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-subtle text-sm leading-relaxed mb-6">
                  Wir nutzen Cookies, um Ihnen die bestmögliche Finanzierungsberatung zu ermöglichen und unseren Service zu verbessern.{" "}
                  <a
                    href="/datenschutz"
                    className="text-turquoise hover:underline font-medium"
                  >
                    Datenschutzerklärung
                  </a>
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleAccept}
                    className="w-full bg-turquoise hover:bg-[#40E0D0] text-white px-8 py-3 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    Alle akzeptieren
                  </button>
                  <button
                    onClick={handleAnalyticsOnly}
                    className="text-subtle hover:text-dark text-sm py-2 transition-colors"
                  >
                    Auswahl speichern
                  </button>
                </div>
              </div>

              {/* Ablehnen versteckt im Footer */}
              <div className="px-6 py-2 flex justify-end">
                <button
                  onClick={handleDecline}
                  className="text-gray-300 hover:text-gray-400 text-xs transition-colors"
                >
                  Ablehnen
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
