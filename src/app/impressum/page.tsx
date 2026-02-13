import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

export default function ImpressumPage() {
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
              <span className="logo-turquoise">Liqi</span>
              <span className="logo-gold">Now</span>
            </div>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="card p-8 sm:p-12">
              <h1 className="text-3xl font-bold text-dark mb-8">Impressum</h1>

              <div className="space-y-8 text-dark">
                <div>
                  <h2 className="text-xl font-semibold mb-3">Angaben gemäß § 5 TMG</h2>
                  <p className="leading-relaxed">
                    Deutsche Einkaufsfinanzierer GmbH<br />
                    ABC-Straße 35<br />
                    20354 Hamburg
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Kontakt</h2>
                  <p className="leading-relaxed">
                    <strong>Telefon:</strong> <a href="tel:+494099999400" className="text-turquoise hover:underline">+49 40 999 999-400</a><br />
                    <strong>Fax:</strong> +49 40 999 999-401<br />
                    <strong>E-Mail:</strong> <a href="mailto:info@einkaufsfinanzierer.com" className="text-turquoise hover:underline">info@einkaufsfinanzierer.com</a><br />
                    <strong>Website:</strong> <a href="https://www.einkaufsfinanzierer.com" target="_blank" rel="noopener noreferrer" className="text-turquoise hover:underline">www.einkaufsfinanzierer.com</a>
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Postadresse Stuttgart</h2>
                  <p className="leading-relaxed">
                    Deutsche Einkaufsfinanzierer GmbH<br />
                    Grabenstraße 28<br />
                    70734 Fellbach
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Vertretungsberechtigter</h2>
                  <p className="leading-relaxed">
                    <strong>Geschäftsführender Gesellschafter:</strong> Thomas Auerbach
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-3">Registereintrag</h2>
                  <p className="leading-relaxed">
                    <strong>Amtsgericht:</strong> Hamburg<br />
                    <strong>Handelsregister:</strong> HRB 141686<br />
                    <strong>Steuernummer:</strong> 48 / 714 / 03703<br />
                    <strong>USt-IdNr.:</strong> DE306361948
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h2 className="text-xl font-semibold mb-3">Hinweis</h2>
                  <p className="leading-relaxed text-subtle">
                    LiqiNow ist ein Service der Deutschen Einkaufsfinanzierer GmbH und bietet einen Tippgeber-Service für Betriebsmittelkredite.
                    Wir bieten keine Finanzberatung oder Kreditvermittlung im Sinne des §34c GewO an.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
