export interface IndustryBenchmark {
  dso: number;
  dio: number;
  dpo: number;
  ccc: number;
}

export const industryBenchmarks: Record<string, IndustryBenchmark> = {
  handel: { dso: 14, dio: 45, dpo: 30, ccc: 29 },
  dienstleistung: { dso: 35, dio: 15, dpo: 0, ccc: 50 },
  produktion: { dso: 40, dio: 60, dpo: 35, ccc: 65 },
  gastronomie: { dso: 8, dio: 5, dpo: 20, ccc: -7 },
  grosshandel: { dso: 35, dio: 30, dpo: 30, ccc: 35 },
  projektgeschaeft: { dso: 55, dio: 25, dpo: 40, ccc: 40 },
  andere: { dso: 30, dio: 20, dpo: 30, ccc: 20 },
};

export const industryLabels: Record<string, string> = {
  handel: "E-Commerce & Handel",
  dienstleistung: "Dienstleistung",
  produktion: "Produktion & Handwerk",
  gastronomie: "Gastronomie & Hotellerie",
  grosshandel: "Großhandel & Distribution",
  projektgeschaeft: "Projektgeschäft & Anlagenbau",
  andere: "Andere Branche",
};
