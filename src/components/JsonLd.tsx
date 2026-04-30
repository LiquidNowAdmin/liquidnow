type JsonLdProps = { data: Record<string, unknown> | Array<Record<string, unknown>> };

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://liqinow.de";

export const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FinancialService",
  "@id": `${SITE_URL}/#organization`,
  name: "LiqiNow",
  alternateName: "LiQiNow",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  description:
    "Working Capital Marktplatz für den deutschen Mittelstand. Betriebsmittelkredite, Einkaufsfinanzierung & Factoring im neutralen Vergleich.",
  areaServed: { "@type": "Country", name: "Germany" },
  serviceType: ["Betriebsmittelkredit", "Einkaufsfinanzierung", "Factoring", "Revenue-Based Finance"],
};

export const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "LiqiNow",
  inLanguage: "de-DE",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}
