const sizeMap = {
  sm: { text: "text-lg", iconSize: 20, sub: "text-[0.5rem]" },
  md: { text: "text-xl", iconSize: 24, sub: "text-[0.5625rem]" },
  lg: { text: "text-2xl", iconSize: 28, sub: "text-[0.625rem]" },
} as const;

function WavesIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" style={{ stroke: "#507AA6" }} />
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" style={{ stroke: "#D4872C" }} />
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" style={{ stroke: "#507AA6" }} />
    </svg>
  );
}

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = sizeMap[size];
  return (
    <div className="inline-flex flex-col">
      <div className="flex items-center gap-2">
        <WavesIcon size={s.iconSize} />
        <span className={`logo ${s.text}`}>
          <span className="logo-turquoise">L</span>
          <span className="logo-wave logo-wave-1">i</span>
          <span className="logo-wave logo-wave-2">Q</span>
          <span className="logo-turquoise">i</span>
          <span className="logo-gold">Now</span>
        </span>
      </div>
      <span className={`logo-subtitle ${s.sub}`}>Deutsche Einkaufsfinanzierer</span>
    </div>
  );
}
