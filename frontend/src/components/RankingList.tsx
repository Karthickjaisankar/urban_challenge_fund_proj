import { useMemo, useState } from "react";
import { ArrowUpDown, Trophy, Flame } from "lucide-react";

export interface RankRow {
  rank: number;
  region: string;
  value: number;
  level?: string;
}

interface RankingListProps {
  rows: RankRow[];
  metric: string;
  unit: string;
  direction: "lower_is_better" | "higher_is_better";
  selectedRegion?: string | null;
  onSelect?: (region: string) => void;
  collapsed?: boolean;
  accent?: string;
}

export function RankingList({ rows, metric, unit, direction, selectedRegion, onSelect, collapsed = true, accent = "#0c4ca3" }: RankingListProps) {
  const [expanded, setExpanded] = useState(!collapsed);
  const N = 5;
  const sorted = rows;

  type Slot = { row: RankRow; i: number; divider?: undefined } | { row: null; i: number; divider: number };
  const visible: Slot[] = useMemo(() => {
    if (expanded || sorted.length <= 2 * N + 1) return sorted.map<Slot>((r, i) => ({ row: r, i }));
    const top: Slot[] = sorted.slice(0, N).map((r, i) => ({ row: r, i }));
    const bottom: Slot[] = sorted.slice(-N).map((r, i) => ({ row: r, i: sorted.length - N + i }));
    const divider: Slot = { row: null, i: -1, divider: sorted.length - 2 * N };
    return [...top, divider, ...bottom];
  }, [sorted, expanded]);

  const min = sorted.length ? sorted[0].value : 0;
  const max = sorted.length ? sorted[sorted.length - 1].value : 1;

  return (
    <div className="card overflow-hidden">
      {/* Colored header banner */}
      <div className="px-4 py-2.5 text-white flex items-center justify-between" style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}cc 100%)` }}>
        <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] font-bold">
          <Trophy size={14} />
          <span>{metric} · best → worst</span>
        </div>
        <button onClick={() => setExpanded((v) => !v)} className="text-[10px] flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 transition font-bold">
          <ArrowUpDown size={11} />
          {expanded ? "Top/Bot" : "All"}
        </button>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {visible.map((v, idx) => {
          if (!v.row) {
            return (
              <div key={`div-${idx}`} className="px-4 py-2 text-[10px] uppercase tracking-wider text-ink2-400 bg-cream-100 border-y border-ink2-200/40 flex items-center gap-2 font-bold">
                <Flame size={11} className="text-saffron-500" />
                <span>{v.divider} states in between · click All</span>
              </div>
            );
          }
          const r = v.row;
          const sel = r.region === selectedRegion;
          // bar % — relative to range
          const pct = (max === min) ? 50 : ((r.value - min) / (max - min)) * 100;
          // For higher_is_better: visually flip so the "best" still appears with a long green bar.
          const visualPct = direction === "lower_is_better" ? (100 - pct) : pct;
          const goodAtLow = direction === "lower_is_better";
          const barColor = goodAtLow
            ? (pct < 33 ? "linear-gradient(90deg, #128807, #67c47b)" : pct < 66 ? "linear-gradient(90deg, #d68b00, #ffa726)" : "linear-gradient(90deg, #b81d24, #e85a35)")
            : (pct < 33 ? "linear-gradient(90deg, #b81d24, #e85a35)" : pct < 66 ? "linear-gradient(90deg, #d68b00, #ffa726)" : "linear-gradient(90deg, #128807, #67c47b)");
          const isTop = r.rank <= 3;
          const isBottom = r.rank > sorted.length - 3;
          return (
            <button
              key={r.region}
              onClick={() => onSelect?.(r.region)}
              className={`w-full text-left grid grid-cols-[36px_1fr_72px] items-center gap-3 px-4 py-2.5 border-b border-ink2-200/30 last:border-b-0 transition ${
                sel ? "bg-ashoka-50" : "hover:bg-cream-50"
              }`}
            >
              <span
                className={`fig text-[12px] font-black inline-flex items-center justify-center w-8 h-8 rounded-full ${
                  isTop ? "text-white" : isBottom ? "text-white" : "text-ink2-700"
                }`}
                style={{
                  background: isTop ? "linear-gradient(135deg, #128807, #0a4f04)"
                    : isBottom ? "linear-gradient(135deg, #b81d24, #7d0d12)"
                    : "rgba(15,23,42,0.06)",
                }}
              >
                {r.rank}
              </span>
              <span className="min-w-0">
                <span className={`text-[13px] font-bold truncate block ${sel ? "text-ashoka-700" : "text-ink2-800"}`}>
                  {r.region}
                </span>
                <span className="block h-2 mt-1.5 bg-cream-200 rounded-full overflow-hidden">
                  <span className="block h-2 rounded-full" style={{ width: `${visualPct}%`, background: barColor }} />
                </span>
              </span>
              <span className="fig text-[15px] font-black text-right text-ink2-800">
                {r.value.toFixed(1)}
                <span className="block text-[8.5px] text-ink2-400 font-mono font-normal mt-0.5">{unit}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
