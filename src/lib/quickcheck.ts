import { industryBenchmarks } from "./benchmarks";

export interface QuickCheckData {
  industry: string;
  annual_revenue: number;
  dso_days: number;
  dpo_days: number;
  dio_days: number;
  top_pains: string[];
  has_credit_insurance: boolean;
  has_erp: boolean;
}

export type BottleneckType =
  | "receivables_heavy"
  | "inventory_heavy"
  | "payables_constrained"
  | "project_heavy"
  | "balanced";

export interface QuickCheckResult {
  ccc_days: number;
  bottleneck_type: BottleneckType;
  bottleneck_score: number;
  industry_benchmark_ccc: number;
  recommended_playbooks: string[];
}

const STORAGE_KEY = "liqinow_quickcheck";

export function saveQuickCheckData(data: Partial<QuickCheckData>): void {
  const existing = loadQuickCheckData();
  const merged = { ...existing, ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function loadQuickCheckData(): Partial<QuickCheckData> {
  if (typeof window === "undefined") return {};
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function clearQuickCheckData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function calculateResult(data: QuickCheckData): QuickCheckResult {
  const ccc_days = data.dso_days + data.dio_days - data.dpo_days;

  const benchmark = industryBenchmarks[data.industry] || industryBenchmarks.handel;
  const industry_benchmark_ccc = benchmark.ccc;

  // Determine bottleneck type
  const dso_deviation = data.dso_days - benchmark.dso;
  const dio_deviation = data.dio_days - benchmark.dio;
  const dpo_deviation = benchmark.dpo - data.dpo_days; // Inverted: lower DPO = worse

  // Check for project-heavy based on pain points
  const hasProjectPain = data.top_pains.includes("projekt");

  let bottleneck_type: BottleneckType;
  if (hasProjectPain) {
    bottleneck_type = "project_heavy";
  } else if (dso_deviation >= dio_deviation && dso_deviation >= dpo_deviation && dso_deviation > 5) {
    bottleneck_type = "receivables_heavy";
  } else if (dio_deviation >= dso_deviation && dio_deviation >= dpo_deviation && dio_deviation > 5) {
    bottleneck_type = "inventory_heavy";
  } else if (dpo_deviation >= dso_deviation && dpo_deviation >= dio_deviation && dpo_deviation > 5) {
    bottleneck_type = "payables_constrained";
  } else {
    bottleneck_type = "balanced";
  }

  // Calculate bottleneck score (0-100): how far off from benchmark
  const ccc_gap = Math.max(0, ccc_days - industry_benchmark_ccc);
  const bottleneck_score = Math.min(100, Math.round((ccc_gap / Math.max(industry_benchmark_ccc, 1)) * 100));

  // Recommend playbooks based on bottleneck
  const recommended_playbooks: string[] = [];
  if (bottleneck_type === "receivables_heavy" || dso_deviation > 5) {
    recommended_playbooks.push("dso");
  }
  if (bottleneck_type === "inventory_heavy" || dio_deviation > 5) {
    recommended_playbooks.push("dio");
  }
  if (bottleneck_type === "payables_constrained" || dpo_deviation > 5) {
    recommended_playbooks.push("dpo");
  }
  if (bottleneck_type === "project_heavy") {
    recommended_playbooks.push("projekt");
  }
  if (data.top_pains.includes("wachstum")) {
    recommended_playbooks.push("wachstum");
  }
  if (data.top_pains.includes("banklinie")) {
    recommended_playbooks.push("krise-light");
  }

  // Ensure at least one playbook
  if (recommended_playbooks.length === 0) {
    if (ccc_days > industry_benchmark_ccc) {
      recommended_playbooks.push("dso");
    } else {
      recommended_playbooks.push("dso");
    }
  }

  return {
    ccc_days,
    bottleneck_type,
    bottleneck_score,
    industry_benchmark_ccc,
    recommended_playbooks: [...new Set(recommended_playbooks)].slice(0, 3),
  };
}

export const bottleneckLabels: Record<BottleneckType, { title: string; description: string }> = {
  receivables_heavy: {
    title: "Forderungslastig",
    description: "Ihr Cash steckt hauptsächlich in offenen Forderungen. Kunden zahlen zu spät.",
  },
  inventory_heavy: {
    title: "Lagerlastig",
    description: "Ihr Cash ist im Lagerbestand gebunden. Umschlag und Reichweite sind zu hoch.",
  },
  payables_constrained: {
    title: "Lieferantendruck",
    description: "Ihre Lieferanten fordern schnellere Zahlung. Das drückt Ihren DPO nach unten.",
  },
  project_heavy: {
    title: "Projektlastig",
    description: "Ihr Cash hängt an Meilensteinen und Abnahmen. Material kommt früh, Zahlung spät.",
  },
  balanced: {
    title: "Ausgeglichen",
    description: "Ihre CCC-Werte liegen nahe am Branchenschnitt. Optimierungspotenzial im Detail.",
  },
};

export const painOptions = [
  { value: "kunden_spaet", label: "Kunden zahlen immer später", icon: "Users" },
  { value: "lager_waechst", label: "Lagerbestand wächst ständig", icon: "Warehouse" },
  { value: "lieferanten_vorkasse", label: "Lieferanten verlangen Vorkasse", icon: "Truck" },
  { value: "wachstum", label: "Wachstum frisst Cash", icon: "TrendingUp" },
  { value: "projekt", label: "Projektgeschäft mit langen Zyklen", icon: "Calendar" },
  { value: "banklinie", label: "Banklinie ist ausgereizt", icon: "AlertTriangle" },
];
