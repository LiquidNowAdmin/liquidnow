"use client";

import { useState } from "react";
import { ArrowLeft, User, Mail, Check, ShieldCheck, Ban, Lock, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

export default function KontaktPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Vorname ist erforderlich";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Nachname ist erforderlich";
    }
    if (!email.trim()) {
      newErrors.email = "E-Mail ist erforderlich";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Bitte geben Sie eine gültige E-Mail-Adresse ein";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      setIsSubmitting(true);

      // TODO: Submit all funnel data to backend
      console.log("Final submission:", {
        firstName,
        lastName,
        email,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 4000));

      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F5DEB3]/10 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/antrag/branche" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </Link>
            <div className="logo text-xl">
              <span className="logo-turquoise">Liqi</span>
              <span className="logo-gold">Now</span>
            </div>
            <div className="w-20" />
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
          <div className="mx-auto max-w-2xl">
            {/* Progress Indicator */}
            <div className="mb-8 flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="h-1 w-12 bg-turquoise rounded" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="h-1 w-12 bg-turquoise rounded" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="h-1 w-12 bg-turquoise rounded" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
                <Check className="h-5 w-5" />
              </div>
              <div className="h-1 w-12 bg-turquoise rounded" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-turquoise text-sm font-bold text-white">
                5
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-3">
                Jetzt registrieren
              </h1>
              <p className="text-lg text-subtle mb-6">
                Um Ihre individuellen Konditionen zu berechnen
              </p>

              {/* Trust Icons */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-subtle">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-turquoise flex-shrink-0" />
                  <span>Kostenlose Registrierung</span>
                </div>
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4 text-turquoise flex-shrink-0" />
                  <span>Keine Werbung</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-turquoise flex-shrink-0" />
                  <span>Keine Datenweitergabe</span>
                </div>
              </div>
            </div>

            {/* Loading State with Info */}
            {isSubmitting && (
              <>
                <div className="flex items-start gap-3 p-4 bg-turquoise/5 border border-turquoise/20 rounded-lg mb-6">
                  <MailCheck className="h-5 w-5 text-turquoise shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-dark mb-1">
                      Gleich geschafft!
                    </p>
                    <p className="text-subtle">
                      Wir senden Ihnen eine Bestätigungs-E-Mail an <span className="font-semibold text-dark">{email}</span>. Klicken Sie auf den Link, um Ihre Angebote einzusehen.
                    </p>
                  </div>
                </div>

                <div className="card p-8 sm:p-12">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Animated Waves */}
                  <div className="relative w-32 h-32">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-turquoise/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }}></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 bg-turquoise/30 rounded-full animate-ping" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }}></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-turquoise/40 rounded-full animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-12 w-12 text-turquoise animate-spin" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-dark mb-2">
                      Konditionen werden berechnet...
                    </h2>
                    <p className="text-subtle">
                      Wir kontaktieren unsere Partner-Banken
                    </p>
                  </div>
                </div>
              </div>
              </>
            )}

            {/* Success State */}
            {isSubmitted && (
              <div className="card p-8 sm:p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                  {/* Success Icon with Animation */}
                  <div className="relative">
                    <div className="w-24 h-24 bg-turquoise/10 rounded-full flex items-center justify-center animate-bounce" style={{ animationDuration: '1s', animationIterationCount: '2' }}>
                      <MailCheck className="h-12 w-12 text-turquoise" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-dark mb-2">
                      Bestätigen Sie Ihre E-Mail-Adresse
                    </h2>
                    <p className="text-lg text-subtle mb-4">
                      Wir haben Ihnen einen Bestätigungslink an
                    </p>
                    <p className="text-lg font-semibold text-turquoise mb-6">
                      {email}
                    </p>
                    <p className="text-sm text-subtle">
                      gesendet. Klicken Sie auf den Link in der E-Mail, um die Angebote einzusehen.
                    </p>
                  </div>

                  <div className="w-full max-w-md pt-4 border-t border-gray-200">
                    <p className="text-sm text-subtle">
                      <strong>E-Mail nicht erhalten?</strong> Überprüfen Sie Ihren Spam-Ordner oder{" "}
                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="text-turquoise hover:underline font-semibold"
                      >
                        versuchen Sie es erneut
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Card */}
            {!isSubmitting && !isSubmitted && (
              <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
              <div className="space-y-6">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
                      <User className="h-5 w-5 text-turquoise" />
                      Vorname
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (errors.firstName) {
                          setErrors({ ...errors, firstName: "" });
                        }
                      }}
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-colors ${
                        errors.firstName
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-turquoise"
                      }`}
                      placeholder="Max"
                    />
                    {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
                      <User className="h-5 w-5 text-turquoise sm:invisible" />
                      Nachname
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (errors.lastName) {
                          setErrors({ ...errors, lastName: "" });
                        }
                      }}
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-colors ${
                        errors.lastName
                          ? "border-red-300 focus:border-red-500"
                          : "border-gray-200 focus:border-turquoise"
                      }`}
                      placeholder="Mustermann"
                    />
                    {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-dark mb-2">
                    <Mail className="h-5 w-5 text-turquoise" />
                    E-Mail-Adresse
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors({ ...errors, email: "" });
                      }
                    }}
                    className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-colors ${
                      errors.email
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-turquoise"
                    }`}
                    placeholder="max@musterfirma.de"
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Privacy Notice */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-subtle">
                    Ihre E-Mail-Adresse wird benötigt, damit Sie jederzeit auf Ihre Angebote zugreifen können. Details finden Sie in unserer{" "}
                    <a href="/datenschutz" target="_blank" className="text-turquoise hover:underline font-semibold">
                      Datenschutzerklärung
                    </a>.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={!firstName.trim() || !lastName.trim() || !email.trim()}
                    className="btn-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Konditionen berechnen
                  </button>
                  <p className="text-center text-sm text-subtle mt-4">
                    100% kostenlos & unverbindlich · Keine SCHUFA-Auswirkung
                  </p>
                </div>
              </div>
            </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
