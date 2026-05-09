import { useMemo, useState } from "react";
import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, CartesianGrid, ZAxis, ReferenceLine, Cell } from "recharts";
import { Compass } from "lucide-react";

export interface ScatterRow {
  region: string;
  fundingPerCapita: number;        // ₹ per capita (Central+State Health spend)
  performanceScore: number;        // composite (lower is better) — we invert for display
  population_m: number;
  selected?: boolean;
  quadrant: "efficient" | "inefficient" | "high-fund-good" | "low-fund-bad";
}

interface Props {
  rows: ScatterRow[];
  onSelect?: (region: string) => void;
  selected?: string | null;
  /** Label for the X axis — changes between "state" and "district" view */
  xLabel?: string;
  /** Scope label shown in the subtitle (e.g. "All India · states" or "Tamil Nadu · districts") */
  scopeLabel?: string;
}

const QUADRANT_COLOR: Record<ScatterRow["quadrant"], string> = {
  "efficient":      "#128807",   // low fund + good outcomes (green hero)
  "high-fund-good": "#0c4ca3",   // high fund + good outcomes (working)
  "inefficient":    "#b81d24",   // high fund + bad outcomes (red flag)
  "low-fund-bad":   "#ff7722",   // low fund + bad outcomes (need help)
};

const QUADRANT_LABEL: Record<ScatterRow["quadrant"], string> = {
  "efficient":      "Efficient",
  "high-fund-good": "Working",
  "inefficient":    "Inefficient",
  "low-fund-bad":   "Underserved",
};

export function FundingPerformanceScatter({ rows, onSelect, selected, xLabel = "Per-capita spend (₹)", scopeLabel }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const xMid = useMemo(() => {
    const xs = rows.map(r => r.fundingPerCapita).sort((a, b) => a - b);
    return xs[Math.floor(xs.length / 2)] ?? 0;
  }, [rows]);
  const yMid = useMemo(() => {
    const ys = rows.map(r => r.performanceScore).sort((a, b) => a - b);
    return ys[Math.floor(ys.length / 2)] ?? 0;
  }, [rows]);

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="section-label text-ashoka-500 mb-1.5">
            <Compass size={13} className="-ml-1" />
            <span>Funding × Performance · diagnostic</span>
            {scopeLabel && <span className="ml-2 text-[10px] text-ink2-400 font-mono normal-case tracking-normal">{scopeLabel}</span>}
          </div>
          {/* Methodology explanation — so officials know exactly what the axes mean */}
          <div className="bg-ashoka-50 border border-ashoka-100 rounded-lg p-3 text-[11px] text-ink2-700 leading-relaxed max-w-[640px]">
            <span className="font-bold text-ashoka-700">How it's computed:</span>
            {" "}Each dot is a {scopeLabel?.includes("district") ? "district" : "state"}.
            {scopeLabel?.includes("district") ? (
              <>
                {" "}<span className="font-semibold">X-axis:</span> Primary KPI value for the selected metric — districts are spread by how they perform on this specific indicator.
                {" "}<span className="font-semibold">Y-axis (Composite Score 0–100):</span> all 3 department KPIs are normalised and averaged — a holistic outcome score.
                {" "}<span className="font-semibold">Quadrant line:</span> state median of both axes.
                {" "}Reading: top-left = good primary KPI + good composite (high performer); bottom-right = poor primary KPI + poor composite (most in need).
              </>
            ) : (
              <>
                {" "}<span className="font-semibold">X-axis:</span> {xLabel} — total Centre + State allocation (FY 26-27) ÷ population.
                {" "}<span className="font-semibold">Y-axis (Outcome Score 0–100):</span> each KPI normalised to 0–100 (direction-aware), then averaged.
                {" "}<span className="font-semibold">Quadrant line:</span> national median of both axes.
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-semibold shrink-0">
          {(["efficient", "high-fund-good", "inefficient", "low-fund-bad"] as const).map((q) => (
            <span key={q} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-ink2-200/40 bg-cream-50">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: QUADRANT_COLOR[q] }} />
              <span className="text-ink2-700">{QUADRANT_LABEL[q]}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(15,23,42,0.06)" />
            <XAxis
              type="number" dataKey="fundingPerCapita"
              tick={{ fill: "rgba(58,56,47,0.55)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickLine={false} axisLine={false}
              tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`}
              label={{ value: xLabel, position: "insideBottomRight", offset: -2, fill: "rgba(58,56,47,0.6)", fontSize: 10 }}
            />
            <YAxis
              type="number" dataKey="performanceScore"
              tick={{ fill: "rgba(58,56,47,0.55)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickLine={false} axisLine={false}
              label={{ value: "Outcome score", angle: -90, position: "insideLeft", fill: "rgba(58,56,47,0.6)", fontSize: 10 }}
            />
            <ZAxis type="number" dataKey="population_m" range={[40, 320]} />
            <ReferenceLine x={xMid} stroke="rgba(15,23,42,0.18)" strokeDasharray="3 3" />
            <ReferenceLine y={yMid} stroke="rgba(15,23,42,0.18)" strokeDasharray="3 3" />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#ffffff", border: "1px solid rgba(15,23,42,0.16)",
                borderRadius: 8, fontSize: 12, fontFamily: "Manrope",
                boxShadow: "0 8px 24px -12px rgba(0,0,0,0.2)",
              }}
              formatter={(_v: any, _n: any, p: any) => {
                const r: ScatterRow = p.payload;
                return [
                  `${r.region} · ${QUADRANT_LABEL[r.quadrant]}`,
                  `₹${r.fundingPerCapita.toLocaleString("en-IN")} per capita | score ${r.performanceScore.toFixed(1)} | ${r.population_m.toFixed(1)} M people`,
                ];
              }}
              labelFormatter={() => ""}
            />
            <Scatter
              data={rows}
              onClick={(p: any) => onSelect?.(p?.region)}
              onMouseOver={(p: any) => setHover(p?.region ?? null)}
              onMouseOut={() => setHover(null)}
            >
              {rows.map((r) => (
                <Cell
                  key={r.region}
                  fill={QUADRANT_COLOR[r.quadrant]}
                  fillOpacity={r.region === selected ? 1 : r.region === hover ? 0.95 : 0.78}
                  stroke={r.region === selected ? "#0c4ca3" : "white"}
                  strokeWidth={r.region === selected ? 2.5 : 1}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3 text-[11px]">
        {(["efficient", "low-fund-bad", "inefficient", "high-fund-good"] as const).map((q) => {
          const list = rows.filter(r => r.quadrant === q).slice(0, 3);
          return (
            <div key={q} className="rounded-md border border-ink2-200/40 p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ background: QUADRANT_COLOR[q] }} />
                <span className="font-bold text-[10px] uppercase tracking-wider" style={{ color: QUADRANT_COLOR[q] }}>{QUADRANT_LABEL[q]}</span>
              </div>
              <div className="text-ink2-700 leading-tight">
                {list.length > 0
                  ? list.map(r => r.region).join(" · ")
                  : <span className="text-ink2-400">none</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compute scatter rows from snapshot + funding data.
 * Composite outcome score uses the 3 KPIs equally weighted, normalized to 0–100
 * where 100 = best in country.
 */
export function computeScatterRows(
  states: Record<string, { kpis: { imr: number; mmr: number; oope: number } }>,
  funding: Record<string, { total_allocated: number }>,
  population: Record<string, number>,
  selected: string | null,
): ScatterRow[] {
  const names = Object.keys(states).filter(s => funding[s] && population[s]);

  // Min/max per KPI for normalization (lower is better → invert)
  const imrs = names.map(n => states[n].kpis.imr);
  const mmrs = names.map(n => states[n].kpis.mmr);
  const oops = names.map(n => states[n].kpis.oope);
  const norm = (v: number, vs: number[]) => {
    const min = Math.min(...vs), max = Math.max(...vs);
    if (max === min) return 50;
    return (1 - (v - min) / (max - min)) * 100;  // best → 100
  };

  const rows = names.map((n) => {
    const score = (norm(states[n].kpis.imr, imrs) + norm(states[n].kpis.mmr, mmrs) + norm(states[n].kpis.oope, oops)) / 3;
    const popMillion = population[n];
    // total_allocated is ₹ Cr; convert to ₹ per capita (population in millions → people = pop*1e6, ₹ = cr*1e7 → ₹/person = cr*10/pop_m)
    const fundingPerCapita = Math.round((funding[n].total_allocated * 10) / popMillion);
    return { region: n, performanceScore: score, fundingPerCapita, population_m: popMillion, selected: n === selected, quadrant: "efficient" as ScatterRow["quadrant"] };
  });
  // Quadrant assignment vs medians
  const xs = rows.map(r => r.fundingPerCapita).sort((a, b) => a - b);
  const ys = rows.map(r => r.performanceScore).sort((a, b) => a - b);
  const xMid = xs[Math.floor(xs.length / 2)] ?? 0;
  const yMid = ys[Math.floor(ys.length / 2)] ?? 0;
  rows.forEach((r) => {
    const goodOutcome = r.performanceScore >= yMid;
    const highFund = r.fundingPerCapita >= xMid;
    r.quadrant = goodOutcome
      ? (highFund ? "high-fund-good" : "efficient")
      : (highFund ? "inefficient" : "low-fund-bad");
  });
  return rows;
}
