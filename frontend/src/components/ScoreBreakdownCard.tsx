/**
 * ScoreBreakdownCard — transparent score explanation with visual comparison.
 *
 * Each KPI row shows:
 *  ① Normalised score bar (0–100)
 *  ② A RANGE BAR with three markers:
 *       [min ─────── benchmark▼ ────── this value ● ─── max]
 *     coloured green if better than benchmark, red if worse
 *  ③ Delta vs benchmark chip: "+18.4 above India avg"
 */
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import type { KpiBreakdown } from "@/lib/scoring";
import { scoreGrade } from "@/lib/scoring";

interface ScoreBreakdownCardProps {
  deptName: string;
  score: number;
  breakdown: KpiBreakdown[];
  scopeLabel?: string;
  /** Benchmark KPI values (national avg for states, state avg for districts) */
  benchmarkKpis?: Record<string, number>;
  benchmarkLabel?: string; // "India avg" | "TN avg" etc.
}

function pct(value: number, min: number, max: number): number {
  if (max === min) return 50;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function ScoreBreakdownCard({
  deptName, score, breakdown, scopeLabel,
  benchmarkKpis = {}, benchmarkLabel = "India avg",
}: ScoreBreakdownCardProps) {
  const grade = scoreGrade(score);

  return (
    <div className="rounded-xl overflow-hidden bg-white border border-slate-100"
         style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between"
           style={{ background: grade.bg, borderBottom: `2px solid ${grade.color}25` }}>
        <div className="flex items-center gap-2">
          <Info size={13} style={{ color: grade.color }} />
          <span className="text-[12px] font-bold text-slate-700">{deptName} Index Score</span>
          {scopeLabel && <span className="text-[10px] text-slate-400 font-mono">· {scopeLabel}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="fig text-[24px] font-black leading-none" style={{ color: grade.color }}>{score}</span>
          <div>
            <div className="text-[9px] text-slate-400 font-mono leading-none">/ 100</div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: grade.color, background: `${grade.color}18` }}>{grade.label}</span>
          </div>
        </div>
      </div>

      {/* Formula pill */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-600">Formula:</span>
          {" "}Each KPI normalised to 0–100 vs all states (100 = best).
          Score = {breakdown.map(b => b.kpiScore).join(" + ")} ÷ {breakdown.length} = <span className="font-bold text-slate-700">{score}</span>
        </p>
      </div>

      {/* Per-KPI rows */}
      <div className="divide-y divide-slate-50">
        {breakdown.map((b) => {
          const benchmark = benchmarkKpis[b.code];
          const hasBenchmark = Number.isFinite(benchmark);

          const valuePct     = pct(b.stateValue, b.nationalMin, b.nationalMax);
          const benchmarkPct = hasBenchmark ? pct(benchmark, b.nationalMin, b.nationalMax) : 50;

          // Is this value better than benchmark?
          const betterThanBenchmark = hasBenchmark
            ? (b.direction === "lower_is_better"
                ? b.stateValue < benchmark
                : b.stateValue > benchmark)
            : null;

          const delta = hasBenchmark ? b.stateValue - benchmark : null;
          const absDelta = delta != null ? Math.abs(delta) : null;

          const barColor = betterThanBenchmark === true ? "#16A34A"
            : betterThanBenchmark === false ? "#DC2626"
            : b.accent ?? "#3B82F6";

          const scoreColor = b.accent ?? (
            b.kpiScore >= 65 ? "#16A34A"
            : b.kpiScore >= 35 ? "#D97706"
            : "#DC2626"
          );

          const fmt = (v: number, dec = 1) => Number.isFinite(v) ? v.toFixed(dec) : "—";
          const DirIcon = b.direction === "lower_is_better" ? TrendingDown : TrendingUp;

          // Left/right positions for the coloured gap between benchmark and value
          const gapLeft  = Math.min(valuePct, benchmarkPct);
          const gapWidth = Math.abs(valuePct - benchmarkPct);

          return (
            <div key={b.code} className="px-4 py-3.5">
              {/* Row 1: KPI name + KPI score */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: b.accent ?? scoreColor }} />
                  <span className="text-[12px] font-semibold text-slate-800">{b.name}</span>
                  <span className="text-[10px] text-slate-400">({b.unit})</span>
                </div>
                <span className="fig text-[15px] font-black" style={{ color: scoreColor }}>{b.kpiScore}/100</span>
              </div>

              {/* Row 2: Range bar with benchmark marker + value dot */}
              <div className="relative mb-2.5">
                {/* Full range track */}
                <div className="h-2.5 bg-slate-100 rounded-full overflow-visible relative">
                  {/* Coloured gap between benchmark and value */}
                  {hasBenchmark && (
                    <div className="absolute top-0 h-full rounded-full"
                         style={{
                           left: `${gapLeft}%`, width: `${gapWidth}%`,
                           background: `${barColor}30`,
                         }} />
                  )}
                  {/* Value fill from left */}
                  <div className="h-full rounded-full"
                       style={{ width: `${valuePct}%`, background: barColor, opacity: 0.85 }} />

                  {/* Benchmark marker (triangle pointer below the bar) */}
                  {hasBenchmark && (
                    <div className="absolute top-0 flex flex-col items-center"
                         style={{ left: `${benchmarkPct}%`, transform: "translateX(-50%)" }}>
                      <div className="w-0.5 h-2.5 bg-slate-500 opacity-60" />
                    </div>
                  )}
                </div>

                {/* Value + benchmark labels below bar */}
                <div className="flex justify-between mt-1 text-[9.5px] font-mono text-slate-400 relative">
                  <span>{fmt(b.nationalMin)} {b.unit}</span>
                  {hasBenchmark && (
                    <span className="absolute font-semibold text-slate-500"
                          style={{ left: `${benchmarkPct}%`, transform: "translateX(-50%)" }}>
                      ▲{fmt(benchmark)} {b.unit}<br/>
                      <span className="text-[8.5px] text-slate-400 font-normal">{benchmarkLabel}</span>
                    </span>
                  )}
                  <span>{fmt(b.nationalMax)} {b.unit}</span>
                </div>
              </div>

              {/* Row 3: Value + delta vs benchmark */}
              <div className="flex items-center gap-3 flex-wrap mt-3">
                {/* This region's value */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                  <DirIcon size={11} style={{ color: b.accent ?? scoreColor }} />
                  <span className="fig text-[13px] font-black text-slate-800">{fmt(b.stateValue)}</span>
                  <span className="text-[9px] text-slate-400">{b.unit}</span>
                </div>

                {/* Delta vs benchmark */}
                {delta != null && absDelta != null && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border"
                       style={{ background: betterThanBenchmark ? "#F0FDF4" : "#FEF2F2",
                                borderColor: betterThanBenchmark ? "#BBF7D0" : "#FECACA" }}>
                    <span className="text-[11px] font-black"
                          style={{ color: betterThanBenchmark ? "#15803D" : "#DC2626" }}>
                      {betterThanBenchmark ? "+" : "−"}{fmt(absDelta)}
                    </span>
                    <span className="text-[10px] font-medium"
                          style={{ color: betterThanBenchmark ? "#16A34A" : "#DC2626" }}>
                      {betterThanBenchmark ? "better" : "worse"} than {benchmarkLabel}
                    </span>
                  </div>
                )}

                <span className="text-[9.5px] text-slate-400 ml-auto">
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
