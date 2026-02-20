"use client";

interface CCCChartProps {
  dso: number;
  dio: number;
  dpo: number;
}

export default function CCCChart({ dso, dio, dpo }: CCCChartProps) {
  const total = dso + dio;
  const ccc = dso + dio - dpo;

  const dsoPercent = total > 0 ? (dso / total) * 100 : 33;
  const dioPercent = total > 0 ? (dio / total) * 100 : 33;
  const dpoPercent = total > 0 ? Math.min((dpo / total) * 100, 100) : 33;

  return (
    <div className="space-y-4">
      {/* Cash gebunden (DSO + DIO) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark">Cash gebunden (DSO + DIO)</span>
          <span className="text-sm font-bold text-dark">{dso + dio} Tage</span>
        </div>
        <div className="quickcheck-ccc-bar">
          <div
            className="quickcheck-ccc-segment quickcheck-ccc-segment-dso"
            style={{ width: `${dsoPercent}%` }}
          >
            DSO {dso}
          </div>
          <div
            className="quickcheck-ccc-segment quickcheck-ccc-segment-dio"
            style={{ width: `${dioPercent}%` }}
          >
            DIO {dio}
          </div>
        </div>
      </div>

      {/* Cash-Puffer (DPO) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark">Cash-Puffer (DPO)</span>
          <span className="text-sm font-bold text-dark">−{dpo} Tage</span>
        </div>
        <div className="quickcheck-ccc-bar">
          <div
            className="quickcheck-ccc-segment quickcheck-ccc-segment-dpo"
            style={{ width: `${dpoPercent}%` }}
          >
            DPO {dpo}
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-lg font-bold text-dark">
          Cash Conversion Cycle
        </span>
        <span className={`text-2xl font-bold ${ccc > 0 ? "text-orange" : "text-turquoise"}`}>
          {ccc} Tage
        </span>
      </div>
      <p className="text-xs text-subtle">
        CCC = DSO ({dso}) + DIO ({dio}) − DPO ({dpo}) = {ccc} Tage
      </p>
    </div>
  );
}
