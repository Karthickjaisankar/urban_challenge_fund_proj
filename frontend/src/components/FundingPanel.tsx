import { Banknote, IndianRupee } from "lucide-react";

interface FundingData {
  central: number;
  central_released: number;
  state: number;
  state_released: number;
  central_release_pct?: number;
  state_release_pct?: number;
  total_allocated: number;
  total_released: number;
}

interface FundingPanelProps {
  scope: string;
  data: FundingData;
  fy?: string;
}

const fmt = (cr: number) => {
  if (cr >= 1_00_000) return `₹${(cr / 1_00_000).toFixed(2)} L Cr`;
  if (cr >= 1_000)   return `₹${(cr / 1_000).toFixed(1)}k Cr`;
  return `₹${cr.toLocaleString("en-IN")} Cr`;
};

export function FundingPanel({ scope, data, fy = "FY 2026-27" }: FundingPanelProps) {
  const centralPct = data.central_release_pct ?? Math.round(data.central_released / Math.max(1, data.central) * 100);
  const statePct   = data.state_release_pct ?? Math.round(data.state_released / Math.max(1, data.state) * 100);
  const totalPct   = Math.round(data.total_released / Math.max(1, data.total_allocated) * 100);

  const Bar = ({ pct, gradient, label }: { pct: number; gradient: string; label: string }) => (
    <div className="space-y-1.5">
      <div className="block h-3 bg-cream-200 rounded-full overflow-hidden relative">
        <span className="block h-3 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: gradient, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-white drop-shadow">{pct}%</span>
      </div>
      <div className="text-[10px] font-mono text-ink2-400 flex items-center justify-between">
        <span className="uppercase tracking-wider font-semibold">{label}</span>
        <span>{pct}% released</span>
      </div>
    </div>
  );

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-2.5 text-white flex items-center justify-between"
           style={{ background: "linear-gradient(90deg, #128807 0%, #0a4f04 100%)" }}>
        <div className="flex items-center gap-2">
          <Banknote size={14} />
          <span className="text-[12px] uppercase tracking-[0.18em] font-bold">Funding · {fy}</span>
        </div>
        <span className="text-[10px] font-mono opacity-90">{scope}</span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-5 mb-4">
          {/* Central */}
          <div className="rounded-lg border border-saffron-300/30 bg-saffron-50/60 p-3">
            <div className="flex items-center gap-1.5 text-saffron-700 mb-1">
              <IndianRupee size={11} strokeWidth={3} />
              <span className="text-[10px] uppercase tracking-[0.18em] font-bold">Central</span>
            </div>
            <div className="fig display text-[34px] text-saffron-700 leading-none mb-1" style={{ fontWeight: 900 }}>
              {fmt(data.central)}
            </div>
            <div className="text-[10px] text-ink2-600 mb-2 font-medium">{fmt(data.central_released)} released</div>
            <Bar pct={centralPct} gradient="linear-gradient(90deg, #ffb27a 0%, #ff7722 100%)" label="release rate" />
          </div>
          {/* State */}
          <div className="rounded-lg border border-emerald2-300/30 bg-emerald2-50/60 p-3">
            <div className="flex items-center gap-1.5 text-emerald2-600 mb-1">
              <IndianRupee size={11} strokeWidth={3} />
              <span className="text-[10px] uppercase tracking-[0.18em] font-bold">State Govt</span>
            </div>
            <div className="fig display text-[34px] text-emerald2-600 leading-none mb-1" style={{ fontWeight: 900 }}>
              {fmt(data.state)}
            </div>
            <div className="text-[10px] text-ink2-600 mb-2 font-medium">{fmt(data.state_released)} released</div>
            <Bar pct={statePct} gradient="linear-gradient(90deg, #67c47b 0%, #128807 100%)" label="release rate" />
          </div>
        </div>

        <div className="border-t-2 border-ashoka-100 pt-3 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink2-400 font-bold">Total spend</div>
            <div className="fig display text-2xl text-ashoka-500 leading-tight" style={{ fontWeight: 900 }}>
              {fmt(data.total_allocated)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.18em] text-ink2-400 font-bold">Released</div>
            <div className="fig text-2xl font-black text-ashoka-500 leading-tight">{totalPct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
