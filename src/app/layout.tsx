import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
  title: "LiquidNow | Liquidität in 48 Stunden für E-Commerce & Handel",
  description:
    "Betriebsmittelkredit von €10.000 bis €500.000. Antrag in 60 Sekunden, Auszahlung in 48 Stunden. 4+ Banken vergleichen. 100% kostenlos & unverbindlich.",
  keywords:
    "Betriebsmittelkredit, Firmenkredit, E-Commerce Finanzierung, Liquidität, KMU Kredit, Online-Shop Kredit",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "LiquidNow – Liquidität in 48 Stunden",
    description:
      "Der schnellste Weg zu Ihrem Firmenkredit. 60-Sekunden-Antrag, 4+ Banken, 48h Auszahlung.",
    url: "https://liquidnow.de",
    siteName: "LiquidNow",
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
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
