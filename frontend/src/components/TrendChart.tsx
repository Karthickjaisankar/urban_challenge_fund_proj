import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import type { HistorySeries } from "@/lib/types";

interface TrendChartProps {
  data: HistorySeries;
  metric: "imr" | "mmr" | "oope";
  label: string;
  unit: string;
  accent: string;
  /** show last-month value highlight */
  highlightLast?: boolean;
}

export function TrendChart({ data, metric, label, unit, accent, highlightLast = true }: TrendChartProps) {
  const rows = data.months.map((m, i) => ({ month: m, value: data.series[metric][i] }));
  const id = `grad-${metric}-${accent.replace("#", "")}`;
  const last = rows[rows.length - 1]?.value;
  const first = rows[0]?.value;
  const trend = last != null && first != null && first !== 0 ? ((last - first) / first) * 100 : 0;

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink2-400 font-semibold">{label} · 24-month trend</div>
          <div className="text-[10px] text-ink2-400 font-mono">{unit}</div>
        </div>
        <div className="text-right">
          <div className="fig display text-2xl font-bold" style={{ color: accent }}>{last?.toFixed(1)}</div>
          <div className={`text-[10px] font-mono ${trend < 0 ? "text-emerald2-600" : "text-ruby-600"}`} style={{ color: trend < 0 ? "#128807" : "#b81d24" }}>
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}% vs 24mo ago
          </div>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 6, right: 6, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor={accent} stopOpacity={0.32} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(15,23,42,0.06)" />
            <XAxis
              dataKey="month" tickLine={false} axisLine={false}
              tick={{ fill: "rgba(58,56,47,0.55)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              interval={3}
            />
            <YAxis
              tickLine={false} axisLine={false}
              tick={{ fill: "rgba(58,56,47,0.55)", fontSize: 10, fontFamily: "JetBrains Mono" }}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid rgba(15,23,42,0.16)",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "Manrope",
                boxShadow: "0 8px 24px -12px rgba(0,0,0,0.2)",
              }}
              labelStyle={{ color: "rgba(58,56,47,0.7)", fontWeight: 600 }}
              itemStyle={{ color: accent, fontWeight: 600 }}
              formatter={(v: number) => [v, label]}
            />
            <Area type="monotone" dataKey="value" stroke={accent} strokeWidth={2.2} fill={`url(#${id})`} />
            {highlightLast && last != null && (
              <ReferenceLine y={last} stroke={accent} strokeDasharray="3 3" strokeOpacity={0.4} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
