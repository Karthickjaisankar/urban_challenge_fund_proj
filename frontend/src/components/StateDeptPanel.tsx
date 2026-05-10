/**
 * Right panel — STATE view (light theme).
 * Shows 7 department cards for the selected state.
 */
import { Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass, LayoutGrid, X } from "lucide-react";
import { DEPT_REGISTRY } from "@/lib/constants";

const ICONS: Record<string, any> = {
  Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass, LayoutGrid,
};

interface StateDeptPanelProps {
  stateName: string;
  snapshot: any;
  funding: any;
  deptMetas: any[];
  onClose: () => void;
  onSelectDept: (code: string) => void;
  activeDept: string | null;
}

export function StateDeptPanel({
  stateName, snapshot, funding, deptMetas, onClose, onSelectDept, activeDept,
}: StateDeptPanelProps) {
  return (
    <div className="flex flex-col h-full bg-surface-100">
      {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-start justify-between shrink-0">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-semibold mb-1">Nodal ICCC · State</div>
          <div className="display text-2xl font-black text-slate-900 leading-tight">{stateName}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" style={{ boxShadow: "0 0 6px rgba(255,215,0,0.7)" }} />
            <span className="text-[11px] text-slate-500 font-medium">7 departments tracked</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition mt-1">
          <X size={16} />
        </button>
      </div>

      {/* Dept cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {deptMetas.map((meta: any) => {
          const snap = snapshot?.[meta.code]?.states?.[stateName];
          const fund = funding?.[meta.code];
          const conf = DEPT_REGISTRY.find(d => d.code === meta.code);
          const accent = conf?.accent ?? "#3B82F6";
          const isActive = activeDept === meta.code;
          const Icon = ICONS[meta.icon] ?? LayoutGrid;

          const releasePct = fund
            ? Math.round(fund.total_released / Math.max(1, fund.total_allocated) * 100)
            : null;

          return (
            <button
              key={meta.code}
              onClick={() => onSelectDept(meta.code)}
              className="w-full text-left rounded-xl p-4 transition-all bg-white border"
              style={{
                borderColor: isActive ? accent : "rgba(0,0,0,0.07)",
                boxShadow: isActive
                  ? `0 0 0 2px ${accent}30, 0 4px 16px -4px ${accent}25`
                  : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              {/* Icon + name + fund */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: `${accent}15` }}>
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-slate-800">{meta.name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{conf?.tagline}</div>
                  </div>
                </div>
                {releasePct != null && (
                  <div className="text-right">
                    <div className="fig text-xl font-black" style={{ color: accent }}>{releasePct}%</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">UCF utilized</div>
                  </div>
                )}
              </div>

              {/* UCF utilization bar */}
              {releasePct != null && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all"
                       style={{ width: `${releasePct}%`, background: `linear-gradient(90deg, ${accent}88, ${accent})` }} />
                </div>
              )}

              {/* 3 KPI mini-tiles */}
              {snap && meta.kpis?.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {meta.kpis.slice(0, 3).map((k: any) => {
                    const v = snap.kpis?.[k.code];
                    return (
                      <div key={k.code} className="rounded-lg px-2 py-1.5 bg-slate-50 border border-slate-100">
                        <div className="text-[9px] text-slate-400 uppercase tracking-wider leading-none font-semibold">{k.short}</div>
                        <div className="fig text-[15px] font-bold leading-tight mt-0.5 text-slate-700">
                          {Number.isFinite(v) ? v.toFixed(1) : "—"}
                        </div>
                        <div className="text-[8px] text-slate-400 leading-none">{k.unit}</div>
                      </div>
                    );
                  })}
                </div>
              )}
              {!snap && (
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,2].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
