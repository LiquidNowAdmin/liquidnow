"use client";

import { Users, Warehouse, Truck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { diagnosisTiles } from "@/lib/data";

const iconMap = {
  Users,
  Warehouse,
  Truck,
} as const;

export default function DiagnosisWidget() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {diagnosisTiles.map((tile) => {
        const Icon = iconMap[tile.icon as keyof typeof iconMap];
        return (
          <Link href="/quickcheck" key={tile.id}>
            <div className="diagnosis-tile">
              <div className="diagnosis-icon-box">
                <Icon className="h-5 w-5 text-turquoise" />
              </div>
              <span className="diagnosis-tile-title">{tile.title}</span>
              <p className="diagnosis-tile-desc" dangerouslySetInnerHTML={{ __html: tile.description }} />
              <p className="text-xs text-subtle leading-relaxed mt-1" dangerouslySetInnerHTML={{ __html: tile.explainer }} />
              <p className="text-xs text-dark leading-relaxed mt-3 pt-0">
                <span className="text-xs font-semibold text-turquoise uppercase tracking-wide">Lösungswege</span>
                <span className="block mt-1" dangerouslySetInnerHTML={{ __html: tile.solutions }} />
              </p>
              <span className="diagnosis-tile-cta">
                QuickCheck starten <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
