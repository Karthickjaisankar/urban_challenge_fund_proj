/**
 * Right panel — STATE view.
 * Shows all districts of the selected state ranked best → worst.
 * Department filter from the left sidebar controls which KPI ranks them.
 * Clicking a district → opens DistrictDetailPanel.
 */
import { X, ChevronRight, Filter } from "lucide-react";
import { DEPT_REGISTRY } from "@/lib/constants";
import { scoreGrade } from "@/lib/scoring";

interface RankRow {
  district: string;
  value: number;
  score: number; // 0-100 normalised, 100=best
}

interface StateDistrictPanelProps {
  stateName: string;
  rows: RankRow[];          // pre-computed district ranking
  filterDept: string | null;
  filterKpi: string | null; // which KPI is driving the rank
  filterKpiUnit: string;
  deptMetas: any[];
  fundingState: any;        // state-level UCF funding
  onClose: () => void;
  onSelectDistrict: (name: string) => void;
  onChangeDeptFilter: (code: string | null) => void;
  selectedDistrict?: string | null;
  scores?: Record<string, number>;
}

export function StateDistrictPanel({
  stateName, rows, filterDept, filterKpi, filterKpiUnit,
  deptMetas, fundingState,
  onClose, onSelectDistrict, onChangeDeptFilter, selectedDistrict,
  scores = {},
}: StateDistrictPanelProps) {
  const activeConf = DEPT_REGISTRY.find(d => d.code === filterDept);

  return (
    <div className="flex flex-col h-full bg-surface-100">
      {/* Header */}
      <div className="px-5 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-semibold mb-1">
              Nodal ICCC · State view
            </div>
            <div className="display text-2xl font-black text-slate-900 leading-tight">{stateName}</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" style={{ boxShadow: "0 0 5px rgba(255,215,0,0.7)" }} />
              <span className="text-[11px] text-slate-500 font-medium">{rows.length} districts · sub-nodal ICCCs</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* UCF fund summary for the state */}
        {fundingState && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "UCF Allocated", val: `₹${((fundingState.total_allocated)/1000).toFixed(1)}k Cr`, color: "text-slate-700" },
              { label: "Central (60%)", val: `${fundingState.central_release_pct?.toFixed(0)}% out`, color: "text-orange-600" },
              { label: "State (40%)",   val: `${fundingState.state_release_pct?.toFixed(0)}% out`,   color: "text-green-700" },
            ].map(({ label, val, color }) => (
              <div key={label} className="bg-slate-50 rounded-lg px-2 py-1.5 text-center border border-slate-100">
                <div className={`fig text-[13px] font-black ${color}`}>{val}</div>
                <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dept filter pills */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">
          <Filter size={10} /> Rank districts by
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onChangeDeptFilter(null)}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition border"
            style={!filterDept
              ? { background: "#1E3A5F", color: "#fff", borderColor: "#1E3A5F" }
              : { background: "#F8FAFC", color: "#64748B", borderColor: "#E2E8F0" }}
          >
            Overall
          </button>
          {DEPT_REGISTRY.map(d => (
            <button
              key={d.code}
              onClick={() => onChangeDeptFilter(d.code)}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition border"
              style={filterDept === d.code
                ? { background: d.accent, color: "#fff", borderColor: d.accent }
                : { background: "#F8FAFC", color: "#64748B", borderColor: "#E2E8F0" }}
            >
              {d.name.split(" ")[0]}
            </button>
          ))}
        </div>
        {filterDept && filterKpi && (
          <div className="mt-1.5 text-[10px] font-mono text-slate-400">
            Ranking by <span style={{ color: activeConf?.accent }} className="font-bold">{filterKpi}</span>
            {filterKpiUnit && <span> · {filterKpiUnit}</span>}
          </div>
        )}
      </div>

      {/* District ranking list */}
      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-sm">Loading district data…</div>
        )}
        {rows.map((r, i) => {
          const isSelected = r.district === selectedDistrict;
          const isTop    = i < 3;
          const isBottom = i >= rows.length - 3;
          const mapScore = scores[r.district];
          const displayScore = Number.isFinite(mapScore) ? mapScore : r.score;
          const barPct   = displayScore;
          const barColor = barPct >= 65 ? "#16A34A" : barPct >= 35 ? "#D97706" : "#DC2626";
          const grade    = Number.isFinite(mapScore) ? scoreGrade(mapScore) : null;

          return (
            <button
              key={r.district}
              onClick={() => onSelectDistrict(r.district)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-slate-100 transition ${
                isSelected ? "bg-blue-50" : "hover:bg-slate-50"
              }`}
            >
              {/* Rank pill */}
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black shrink-0"
                style={isTop
                  ? { background: "#16A34A", color: "#fff" }
                  : isBottom
                    ? { background: "#DC2626", color: "#fff" }
                    : { background: "#F1F5F9", color: "#475569" }}
              >
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-bold leading-tight ${isSelected ? "text-blue-700" : "text-slate-800"}`}>
                  {r.district}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${barPct}%`, background: barColor }} />
                  </div>
                  <span className="fig text-[10px] font-bold text-slate-500 shrink-0">{barPct.toFixed(0)}/100</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                {grade ? (
                  <>
                    <div className="fig text-[15px] font-black" style={{ color: grade.color }}>{displayScore.toFixed(0)}</div>
                    <div className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: grade.color, background: grade.bg }}>{grade.label}</div>
                  </>
                ) : (
                  <>
                    <div className="fig text-[15px] font-black text-slate-700">
                      {Number.isFinite(r.value) ? r.value.toFixed(1) : "—"}
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono">{filterKpiUnit || "score"}</div>
                  </>
                )}
              </div>

              <ChevronRight size={14} className="text-slate-300 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
