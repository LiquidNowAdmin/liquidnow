import { Waves } from "lucide-react";

const sizeMap = {
  sm: { text: "text-lg", icon: "h-5 w-5" },
  md: { text: "text-xl", icon: "h-6 w-6" },
  lg: { text: "text-2xl", icon: "h-7 w-7" },
} as const;

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = sizeMap[size];
  return (
    <div className="flex items-center gap-2">
      <Waves className={`${s.icon} text-turquoise`} />
      <span className={`logo ${s.text}`}>
        <span className="logo-turquoise">L</span>
        <span className="logo-wave logo-wave-1">i</span>
        <span className="logo-wave logo-wave-2">Q</span>
        <span className="logo-turquoise">i</span>
        <span className="logo-gold">Now</span>
      </span>
    </div>
  );
}
