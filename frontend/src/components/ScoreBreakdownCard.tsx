/**
 * ScoreBreakdownCard — transparent score explanation with clear visual hierarchy:
 *
 *   1. ACTUAL VALUE (hero, very large) — "12.9 per 1,000 live births"
 *   2. Comparison chip — "+13.1 better than India avg (26.0)"
 *   3. Range bar — shows position between national min and max
 *   4. Normalised score — secondary, top-right corner
 *
 * Collapsed by default so district rankings stay visible.
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

function fmtVal(v: number, unit: string): string {
  if (!Number.isFinite(v)) return "—";
  // TFR, rates, percentages
  if (Math.abs(v) < 10) return v.toFixed(1);
  if (Math.abs(v) < 100) return v.toFixed(0);
  return Math.round(v).toLocaleString("en-IN");
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

      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition"
        style={{ background: grade.bg }}
      >
        <div className="text-left">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            {deptName} Index Score · {scopeLabel}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="fig text-[24px] font-black leading-none" style={{ color: grade.color }}>{score}</span>
            <span className="text-[11px] text-slate-400 font-mono">/100</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded"
                  style={{ color: grade.color, background: `${grade.color}18` }}>{grade.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold shrink-0 ml-3">
          {expanded ? <><ChevronUp size={14}/> Hide</> : <><ChevronDown size={14}/> How calculated?</>}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <>
          {/* Formula line */}
          <div className="px-4 py-2 bg-slate-50 border-y border-slate-100">
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Formula:</span>
              {" "}Each KPI normalised 0–100 vs all states (100 = best in country).
              {" "}Score = {breakdown.map(b => `${b.kpiScore}`).join(" + ")} ÷ {breakdown.length} = <span className="font-black text-slate-800">{score}</span>
            </p>
          </div>

          {/* Per-KPI breakdown */}
          <div className="divide-y divide-slate-50">
            {breakdown.map((b) => {
              const benchmark    = benchmarkKpis[b.code];
              const hasBenchmark = Number.isFinite(benchmark);
              const valuePct     = pct(b.stateValue, b.nationalMin, b.nationalMax);
              const benchmarkPct = hasBenchmark ? pct(benchmark, b.nationalMin, b.nationalMax) : -1;
              const betterThan   = hasBenchmark
                ? (b.direction === "lower_is_better" ? b.stateValue < benchmark : b.stateValue > benchmark)
                : null;
              const delta        = hasBenchmark ? Math.abs(b.stateValue - benchmark) : null;
              const barColor     = betterThan === true  ? "#16A34A"
                                 : betterThan === false ? "#DC2626"
                                 : (b.accent ?? "#3B82F6");
              const DirIcon      = b.direction === "lower_is_better" ? TrendingDown : TrendingUp;
              const fmt          = (v: number) => fmtVal(v, b.unit);

              return (
                <div key={b.code} className="px-4 pt-3.5 pb-3">
                  {/* KPI name + normalised score (secondary) */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.accent ?? barColor }} />
                      <span className="text-[12px] font-semibold text-slate-700 truncate">{b.name}</span>
                    </div>
                    <span className="text-[12px] font-bold shrink-0 ml-2 text-slate-400">
                      {b.kpiScore}/100
                    </span>
                  </div>

                  {/* ── HERO: actual value ── */}
                  <div className="flex items-end gap-3 mb-2.5">
                    <div>
                      <div className="fig text-[38px] font-black leading-none"
                           style={{ color: b.accent ?? barColor }}>
                        {fmt(b.stateValue)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{b.unit}</div>
                    </div>

                    {/* Comparison chip — right next to the value */}
                    <div className="mb-1 flex-1 min-w-0">
                      {betterThan != null && delta != null ? (
                        <div className="inline-flex flex-wrap items-center gap-1 px-2.5 py-1.5 rounded-lg border"
                             style={{ background: betterThan ? "#F0FDF4" : "#FEF2F2",
                                      borderColor: betterThan ? "#BBF7D0" : "#FECACA" }}>
                          <DirIcon size={13} strokeWidth={3}
                                   style={{ color: betterThan ? "#15803D" : "#DC2626" }} />
                          <span className="fig text-[14px] font-black"
                                style={{ color: betterThan ? "#15803D" : "#DC2626" }}>
                            {betterThan ? "+" : "−"}{fmt(delta)}
                          </span>
                          <span className="text-[11px] font-medium leading-tight"
                                style={{ color: betterThan ? "#16A34A" : "#DC2626" }}>
                            {betterThan ? "better" : "worse"}<br/>
                            than {benchmarkLabel}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">
                          {b.direction === "lower_is_better" ? "↓ lower = better" : "↑ higher = better"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Range bar */}
                  <div className="relative mb-1.5">
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                      <div className="h-full rounded-full"
                           style={{ width: `${valuePct}%`, background: barColor, opacity: 0.82 }} />
                      {hasBenchmark && benchmarkPct >= 0 && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500 opacity-60"
                             style={{ left: `${benchmarkPct}%` }} />
                      )}
                    </div>
                  </div>

                  {/* Min / benchmark / max labels */}
                  <div className="flex items-end justify-between text-[9px] font-mono text-slate-400">
                    <span>{fmt(b.nationalMin)}</span>
                    {hasBenchmark && (
                      <span className="text-center text-slate-500 font-semibold">
                        ▲{fmt(benchmark)}<br/>
                        <span className="font-normal text-slate-400">{benchmarkLabel}</span>
                      </span>
                    )}
                    <span>{fmt(b.nationalMax)}</span>
                  </div>

                  {/* Direction note */}
                  <div className="text-[9.5px] text-slate-400 text-right mt-1">
                    {b.direction === "lower_is_better" ? "↓ lower = better" : "↑ higher = better"}
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
