import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import { TrackingProvider } from "@/lib/tracking";
import Analytics from "@/components/Analytics";
import JsonLd, { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from "@/components/JsonLd";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://liqinow.de";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LiqiNow | Betriebsmittelkredite vergleichen – Schnell & kostenlos",
    template: "%s | LiqiNow",
  },
  description:
    "Intelligent vergleichen, schneller finanzieren. Betriebsmittelkredite von führenden Banken und Fintechs – kostenlos verglichen, für Unternehmer mit Köpfchen.",
  keywords: [
    "Betriebsmittelkredit",
    "Unternehmenskredit",
    "Finanzierungsvergleich",
    "Kredit KMU",
    "Mittelstand Finanzierung",
    "Working Capital",
    "Einkaufsfinanzierung",
    "Factoring",
  ],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: {
    title: "LiqiNow – Intelligent vergleichen. Schneller finanzieren.",
    description:
      "Betriebsmittelkredite von führenden Banken und Fintechs – kostenlos verglichen, für Unternehmer mit Köpfchen.",
    url: SITE_URL,
    siteName: "LiqiNow",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "/hero-unternehmerin.png",
        width: 1200,
        height: 630,
        alt: "LiqiNow – Working Capital Marktplatz",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LiqiNow – Intelligent vergleichen. Schneller finanzieren.",
    description:
      "Betriebsmittelkredite von führenden Banken und Fintechs – kostenlos verglichen.",
    images: ["/hero-unternehmerin.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <Analytics />
        <JsonLd data={[ORGANIZATION_SCHEMA, WEBSITE_SCHEMA]} />
      </head>
      <body
        className={`${poppins.variable} ${inter.variable} antialiased notranslate`}
      >
        <TrackingProvider>
          {children}
        </TrackingProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
