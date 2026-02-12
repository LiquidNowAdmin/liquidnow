"use client";

import { useState } from "react";
import { ArrowLeft, Building2, Waves } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

interface CompanyFormData {
  name: string;
  street: string;
  zip: string;
  city: string;
  country: string;
  ustId: string;
  hrb: string;
}

export default function ManuelleEingabePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    ustId: "",
    hrb: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});

  const handleChange = (field: keyof CompanyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Firmenname ist erforderlich";
    }
    if (!formData.street.trim()) {
      newErrors.street = "Straße ist erforderlich";
    }
    if (!formData.zip.trim()) {
      newErrors.zip = "PLZ ist erforderlich";
    } else if (!/^\d{5}$/.test(formData.zip)) {
      newErrors.zip = "Bitte geben Sie eine gültige 5-stellige PLZ ein";
    }
    if (!formData.city.trim()) {
      newErrors.city = "Stadt ist erforderlich";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // TODO: Save data to state management/context
      console.log("Form submitted:", formData);
      router.push("/antrag/zweck");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#F5DEB3]/10 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/antrag" className="flex items-center gap-2 text-subtle hover:text-dark transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Zurück</span>
            </Link>
            <div className="logo text-xl">
              <span className="logo-turquoise">Liquid</span>
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
              Firmendaten manuell eingeben
            </h1>
            <p className="text-lg text-subtle">
              Pflichtfelder: Name & Anschrift
            </p>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="card p-8">
            <div className="mb-6 flex items-center gap-3 pb-6 border-b border-gray-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-turquoise/10">
                <Building2 className="h-6 w-6 text-turquoise" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark">Unternehmensdaten</h2>
                <p className="text-sm text-subtle">* Pflichtfelder</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Firmenname */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-dark mb-2">
                  Firmenname *
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-colors ${
                    errors.name
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-turquoise"
                  }`}
                  placeholder="z.B. Mustermann GmbH"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Straße */}
              <div>
                <label htmlFor="street" className="block text-sm font-semibold text-dark mb-2">
                  Straße & Hausnummer *
                </label>
                <input
                  id="street"
                  type="text"
                  value={formData.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-colors ${
                    errors.street
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-turquoise"
                  }`}
                  placeholder="z.B. Musterstraße 123"
                />
                {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
              </div>

              {/* PLZ & Stadt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="zip" className="block text-sm font-semibold text-dark mb-2">
                    PLZ *
                  </label>
                  <input
                    id="zip"
                    type="text"
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                    className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-colors ${
                      errors.zip
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-turquoise"
                    }`}
                    placeholder="z.B. 12345"
                    maxLength={5}
                  />
                  {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-dark mb-2">
                    Stadt *
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className={`w-full px-4 py-3 text-base border-2 rounded-lg outline-none transition-colors ${
                      errors.city
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-200 focus:border-turquoise"
                    }`}
                    placeholder="z.B. Berlin"
                  />
                  {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
                </div>
              </div>

              {/* Optional Fields Divider */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-semibold text-subtle mb-4">Optional</p>
              </div>

              {/* USt-ID */}
              <div>
                <label htmlFor="ustId" className="block text-sm font-semibold text-dark mb-2">
                  Umsatzsteuer-ID (optional)
                </label>
                <input
                  id="ustId"
                  type="text"
                  value={formData.ustId}
                  onChange={(e) => handleChange("ustId", e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg outline-none transition-colors focus:border-turquoise"
                  placeholder="z.B. DE123456789"
                />
              </div>

              {/* HRB */}
              <div>
                <label htmlFor="hrb" className="block text-sm font-semibold text-dark mb-2">
                  Handelsregisternummer (optional)
                </label>
                <input
                  id="hrb"
                  type="text"
                  value={formData.hrb}
                  onChange={(e) => handleChange("hrb", e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg outline-none transition-colors focus:border-turquoise"
                  placeholder="z.B. HRB 12345"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button type="submit" className="btn-cta-primary">
                  Weiter &rarr;
                </button>
              </div>
            </div>
          </form>
        </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
