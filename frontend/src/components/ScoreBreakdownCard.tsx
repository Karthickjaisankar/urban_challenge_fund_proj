/**
 * ScoreBreakdownCard — shows exactly how a dept Index Score was computed.
 *
 * Displays:
 *   - Composite score + grade
 *   - Formula text
 *   - Per-KPI bar: normalised score, raw value, national min/max context
 */
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import type { KpiBreakdown } from "@/lib/scoring";
import { scoreGrade } from "@/lib/scoring";

interface ScoreBreakdownCardProps {
  deptName: string;
  score: number;
  breakdown: KpiBreakdown[];
  scopeLabel?: string;   // e.g. "Tamil Nadu" or "Vellore, Tamil Nadu"
  comparedTo?: string;   // e.g. "All India" or "Tamil Nadu avg"
}

export function ScoreBreakdownCard({
  deptName, score, breakdown, scopeLabel, comparedTo = "All India",
}: ScoreBreakdownCardProps) {
  const grade = scoreGrade(score);

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-100"
         style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
           style={{ background: `${grade.bg}`, borderBottom: `2px solid ${grade.color}20` }}>
        <div className="flex items-center gap-2">
          <Info size={14} style={{ color: grade.color }} />
          <span className="text-[12px] font-bold text-slate-700">{deptName} Index Score</span>
          {scopeLabel && <span className="text-[10px] text-slate-400">· {scopeLabel}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="fig text-[22px] font-black" style={{ color: grade.color }}>{score}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: grade.color, background: grade.bg, border: `1px solid ${grade.color}30` }}>
            {grade.label}
          </span>
        </div>
      </div>

      {/* Formula explanation */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 leading-relaxed">
        <span className="font-bold text-slate-600">How it's calculated:</span>
        {" "}Each KPI is normalised to 0–100 relative to all states
        ({comparedTo} min → 0, max → 100; direction-aware).
        The {breakdown.length} KPI scores are then averaged equally.
        <span className="font-bold text-slate-600">
          {" "}Score = ({breakdown.map(b => b.kpiScore).join(" + ")}) ÷ {breakdown.length} = {score}
        </span>
      </div>

      {/* Per-KPI breakdown */}
      <div className="divide-y divide-slate-50">
        {breakdown.map((b) => {
          const DirIcon = b.direction === "lower_is_better" ? TrendingDown : TrendingUp;
          const kpiGrade = scoreGrade(b.kpiScore);
          const fmt = (v: number) => Number.isFinite(v) ? v.toFixed(1) : "—";
          return (
            <div key={b.code} className="px-4 py-3">
              {/* KPI name + score */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: b.accent ?? kpiGrade.color }} />
                  <span className="text-[12px] font-semibold text-slate-700">{b.name}</span>
                  <span className="text-[10px] text-slate-400">({b.unit})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="fig text-[14px] font-black" style={{ color: b.accent ?? kpiGrade.color }}>
                    {b.kpiScore}/100
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div className="h-full rounded-full transition-all"
                     style={{ width: `${b.kpiScore}%`, background: b.accent ?? kpiGrade.color }} />
              </div>

              {/* Raw value + range context */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <DirIcon size={10} style={{ color: b.accent }} />
                  <span className="font-bold text-slate-600">{fmt(b.stateValue)}</span>
                  <span>{b.unit}</span>
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">
                  {comparedTo} range: <span className="font-semibold text-slate-500">{fmt(b.nationalMin)}</span>
                  {" → "}
                  <span className="font-semibold text-slate-500">{fmt(b.nationalMax)}</span>
                  {" "}{b.unit}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-400">
                  {b.direction === "lower_is_better" ? "↓ lower = better" : "↑ higher = better"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
