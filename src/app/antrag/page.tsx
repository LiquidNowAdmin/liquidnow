"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, Building2, MapPin, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

interface CompanyData {
  name?: string;
  ustId?: string;
  hrb?: string;
  address?: {
    street?: string;
    zip?: string;
    city?: string;
    country?: string;
  };
  website?: string;
}

export default function AntragPage() {
  const router = useRouter();
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  const handleSearch = async () => {
    if (!website.trim()) {
      setError("Bitte geben Sie eine Website-URL ein");
      return;
    }

    setLoading(true);
    setError("");
    setCompanyData(null);

    try {
      const response = await fetch("/api/company-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ website: website.trim() }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setCompanyData(result.data);
      } else {
        setError(result.error || "Keine Firmendaten gefunden");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (companyData) {
      // TODO: Save data to state management/context
      console.log("Company data confirmed:", companyData);
      router.push("/antrag/zweck");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F5DEB3]/10 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/antrag/rechtsform" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </Link>
            <div className="logo text-xl">
              <span className="logo-turquoise">Liquid</span>
              <span className="logo-gold">Now</span>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative py-12 flex-1">
        {/* Wave Background */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none z-0 opacity-70">
          <div className="hero-wave">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2880 320" preserveAspectRatio="none" className="w-full h-full">
              <path
                fill="#00CED1"
                fillOpacity="0.15"
                d="M0,200C240,150,480,150,720,200C960,250,1200,250,1440,200C1680,150,1920,150,2160,200C2400,250,2640,250,2880,200L2880,320L0,320Z"
              />
            </svg>
          </div>
        </div>

        {/* Content on top */}
        <div className="relative z-10 container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          {/* Progress Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
              1
            </div>
            <div className="h-1 w-12 bg-gray-200 rounded" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-subtle">
              2
            </div>
            <div className="h-1 w-12 bg-gray-200 rounded" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-subtle">
              3
            </div>
            <div className="h-1 w-12 bg-gray-200 rounded" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-subtle">
              4
            </div>
            <div className="h-1 w-12 bg-gray-200 rounded" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-subtle">
              5
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark mb-3">
              Firmendaten automatisch abrufen
            </h1>
            <p className="text-lg text-subtle">
              Geben Sie Ihre Firmen-Website ein – wir füllen alle Daten automatisch aus
            </p>
          </div>

          {/* Search Card */}
          {!companyData && (
            <div className="card p-8 mb-6">
              <div className="space-y-6">
                {/* Input */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">
                    Firmen-Website
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !loading && handleSearch()}
                      placeholder="z.B. example.com oder https://example.com"
                      className="w-full px-4 py-3 pl-12 text-base border-2 border-gray-200 rounded-lg outline-none transition-colors focus:border-turquoise"
                      disabled={loading}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-subtle" />
                  </div>
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={loading || !website.trim()}
                  className="btn-cta-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Firmendaten werden abgerufen...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Firmendaten abrufen
                    </>
                  )}
                </button>

                {/* Secondary: Manual Entry */}
                <div className="text-center">
                  <Link
                    href="/antrag/manuell"
                    className="btn-secondary"
                  >
                    Manuell eintragen
                  </Link>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {companyData && (
            <div className="card p-8">
              <div className="mb-6 flex items-center gap-3 pb-6 border-b border-gray-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-turquoise/10">
                  <Building2 className="h-6 w-6 text-turquoise" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-dark">Gefundene Firmendaten</h2>
                  <p className="text-sm text-subtle">Klicken Sie auf ein Feld zum Bearbeiten</p>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                {/* Firmenname */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2 block">
                    Firmenname
                  </label>
                  <input
                    type="text"
                    value={companyData.name || ""}
                    onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                    className="w-full px-3 py-2 text-base font-semibold text-dark border border-gray-200 rounded-lg outline-none transition-colors hover:border-gray-300 focus:border-turquoise"
                    placeholder="Firmenname"
                  />
                </div>

                {/* Adresse */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-subtle mt-3 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2 block">
                        Straße & Hausnummer
                      </label>
                      <input
                        type="text"
                        value={companyData.address?.street || ""}
                        onChange={(e) => setCompanyData({
                          ...companyData,
                          address: { ...companyData.address, street: e.target.value }
                        })}
                        className="w-full px-3 py-2 text-base text-dark border border-gray-200 rounded-lg outline-none transition-colors hover:border-gray-300 focus:border-turquoise"
                        placeholder="z.B. Musterstraße 123"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2 block">
                          PLZ
                        </label>
                        <input
                          type="text"
                          value={companyData.address?.zip || ""}
                          onChange={(e) => setCompanyData({
                            ...companyData,
                            address: { ...companyData.address, zip: e.target.value }
                          })}
                          className="w-full px-3 py-2 text-base text-dark border border-gray-200 rounded-lg outline-none transition-colors hover:border-gray-300 focus:border-turquoise"
                          placeholder="12345"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2 block">
                          Stadt
                        </label>
                        <input
                          type="text"
                          value={companyData.address?.city || ""}
                          onChange={(e) => setCompanyData({
                            ...companyData,
                            address: { ...companyData.address, city: e.target.value }
                          })}
                          className="w-full px-3 py-2 text-base text-dark border border-gray-200 rounded-lg outline-none transition-colors hover:border-gray-300 focus:border-turquoise"
                          placeholder="Berlin"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* USt-ID */}
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-subtle mt-3 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2 block">
                      USt-ID (optional)
                    </label>
                    <input
                      type="text"
                      value={companyData.ustId || ""}
                      onChange={(e) => setCompanyData({ ...companyData, ustId: e.target.value })}
                      className="w-full px-3 py-2 text-base font-mono text-dark border border-gray-200 rounded-lg outline-none transition-colors hover:border-gray-300 focus:border-turquoise"
                      placeholder="z.B. DE123456789"
                    />
                  </div>
                </div>

                {/* HRB */}
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-subtle mt-3 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2 block">
                      Handelsregister (optional)
                    </label>
                    <input
                      type="text"
                      value={companyData.hrb || ""}
                      onChange={(e) => setCompanyData({ ...companyData, hrb: e.target.value })}
                      className="w-full px-3 py-2 text-base font-mono text-dark border border-gray-200 rounded-lg outline-none transition-colors hover:border-gray-300 focus:border-turquoise"
                      placeholder="z.B. HRB 12345"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSearch}
                  className="btn btn-inverted btn-lg flex-1"
                >
                  Erneut suchen
                </button>
                <button
                  onClick={handleConfirm}
                  className="btn btn-primary btn-lg flex-1"
                >
                  Weiter &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
