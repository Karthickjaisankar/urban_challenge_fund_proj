import { TrendingDown, TrendingUp, AlertTriangle, Activity } from "lucide-react";
import type { AnomalyEvent } from "@/lib/types";

interface KpiSpec {
  code: string;
  label: string;
  accent: string;
  direction: "lower_is_better" | "higher_is_better";
}

interface AnomalyStripProps {
  events: AnomalyEvent[];
  kpis: KpiSpec[];
  selected?: string | null;
  onSelect?: (region: string) => void;
}

/**
 * Compact horizontal anomaly feed — one column per KPI of the active department.
 * Each column splits into "Worsening" and "Improving" based on the KPI's direction.
 */
export function AnomalyStrip({ events, kpis, selected, onSelect }: AnomalyStripProps) {
  const Pill = ({ e }: { e: AnomalyEvent }) => {
    const sel = e.region === selected;
    return (
      <button
        onClick={() => onSelect?.(e.region)}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md border-2 transition text-left w-full ${
          sel
            ? "border-ashoka-500 bg-ashoka-50"
            : e.is_concerning
              ? "bg-saffron-50/60 hover:bg-saffron-50 hover:scale-[1.01]"
              : "border-emerald2-200 bg-emerald2-50/60 hover:bg-emerald2-50 hover:scale-[1.01]"
        }`}
        style={sel ? {} : (e.is_concerning ? { borderColor: "rgba(184,29,36,0.32)" } : undefined)}
      >
        <span className="min-w-0 flex items-center gap-2">
          {e.is_concerning
            ? <TrendingUp size={16} strokeWidth={3} style={{ color: "#b81d24" }} />
            : <TrendingDown size={16} strokeWidth={3} className="text-emerald2-600" />}
          <span className="text-[12px] font-bold text-ink2-800 truncate">{e.region}</span>
        </span>
        <span className="fig text-[14px] font-black whitespace-nowrap"
          style={{ color: e.is_concerning ? "#b81d24" : "#128807" }}>
          {e.pct_change >= 0 ? "+" : ""}{e.pct_change.toFixed(1)}%
        </span>
      </button>
    );
  };

  const Column = ({ kpi }: { kpi: KpiSpec }) => {
    const concerning = events.filter(e => e.metric === kpi.code && e.is_concerning).slice(0, 4);
    const improving  = events.filter(e => e.metric === kpi.code && !e.is_concerning).slice(0, 4);
    return (
      <div className="card overflow-hidden">
        <div
          className="px-4 py-2 text-white flex items-center justify-between"
          style={{ background: `linear-gradient(90deg, ${kpi.accent} 0%, ${kpi.accent}cc 100%)` }}
        >
          <span className="text-[12px] uppercase tracking-[0.16em] font-bold">{kpi.label}</span>
          <span className="text-[10px] font-mono opacity-90">{concerning.length + improving.length} alerts</span>
        </div>
        <div className="p-3">
        {concerning.length === 0 && improving.length === 0 && (
          <div className="text-center py-4 text-[11px] text-ink2-400">No significant movers</div>
        )}
        {concerning.length > 0 && (
          <div className="space-y-1 mb-2">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold" style={{ color: "#b81d24" }}>
              <AlertTriangle size={10} /> Worsening
            </div>
            {concerning.map((e) => <Pill key={`c-${e.region}-${e.metric}`} e={e} />)}
          </div>
        )}
        {improving.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-emerald2-600">
              <Activity size={10} /> Improving
            </div>
            {improving.map((e) => <Pill key={`i-${e.region}-${e.metric}`} e={e} />)}
          </div>
        )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {kpis.map((k) => <Column key={k.code} kpi={k} />)}
    </div>
  );
}
