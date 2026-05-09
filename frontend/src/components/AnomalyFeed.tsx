import { AlertTriangle, TrendingDown, TrendingUp, Activity } from "lucide-react";

export interface Anomaly {
  region: string;
  level: "state" | "district";
  metric: "imr" | "mmr" | "oope";
  current: number;
  previous: number;
  pct_change: number;
  direction: "up" | "down";
  is_concerning: boolean;
  month: string;
}

interface AnomalyFeedProps {
  events: Anomaly[];
  selected?: string | null;
  onSelect?: (region: string) => void;
  max?: number;
}

const metricLabel: Record<string, string> = {
  imr: "Infant Mortality",
  mmr: "Maternal Mortality",
  oope: "Out-of-Pocket Exp.",
};

export function AnomalyFeed({ events, selected, onSelect, max = 8 }: AnomalyFeedProps) {
  const concerning = events.filter(e => e.is_concerning).slice(0, max);
  const improving  = events.filter(e => !e.is_concerning).slice(0, max);

  const Row = ({ e }: { e: Anomaly }) => (
    <button
      onClick={() => onSelect?.(e.region)}
      className={`w-full text-left grid grid-cols-[16px_1fr_64px] items-center gap-2 px-3 py-2 border-b border-ink2-200/30 last:border-b-0 transition ${
        e.region === selected ? "bg-ashoka-50" : "hover:bg-cream-100"
      }`}
    >
      {e.is_concerning
        ? <TrendingUp size={14} className="text-ruby-600" style={{ color: "#b81d24" }} />
        : <TrendingDown size={14} className="text-emerald2-600" />
      }
      <span className="min-w-0">
        <span className="block text-[12px] font-medium text-ink2-700 truncate">{e.region}</span>
        <span className="block text-[10px] text-ink2-400">{metricLabel[e.metric]} · MoM</span>
      </span>
      <span className={`fig text-[12px] font-bold text-right ${e.is_concerning ? "text-ruby-600" : "text-emerald2-600"}`} style={{ color: e.is_concerning ? "#b81d24" : "#128807" }}>
        {e.pct_change >= 0 ? "+" : ""}{e.pct_change.toFixed(1)}%
      </span>
    </button>
  );

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-ink2-200/40">
        <div className="section-label text-ruby-600" style={{ color: "#b81d24" }}>
          <AlertTriangle size={12} className="-ml-1" />
          <span>Anomalies · last month</span>
        </div>
        <span className="text-[10px] font-mono text-ink2-400">{events.length} events</span>
      </div>

      {concerning.length > 0 && (
        <>
          <div className="px-4 py-1.5 text-[9px] uppercase tracking-wider text-ruby-600 bg-saffron-50/50 font-semibold flex items-center gap-1" style={{ color: "#b81d24" }}>
            <Activity size={10} />Concerning · worsening
          </div>
          {concerning.map((e) => <Row key={`c-${e.region}-${e.metric}`} e={e} />)}
        </>
      )}
      {improving.length > 0 && (
        <>
          <div className="px-4 py-1.5 text-[9px] uppercase tracking-wider text-emerald2-600 bg-emerald2-50 font-semibold flex items-center gap-1">
            <Activity size={10} />Improving · positive movers
          </div>
          {improving.map((e) => <Row key={`i-${e.region}-${e.metric}`} e={e} />)}
        </>
      )}
      {events.length === 0 && (
        <div className="px-4 py-6 text-center text-[12px] text-ink2-400">No significant anomalies detected.</div>
      )}
    </div>
  );
}
