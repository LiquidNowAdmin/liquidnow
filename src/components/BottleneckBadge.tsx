import { AlertTriangle, Users, Warehouse, Truck, Calendar, CheckCircle } from "lucide-react";
import { type BottleneckType, bottleneckLabels } from "@/lib/quickcheck";

interface BottleneckBadgeProps {
  type: BottleneckType;
  score: number;
}

const iconMap: Record<BottleneckType, React.ElementType> = {
  receivables_heavy: Users,
  inventory_heavy: Warehouse,
  payables_constrained: Truck,
  project_heavy: Calendar,
  balanced: CheckCircle,
};

const colorMap: Record<BottleneckType, string> = {
  receivables_heavy: "bg-turquoise/10 text-turquoise-dark",
  inventory_heavy: "bg-gold/20 text-dark",
  payables_constrained: "bg-dark/10 text-dark",
  project_heavy: "bg-orange/10 text-orange",
  balanced: "bg-turquoise/10 text-turquoise-dark",
};

export default function BottleneckBadge({ type, score }: BottleneckBadgeProps) {
  const Icon = iconMap[type] || AlertTriangle;
  const label = bottleneckLabels[type];
  const color = colorMap[type];

  return (
    <div className={`flex items-center gap-4 p-5 rounded-xl ${color}`}>
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/80 shrink-0">
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-heading font-bold text-lg">{label.title}</span>
          <span className="text-sm font-bold opacity-70">Score: {score}/100</span>
        </div>
        <p className="text-sm opacity-80 leading-relaxed">{label.description}</p>
      </div>
    </div>
  );
}
