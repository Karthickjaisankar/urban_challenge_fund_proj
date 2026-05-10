/**
 * Right panel — DISTRICT view.
 * Shows all 7 departments' KPIs for the selected district vs state average.
 */
import { ArrowLeft, Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass, LayoutGrid, TrendingDown, TrendingUp } from "lucide-react";
import { computeScore, scoreGrade } from "@/lib/scoring";

/** Corner glow matching KPITile logic — used on the dept card itself. */
function deptCardGlow(score: number | null): string | undefined {
  if (score == null) return undefined;
  if (score >= 65) return "0 0 0 1.5px rgba(22,163,74,0.38), 0 0 16px 4px rgba(22,163,74,0.18)";
  if (score >= 35) return "0 0 0 1.5px rgba(217,119,6,0.38), 0 0 16px 4px rgba(217,119,6,0.18)";
  return                 "0 0 0 1.5px rgba(220,38,38,0.38),  0 0 16px 4px rgba(220,38,38,0.18)";
}

/** Per-KPI mini-cell glow — compares district value vs state average. */
function kpiCellGlow(distVal: number, stateVal: number, direction: string): string | undefined {
  if (!Number.isFinite(distVal) || !Number.isFinite(stateVal) || stateVal === 0) return undefined;
  const rel = (distVal - stateVal) / Math.abs(stateVal);
  const within = Math.abs(rel) <= 0.10;
  let r: number, g: number, b: number;
  if (within) {
    [r, g, b] = [217, 119, 6];
  } else {
    const better = direction === "lower_is_better" ? rel < 0 : rel > 0;
    [r, g, b] = better ? [22, 163, 74] : [220, 38, 38];
  }
  return `0 0 0 1px rgba(${r},${g},${b},0.35), 0 0 10px 2px rgba(${r},${g},${b},0.18)`;
}
import { DEPT_REGISTRY } from "@/lib/constants";

const ICONS: Record<string, any> = {
  Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass, LayoutGrid,
};

interface DeptKpiSet {
  code: string;
  kpis: Record<string, number>;
  stateKpis: Record<string, number>; // state averages for comparison
}

interface DistrictDetailPanelProps {
  districtName: string;
  stateName: string;
  deptData: DeptKpiSet[];   // per-dept KPIs for this district
  deptMetas: any[];
  fundingDistrict?: any;    // estimated district funding
  onBack: () => void;
  onSelectDept?: (code: string) => void;
}

export function DistrictDetailPanel({
  districtName, stateName, deptData, deptMetas, fundingDistrict, onBack, onSelectDept,
}: DistrictDetailPanelProps) {
  return (
    <div className="flex flex-col h-full bg-surface-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-5 py-4 flex items-center gap-3">
          <button onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-semibold">
              Sub-Nodal ICCC · {stateName}
            </div>
            <div className="display text-2xl font-black text-slate-900 leading-tight">{districtName}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" style={{ boxShadow: "0 0 5px rgba(59,130,246,0.6)" }} />
              <span className="text-[11px] text-slate-500 font-medium">All department performance</span>
            </div>
          </div>
        </div>

        {/* Estimated UCF district funding */}
        {fundingDistrict && (
          <div className="px-5 pb-3 grid grid-cols-2 gap-2">
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              <div className="text-[9px] text-orange-600 uppercase tracking-wider font-bold">Central (est.)</div>
              <div className="fig text-[15px] font-black text-orange-700">₹{(fundingDistrict.central / 1000).toFixed(1)}k Cr</div>
              <div className="text-[9px] text-slate-500">{fundingDistrict.central_release_pct?.toFixed(0)}% released</div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <div className="text-[9px] text-green-700 uppercase tracking-wider font-bold">State (est.)</div>
              <div className="fig text-[15px] font-black text-green-800">₹{(fundingDistrict.state / 1000).toFixed(1)}k Cr</div>
              <div className="text-[9px] text-slate-500">{fundingDistrict.state_release_pct?.toFixed(0)}% released</div>
            </div>
          </div>
        )}
      </div>

      {/* Dept sections */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {deptMetas.map((meta: any) => {
          const deptEntry = deptData.find(d => d.code === meta.code);
          const conf = DEPT_REGISTRY.find(d => d.code === meta.code);
          const accent = conf?.accent ?? "#3B82F6";
          const Icon = ICONS[meta.icon] ?? LayoutGrid;

          // Compute dept score here so it can be used in the card's box-shadow
          const kpiMetasList = meta.kpis ?? [];
          const distKpisForGlow = deptEntry?.kpis ?? {};
          const stateKpisForGlow = deptEntry?.stateKpis ?? {};
          const gMin: Record<string, number> = {};
          const gMax: Record<string, number> = {};
          kpiMetasList.forEach((k: any) => {
            const sv = stateKpisForGlow[k.code];
            if (Number.isFinite(sv) && sv !== 0) { gMin[k.code] = sv * 0.7; gMax[k.code] = sv * 1.3; }
          });
          const deptScore = Object.keys(gMin).length
            ? computeScore(distKpisForGlow, gMin, gMax, kpiMetasList)
            : null;

          return (
            <button
              key={meta.code}
              onClick={() => onSelectDept?.(meta.code)}
              className="w-full text-left rounded-xl overflow-hidden bg-white border border-slate-100 transition hover:shadow-md"
              style={{ boxShadow: deptCardGlow(deptScore) ?? "0 1px 4px rgba(0,0,0,0.06)", borderTop: `3px solid ${accent}` }}
            >
              {/* Dept name row + index score */}
              {(() => {
                // Compute the dept index score for this district
                const kpiMetas = meta.kpis ?? [];
                const distKpis = deptEntry?.kpis ?? {};
                const stateKpis = deptEntry?.stateKpis ?? {};
                // Build a mini 1-region "all regions" map to compute global min/max
                // For scoring vs state, we treat state avg as the only comparator.
                // We use: globalMin = 0.9× stateVal, globalMax = 1.1× stateVal (±10% range)
                // This gives context: district vs state average.
                const gMin: Record<string, number> = {};
                const gMax: Record<string, number> = {};
                kpiMetas.forEach((k: any) => {
                  const sv = stateKpis[k.code];
                  if (Number.isFinite(sv) && sv !== 0) {
                    gMin[k.code] = sv * 0.7;
                    gMax[k.code] = sv * 1.3;
                  }
                });
                const score = Object.keys(gMin).length
                  ? computeScore(distKpis, gMin, gMax, kpiMetas)
                  : null;
                const grade = score != null ? scoreGrade(score) : null;
                return (
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                         style={{ background: `${accent}15` }}>
                      <Icon size={16} style={{ color: accent }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-bold text-slate-800">{meta.name}</div>
                      <div className="text-[10px] text-slate-400">{conf?.tagline}</div>
                    </div>
                    {grade && (
                      <div className="text-right shrink-0">
                        <div className="fig text-[17px] font-black" style={{ color: grade.color }}>{score}</div>
                        <div className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: grade.color, background: grade.bg }}>{grade.label}</div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* KPI comparison grid */}
              <div className="grid grid-cols-3 gap-0 divide-x divide-slate-100">
                {(meta.kpis ?? []).map((k: any) => {
                  const distVal  = deptEntry?.kpis?.[k.code];
                  const stateVal = deptEntry?.stateKpis?.[k.code];
                  const delta    = (distVal != null && stateVal != null) ? distVal - stateVal : null;
                  const better   = delta == null ? null
                    : (k.direction === "lower_is_better" ? delta < 0 : delta > 0);
                  const DirIcon  = better == null ? null
                    : (k.direction === "lower_is_better" ? TrendingDown : TrendingUp);

                  const cellGlow = kpiCellGlow(distVal ?? NaN, stateVal ?? NaN, k.direction);
                  return (
                    <div key={k.code} className="px-3 py-2.5 text-center rounded-lg transition-shadow"
                         style={cellGlow ? { boxShadow: cellGlow } : {}}>
                      <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">{k.short}</div>
                      <div className="fig text-[18px] font-black" style={{ color: Number.isFinite(distVal) ? (k.accent ?? accent) : "#CBD5E0" }}>
                        {Number.isFinite(distVal) ? distVal!.toFixed(1) : "—"}
                      </div>
                      <div className="text-[8px] text-slate-400 leading-none mb-1">{k.unit}</div>
                      {delta != null && (
                        <div className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
                             style={{ color: better ? "#15803D" : "#DC2626", background: better ? "#F0FDF4" : "#FEF2F2" }}>
                          {DirIcon && <DirIcon size={9} strokeWidth={3} />}
                          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}
                          <span className="text-[8px] opacity-60 ml-0.5">vs state</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
