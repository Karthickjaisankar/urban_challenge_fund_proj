/** Home page floating stats — top-right of India map. Light cards. */
import { Trophy } from "lucide-react";
import { DEPT_REGISTRY } from "@/lib/constants";

interface HomeStatsStripProps {
  snapshot: any;
  deptMetas: any[];
  onSelectState: (s: string) => void;
}

export function HomeStatsStrip({ snapshot, deptMetas, onSelectState }: HomeStatsStripProps) {
  if (!snapshot?.states) return null;

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
    <div className="absolute top-4 right-4 z-[600] flex flex-col gap-2" style={{ pointerEvents: "none" }}>
      {/* Totals */}
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white border border-slate-200"
           style={{ boxShadow: "0 2px 12px -4px rgba(0,0,0,0.12)", pointerEvents: "auto" }}>
        {[["36", "States/UTs"], ["766", "Districts"], ["7", "Departments"]].map(([val, lbl], i, arr) => (
          <div key={lbl} className="flex items-center gap-3">
            <div className="text-center">
              <div className="fig text-2xl font-black text-slate-800">{val}</div>
              <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">{lbl}</div>
            </div>
            {i < arr.length - 1 && <div className="w-px h-8 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Top-3 per dept (first 3 depts) */}
      {deptMetas.slice(0, 3).map((meta) => {
        const top = getTop3(meta);
        const conf = DEPT_REGISTRY.find(d => d.code === meta.code);
        if (!top.length) return null;
        return (
          <div key={meta.code} className="rounded-xl px-3 py-2.5 bg-white border border-slate-200"
               style={{ boxShadow: "0 2px 12px -4px rgba(0,0,0,0.10)", pointerEvents: "auto",
                        borderTop: `3px solid ${conf?.accent}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={11} style={{ color: conf?.accent }} />
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: conf?.accent }}>
                {meta.name} · Top states
              </span>
            </div>
            {top.map((r, i) => (
              <button key={r.state} onClick={() => onSelectState(r.state)}
                className="flex items-center gap-2 w-full text-left py-0.5 hover:opacity-70 transition">
                <span className="fig text-[10px] text-slate-400 w-4 font-bold">#{i + 1}</span>
                <span className="text-[11px] text-slate-700 font-semibold truncate flex-1">{r.state}</span>
                <span className="fig text-[11px] font-black" style={{ color: conf?.accent }}>{r.val.toFixed(1)}</span>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}
