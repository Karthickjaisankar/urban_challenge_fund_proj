/**
 * ScoreBreakdownCard — collapsible by default so district rankings stay visible.
 * Collapsed: shows score + grade + expand toggle.
 * Expanded: shows per-KPI range bars with benchmark comparison.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, TrendingDown, TrendingUp } from "lucide-react";
import type { KpiBreakdown } from "@/lib/scoring";
import { scoreGrade } from "@/lib/scoring";

interface ScoreBreakdownCardProps {
  deptName: string;
  score: number;
  breakdown: KpiBreakdown[];
  scopeLabel?: string;
  benchmarkKpis?: Record<string, number>;
  benchmarkLabel?: string;
}

function pct(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function ScoreBreakdownCard({
  deptName, score, breakdown, scopeLabel,
  benchmarkKpis = {}, benchmarkLabel = "India avg",
}: ScoreBreakdownCardProps) {
  const [expanded, setExpanded] = useState(false);
  const grade = scoreGrade(score);

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-200"
         style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>

      {/* Always-visible header — click to expand/collapse */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition"
        style={{ background: grade.bg, borderBottom: expanded ? `1px solid ${grade.color}20` : "none" }}
      >
        <div className="flex items-center gap-2 text-left">
          <div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{deptName} Index Score · {scopeLabel}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="fig text-[22px] font-black leading-none" style={{ color: grade.color }}>{score}</span>
              <span className="text-[11px] text-slate-400 font-mono">/100</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded"
                    style={{ color: grade.color, background: `${grade.color}18` }}>{grade.label}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold shrink-0 ml-2">
          {expanded ? <><ChevronUp size={14}/> Hide</> : <><ChevronDown size={14}/> How calculated?</>}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Formula */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Formula:</span>
              {" "}Each KPI normalised 0–100 vs all states (100 = best).
              {" "}Score = {breakdown.map(b => b.kpiScore).join(" + ")} ÷ {breakdown.length} = <span className="font-bold text-slate-800">{score}</span>
            </p>
          </div>

          {/* Per-KPI rows */}
          <div className="divide-y divide-slate-50">
            {breakdown.map((b) => {
              const benchmark     = benchmarkKpis[b.code];
              const hasBenchmark  = Number.isFinite(benchmark);
              const valuePct      = pct(b.stateValue, b.nationalMin, b.nationalMax);
              const benchmarkPct  = hasBenchmark ? pct(benchmark, b.nationalMin, b.nationalMax) : -1;
              const betterThan    = hasBenchmark
                ? (b.direction === "lower_is_better" ? b.stateValue < benchmark : b.stateValue > benchmark)
                : null;
              const delta         = hasBenchmark ? Math.abs(b.stateValue - benchmark) : null;
              const barColor      = betterThan === true ? "#16A34A" : betterThan === false ? "#DC2626" : (b.accent ?? "#3B82F6");
              const DirIcon       = b.direction === "lower_is_better" ? TrendingDown : TrendingUp;
              const fmt           = (v: number) => Number.isFinite(v) ? v.toFixed(1) : "—";

              return (
                <div key={b.code} className="px-4 py-3">
                  {/* KPI name + normalised score */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.accent ?? barColor }} />
                      <span className="text-[12px] font-semibold text-slate-800 truncate">{b.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({b.unit})</span>
                    </div>
                    <span className="fig text-[14px] font-black shrink-0 ml-2" style={{ color: b.accent ?? barColor }}>
                      {b.kpiScore}/100
                    </span>
                  </div>

                  {/* Range bar — min…benchmark…value…max */}
                  <div className="relative mb-1">
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden relative">
                      {/* Value fill */}
                      <div className="h-full rounded-full"
                           style={{ width: `${valuePct}%`, background: barColor, opacity: 0.80 }} />
                      {/* Benchmark line */}
                      {hasBenchmark && benchmarkPct >= 0 && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-600"
                             style={{ left: `${benchmarkPct}%`, opacity: 0.7 }} />
                      )}
                    </div>
                  </div>

                  {/* Labels row: min · [benchmark] · value · max */}
                  <div className="flex items-end justify-between text-[9px] font-mono text-slate-400 mb-2.5">
                    <span className="shrink-0">{fmt(b.nationalMin)}</span>
                    {hasBenchmark && (
                      <span className="text-center text-slate-500 font-semibold px-1 shrink-0">
                        ▲{fmt(benchmark)}<br/>
                        <span className="font-normal text-slate-400">{benchmarkLabel}</span>
                      </span>
                    )}
                    <span className="shrink-0">{fmt(b.nationalMax)}</span>
                  </div>

                  {/* Value + delta chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200">
                      <DirIcon size={10} style={{ color: b.accent ?? barColor }} />
                      <span className="fig text-[12px] font-black text-slate-800">{fmt(b.stateValue)}</span>
                      <span className="text-[9px] text-slate-400">{b.unit}</span>
                    </div>
                    {betterThan != null && delta != null && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg border"
                           style={{ background: betterThan ? "#F0FDF4" : "#FEF2F2",
                                    borderColor: betterThan ? "#BBF7D0" : "#FECACA" }}>
                        <span className="text-[11px] font-black"
                              style={{ color: betterThan ? "#15803D" : "#DC2626" }}>
                          {betterThan ? "+" : "−"}{fmt(delta)}
                        </span>
                        <span className="text-[10px]"
                              style={{ color: betterThan ? "#16A34A" : "#DC2626" }}>
                          {betterThan ? "better" : "worse"} than {benchmarkLabel}
                        </span>
                      </div>
                    )}
                    <span className="text-[9px] text-slate-400 ml-auto">
                      {b.direction === "lower_is_better" ? "↓ lower = better" : "↑ higher = better"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
