import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import { TrackingProvider } from "@/lib/tracking";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LiqiNow | Betriebsmittelkredite vergleichen – Schnell & kostenlos",
  description:
    "Intelligent vergleichen, schneller finanzieren. Betriebsmittelkredite von führenden Banken und Fintechs – kostenlos verglichen, für Unternehmer mit Köpfchen.",
  keywords:
    "Betriebsmittelkredit, Unternehmenskredit, Finanzierungsvergleich, Kredit KMU, Mittelstand Finanzierung, Kredit Vergleich",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "LiqiNow – Intelligent vergleichen. Schneller finanzieren.",
    description:
      "Betriebsmittelkredite von führenden Banken und Fintechs – kostenlos verglichen, für Unternehmer mit Köpfchen.",
    url: "https://liqinow.de",
    siteName: "LiqiNow",
    locale: "de_DE",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${poppins.variable} ${inter.variable} antialiased`}
      >
        <TrackingProvider>
          {children}
        </TrackingProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
