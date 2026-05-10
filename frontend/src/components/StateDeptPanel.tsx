/**
 * Right panel — STATE view.
 * Shows 7 department cards for the selected state:
 *  - infographic dept icon + name
 *  - 3 KPI values
 *  - UCF fund allocation (% released)
 *  - Click → opens dept detail view
 */
import { Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass, LayoutGrid, X, TrendingUp, TrendingDown } from "lucide-react";
import { DEPT_REGISTRY } from "@/lib/constants";

const ICONS: Record<string, any> = {
  Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass, LayoutGrid,
};

interface StateDeptPanelProps {
  stateName: string;
  snapshot: any;        // full multi-dept snapshot keyed by dept code
  funding: any;         // per-dept funding for this state
  deptMetas: any[];     // array of dept META objects
  onClose: () => void;
  onSelectDept: (code: string) => void;
  activeDept: string | null;
}

export function StateDeptPanel({
  stateName, snapshot, funding, deptMetas, onClose, onSelectDept, activeDept,
}: StateDeptPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-start justify-between shrink-0"
           style={{ background: "rgba(13,24,33,0.95)" }}>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-1">Nodal ICCC</div>
          <div className="display text-2xl font-black text-white leading-tight">{stateName}</div>
          <div className="text-[11px] text-white/40 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse-nodal" />
            Active · 7 departments tracked
          </div>
        </div>
        <button onClick={onClose} className="mt-1 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition">
          <X size={16} />
        </button>
      </div>

      {/* Dept cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {deptMetas.map((meta: any) => {
          const snap = snapshot?.[meta.code]?.states?.[stateName];
          const fund = funding?.[meta.code];
          const conf = DEPT_REGISTRY.find(d => d.code === meta.code);
          const accent = conf?.accent ?? "#fff";
          const isActive = activeDept === meta.code;
          const Icon = ICONS[meta.icon] ?? LayoutGrid;

          const kpis = meta.kpis?.slice(0, 3) ?? [];
          const releasePct = fund
            ? Math.round(fund.total_released / Math.max(1, fund.total_allocated) * 100)
            : null;

          return (
            <button
              key={meta.code}
              onClick={() => onSelectDept(meta.code)}
              className="w-full text-left rounded-xl p-4 transition-all"
              style={{
                background: isActive ? `${accent}18` : "rgba(22,32,51,0.7)",
                border: `1px solid ${isActive ? accent : "rgba(255,255,255,0.07)"}`,
                boxShadow: isActive ? `0 0 0 1px ${accent}40, 0 8px 32px -8px ${accent}30` : undefined,
              }}
            >
              {/* Icon + name + fund tag */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background: `${accent}22` }}>
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-white">{meta.name}</div>
                    <div className="text-[10px] text-white/30">{conf?.tagline}</div>
                  </div>
                </div>
                {releasePct != null && (
                  <div className="text-right">
                    <div className="fig text-lg font-black" style={{ color: accent }}>{releasePct}%</div>
                    <div className="text-[9px] text-white/30 uppercase tracking-wider">UCF utilized</div>
                  </div>
                )}
              </div>

              {/* UCF fund bar */}
              {releasePct != null && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all"
                       style={{ width: `${releasePct}%`, background: `linear-gradient(90deg, ${accent}aa, ${accent})` }} />
                </div>
              )}

              {/* 3 KPI values */}
              {snap && kpis.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {kpis.map((k: any) => {
                    const v = snap.kpis?.[k.code];
                    return (
                      <div key={k.code} className="rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="text-[9px] text-white/30 uppercase tracking-wider leading-none">{k.short}</div>
                        <div className="fig text-[15px] font-bold leading-tight mt-0.5"
                             style={{ color: k.accent ?? accent }}>
                          {Number.isFinite(v) ? v.toFixed(1) : "—"}
                        </div>
                        <div className="text-[8px] text-white/20 leading-none">{k.unit}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
