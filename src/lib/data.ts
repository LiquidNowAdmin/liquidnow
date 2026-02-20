export const howItWorksSteps = [
  {
    step: 1,
    icon: "Search" as const,
    iconColor: "gold" as const,
    headline: "QuickCheck starten",
    body: "Beantworten Sie in 5 Minuten wenige Fragen zu Ihrem Geschäft – Branche, Umsatz und grobe Zahlungsströme.",
  },
  {
    step: 2,
    icon: "Activity" as const,
    iconColor: "turquoise" as const,
    headline: "Diagnose erhalten",
    body: "LiqiNow analysiert Ihren Cash Conversion Cycle und zeigt, wo Ihr Cash gebunden ist – bei Kunden, im Lager oder bei Lieferanten.",
  },
  {
    step: 3,
    icon: "BookOpen" as const,
    iconColor: "turquoise" as const,
    headline: "Playbook erhalten",
    body: "Passend zu Ihrem Cash-Profil erhalten Sie ein Maßnahmenpaket: operative Hebel, Risikobausteine und Finanzierungsoptionen.",
  },
  {
    step: 4,
    icon: "Target" as const,
    iconColor: "turquoise" as const,
    headline: "Passende Lösung finden",
    body: "Vergleichen Sie neutral die besten Optionen – von Factoring über Kreditversicherung bis Software – und setzen Sie um.",
  },
];

export const diagnosisTiles = [
  {
    id: "dso",
    icon: "Users" as const,
    title: "Kunden zahlen zu spät",
    description: "Forderungen binden Cash – Ihre <strong>DSO</strong> (Days Sales Outstanding) ist zu hoch.",
    explainer: "DSO misst, wie viele Tage es dauert, bis Ihre Kunden bezahlen. Je höher die DSO, desto länger ist Ihr Geld in <strong>offenen Rechnungen</strong> gebunden.",
    solutions: "<strong>Factoring</strong> wandelt offene Rechnungen sofort in Liquidität um. <strong>Betriebsmittelkredite</strong> überbrücken die Wartezeit bis zum Zahlungseingang. <strong>Kreditversicherung</strong> sichert Forderungsausfälle ab. <strong>Mahnmanagement</strong> und kürzere Zahlungsziele senken die DSO operativ.",
    metric: "DSO",
  },
  {
    id: "dio",
    icon: "Warehouse" as const,
    title: "Kapital im Lager gebunden",
    description: "Bestände wachsen, Umschlag sinkt – Ihre <strong>DIO</strong> (Days Inventory Outstanding) steigt.",
    explainer: "DIO zeigt, wie viele Tage Ihre Ware im Lager liegt, bevor sie verkauft wird. Hohe DIO bedeutet: Kapital steckt in <strong>Regalen statt auf dem Konto</strong>.",
    solutions: "<strong>Einkaufsfinanzierung</strong> schont die eigene Liquidität beim Wareneinkauf. <strong>Betriebsmittelkredite</strong> finanzieren den laufenden Warennachschub. <strong>Bestandsoptimierung</strong> durch bessere Absatzplanung senkt die DIO. <strong>Konsignationslager</strong> verlagern das Bestandsrisiko zum Lieferanten.",
    metric: "DIO",
  },
  {
    id: "dpo",
    icon: "Truck" as const,
    title: "Lieferanten drücken auf Vorkasse",
    description: "Zahlungsziele schrumpfen – Ihre <strong>DPO</strong> (Days Payable Outstanding) sinkt.",
    explainer: "DPO gibt an, wie viele Tage Sie Zeit haben, Ihre Lieferanten zu bezahlen. Niedrige DPO heißt: Sie zahlen schnell und verlieren Ihren <strong>Cash-Puffer</strong>.",
    solutions: "<strong>Reverse Factoring</strong> verlängert Ihre Zahlungsziele, ohne den Lieferanten zu belasten. <strong>Betriebsmittelkredite</strong> schaffen Luft für pünktliche Zahlungen. <strong>Lieferantenkredite</strong> neu verhandeln schafft Spielraum. <strong>Skonto-Optimierung</strong> senkt Kosten, wenn die Liquidität reicht.",
    metric: "DPO",
  },
];

export const caseScenarios = [
  {
    id: "wachstum",
    tag: "Case A",
    title: "Wachstum frisst Cash",
    description: "Volle Auftragsbücher, aber der Einkauf muss vorfinanziert werden – und die Banklinie wächst nicht mit.",
    bottleneck: "DIO ↑, CCC verlängert",
  },
  {
    id: "zahlungsmoral",
    tag: "Case B",
    title: "Zahlungsmoral kippt",
    description: "Kunden zahlen in 60–90 statt 30 Tagen. Nicht aus Böswilligkeit – sondern weil deren Innenfinanzierung klemmt.",
    bottleneck: "DSO ↑, Overdues ↑",
  },
  {
    id: "projektgeschaeft",
    tag: "Case C",
    title: "Projektgeschäft",
    description: "Cash kommt spät, Material kommt früh. Jeder Meilenstein ist eine Wette auf Zeit und Abnahme.",
    bottleneck: "DIO + Abnahme-Risiko",
  },
  {
    id: "inventory-trap",
    tag: "Case D",
    title: "Zu viel Lager – aber gefühlt nötig",
    description: "Ohne Sicherheitsbestand stehe man – mit Sicherheitsbestand steht man bald auch. Nur finanziell.",
    bottleneck: "DIO ↑, Obsoleszenz ↑",
  },
  {
    id: "dpo-schock",
    tag: "Case E",
    title: "Lieferanten drücken Zahlungsziele",
    description: "Lieferanten verkürzen Zahlungsziele oder verlangen Vorkasse, weil sie selbst unter Druck stehen.",
    bottleneck: "DPO ↓, CCC explodiert",
  },
  {
    id: "restrukturierung",
    tag: "Case F",
    title: "Restrukturierung light",
    description: "Die Kreditlinie wird zur Zwangsjacke. Jede Abweichung triggert Fragen der Bank.",
    bottleneck: "Covenants eng",
  },
];

export const valueProps = [
  {
    icon: "Banknote" as const,
    iconColor: "gold" as const,
    headline: "Keine Zusatzkosten",
    body: "Während klassische Vermittler 2-3% Beratungsprovision berechnen, zahlst du bei LiquiNow exakt die gleichen Konditionen wie bei Direktabschluss. Bei 50.000€ sparst du bis zu 1.500€.",
    hoverBorder: "turquoise" as const,
  },
  {
    icon: "Zap" as const,
    iconColor: "turquoise" as const,
    headline: "Maschinelle Prüfung",
    body: "KI-gestützte Risikoprüfung in Echtzeit, ohne menschliche Zwischenschritte. Keine händische Prüfung. Keine Wartezeiten. Alles in unter 5 Minuten.",
    hoverBorder: "gold" as const,
  },
  {
    icon: "ShieldCheck" as const,
    iconColor: "turquoise" as const,
    headline: "Volle Transparenz",
    body: "Alle Konditionen, Zinssätze und Anbieter sofort sichtbar. Kein Gatekeeping. Kein \"erst Termin vereinbaren\". Du siehst alle Optionen und entscheidest selbst.",
    hoverBorder: "gradient" as const,
  },
  {
    icon: "Smartphone" as const,
    iconColor: "gold" as const,
    headline: "Von überall beantragen",
    body: "Beantrage deinen Kredit von überall: vom Smartphone, Tablet oder Laptop. Keine Bürozeiten. Keine Terminabsprachen. Wann und wo du willst.",
    hoverBorder: "turquoise" as const,
  },
];

export const targetAudienceItems = [
  "Online-Shops & E-Commerce",
  "Einzelhändler & stationärer Handel",
  "Großhändler & Distributoren",
  "Amazon, eBay & Marketplace Seller",
  "Wareneinkauf-Finanzierung",
  "Saison-Vorfinanzierung",
];

export const testimonials = [
  {
    quote:
      "Kein Vertrieb, keine Papierstapel. Einfach online vergleichen und selbst entscheiden. In 2 Tagen war das Geld auf dem Konto.",
    author: "Michael K.",
    company: "Schreinerei Köhler, München",
    useCase: "Maschinenfinanzierung",
    image: "/testimonial-handwerker.png",
    stars: 5,
  },
  {
    quote:
      "Transparent, schnell, von überall nutzbar. Genau so sollte Unternehmensfinanzierung heute funktionieren.",
    author: "Jan F.",
    company: "Kreativagentur FLUX, Berlin",
    useCase: "Wachstumsfinanzierung",
    image: "/testimonial-marketing.png",
    stars: 5,
  },
  {
    quote:
      "Endlich keine versteckten Gebühren mehr! In 4 Minuten hatte ich 3 Angebote auf dem Tisch – ohne Anruf.",
    author: "Heinrich B.",
    company: "Hof Brinkmann, Niedersachsen",
    useCase: "Saisonfinanzierung",
    image: "/testimonial-bauer.png",
    stars: 5,
  },
];

export const faqItems = [
  {
    question: "Was ist der QuickCheck – und was bringt er mir?",
    answer:
      "Der QuickCheck analysiert in 5 Minuten, wo Ihr Cash gebunden ist: bei Kunden (DSO), im Lager (DIO) oder bei Lieferanten (DPO). Sie erhalten ein Cash-Profil mit konkreten Handlungsempfehlungen – noch bevor Sie über Finanzierungsprodukte nachdenken.",
  },
  {
    question: "Ist LiqiNow ein Finanzierungsvergleich?",
    answer:
      "LiqiNow ist zuerst ein Diagnose- und Orientierungsportal. Viele Unternehmen starten mit \u201EWir brauchen Finanzierung\u201C. Häufig ist die bessere Frage: Wo steckt unser Cash – und welcher Hebel löst das Problem am schnellsten? Erst nach der Diagnose zeigen wir neutral passende Lösungen.",
  },
  {
    question: "Was ist der Cash Conversion Cycle (CCC)?",
    answer:
      "Der CCC misst, wie viele Tage Ihr Cash im operativen Kreislauf gebunden ist: DSO (Forderungen) + DIO (Lager) – DPO (Verbindlichkeiten). Je höher der CCC, desto mehr Liquidität brauchen Sie. LiqiNow hilft, den CCC zu senken – operativ, über Risikobausteine und bei Bedarf mit Finanzierung.",
  },
  {
    question: "Was kostet LiqiNow?",
    answer:
      "Der QuickCheck, die Diagnose und alle Wiki-Inhalte sind kostenlos. LiqiNow finanziert sich über Vermittlungsprovisionen der Finanzierungspartner – Sie zahlen keine Zusatzgebühren.",
  },
];

export const partnerLogos = [
  { name: "Partner Bank 1" },
  { name: "Partner Bank 2" },
  { name: "Partner Bank 3" },
  { name: "Partner Bank 4" },
  { name: "Partner Bank 5" },
];
