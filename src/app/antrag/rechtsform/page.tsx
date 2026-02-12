"use client";

import { useState } from "react";
import { ArrowLeft, Building2, User, Users, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

const legalForms = [
  { id: "gmbh", label: "GmbH", icon: Building2 },
  { id: "ug", label: "UG (haftungsbeschränkt)", icon: Building2 },
  { id: "einzelunternehmen", label: "Einzelunternehmen", icon: User },
  { id: "gbr", label: "GbR", icon: Users },
  { id: "ag", label: "AG", icon: Building2 },
  { id: "kg", label: "KG", icon: Building2 },
];

export default function RechtsformPage() {
  const router = useRouter();
  const [legalForm, setLegalForm] = useState("");

  const handleSelect = (value: string) => {
    setLegalForm(value);
    // TODO: Save legal form to state management/context
    console.log("Legal form selected:", value);

    // Navigate after short delay for visual feedback
    setTimeout(() => {
      router.push("/antrag");
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F5DEB3]/10 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
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
          <div className="mx-auto max-w-2xl">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-dark mb-3">
                Welche Rechtsform hat Ihr Unternehmen?
              </h1>
              <p className="text-lg text-subtle">
                Wählen Sie Ihre Unternehmensform aus
              </p>
            </div>

            {/* Form Card */}
            <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {legalForms.map((form) => {
                  const Icon = form.icon;
                  return (
                    <label key={form.id} className="block cursor-pointer">
                      <input
                        type="radio"
                        name="legalForm"
                        value={form.id}
                        checked={legalForm === form.id}
                        onChange={(e) => handleSelect(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        className={`funnel-radio-option ${
                          legalForm === form.id ? "funnel-radio-option-selected" : ""
                        }`}
                      >
                        <div className="funnel-icon-badge">
                          <Icon className="h-5 w-5 text-turquoise" />
                        </div>
                        <span className="text-base font-medium flex-1 text-dark">
                          {form.label}
                        </span>
                        {legalForm === form.id && (
                          <Check className="h-5 w-5 text-turquoise shrink-0" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!legalForm}
                  className="btn-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
