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
  title: "LiqiNow | Working-Capital-Diagnose für KMU – Wo steckt Ihr Cash?",
  description:
    "Kostenloser QuickCheck: Finden Sie in 5 Minuten heraus, wo Ihr Cash gebunden ist (DSO/DIO/DPO). Playbooks, neutrale Lösungen und Finanzierungsvergleich für Mittelstand und KMU.",
  keywords:
    "Working Capital, Cash Conversion Cycle, DSO, DIO, DPO, Factoring, Liquidität, KMU, Mittelstand, Betriebsmittelkredit",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "LiqiNow – Wo steckt Ihr Cash?",
    description:
      "Working-Capital-Diagnose in 5 Minuten. Von Symptom zur Ursache zur Lösung – neutral, nachvollziehbar, CFO-tauglich.",
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
