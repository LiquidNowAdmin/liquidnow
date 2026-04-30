import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plattform – Angebote vergleichen",
  description:
    "Ihre persönliche LiqiNow-Plattform: Angebote vergleichen, Anträge verwalten, Dokumente hochladen.",
  alternates: { canonical: "/plattform" },
  robots: { index: false, follow: true },
};

export default function PlattformLayout({ children }: { children: React.ReactNode }) {
  return children;
}
