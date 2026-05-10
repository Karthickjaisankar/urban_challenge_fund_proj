/** Floating stats overlay shown on the India map — top 3 states per dept, totals. */
import { Trophy } from "lucide-react";
import { DEPT_REGISTRY } from "@/lib/constants";

interface HomeStatsStripProps {
  snapshot: any;
  deptMetas: any[];
  onSelectState: (s: string) => void;
}

export function HomeStatsStrip({ snapshot, deptMetas, onSelectState }: HomeStatsStripProps) {
  if (!snapshot?.states) return null;

  // Compute top 3 per each dept's FIRST KPI (lower-is-better: lowest = best)
  const getTop3 = (meta: any) => {
    if (!meta?.kpis?.length) return [];
    const kpi = meta.kpis[0];
    const rows = Object.entries(snapshot.states)
      .map(([state, s]: any) => ({ state, val: s.kpis?.[kpi.code] }))
      .filter(r => Number.isFinite(r.val));
    rows.sort((a, b) => kpi.direction === "lower_is_better" ? a.val - b.val : b.val - a.val);
    return rows.slice(0, 3);
  };

  return (
    <div className="absolute top-4 right-4 z-[600] flex flex-col gap-2"
         style={{ pointerEvents: "none" }}>
      {/* Total counts */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-xl"
           style={{ background: "rgba(8,14,22,0.90)", border: "1px solid rgba(255,255,255,0.10)", pointerEvents: "auto" }}>
        <div className="text-center">
          <div className="fig text-2xl font-black text-white">36</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wider">States/UTs</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="fig text-2xl font-black text-white">766</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wider">Districts</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <div className="fig text-2xl font-black text-white">7</div>
          <div className="text-[9px] text-white/40 uppercase tracking-wider">Departments</div>
        </div>
      </div>

      {/* Top-3 per dept */}
      {deptMetas.slice(0, 3).map((meta) => {
        const top = getTop3(meta);
        const deptConf = DEPT_REGISTRY.find(d => d.code === meta.code);
        if (!top.length) return null;
        return (
          <div key={meta.code} className="rounded-xl px-3 py-2"
               style={{ background: "rgba(8,14,22,0.90)", border: `1px solid ${deptConf?.accent ?? "#fff"}22`, pointerEvents: "auto" }}>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={11} style={{ color: deptConf?.accent }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: deptConf?.accent }}>
                {meta.name} · Top states
              </span>
            </div>
            {top.map((r, i) => (
              <button key={r.state} onClick={() => onSelectState(r.state)}
                className="flex items-center gap-2 w-full text-left py-0.5 hover:opacity-80 transition">
                <span className="fig text-[10px] text-white/30 w-4">#{i+1}</span>
                <span className="text-[11px] text-white/80 font-semibold truncate flex-1">{r.state}</span>
                <span className="fig text-[11px] font-bold" style={{ color: deptConf?.accent }}>{r.val.toFixed(1)}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
