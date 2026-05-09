import { X, MapPin, Crown, TrendingDown, TrendingUp, Layers } from "lucide-react";

interface SchemeRow {
  name: string;
  metric: string;        // descriptive label of what the value measures
  value: string;         // pre-formatted display value
  tier: "central" | "state";
}

interface MapOverlayPanelProps {
  region: string;
  parent?: string | null;
  level: "state" | "district" | "national";
  kpis: {
    code: string;
    label: string;
    unit: string;
    value: number;
    baseline: number | null;
    accent: string;
    direction?: "lower_is_better" | "higher_is_better";
  }[];
  rank?: number | null;
  totalRanked?: number | null;
  centralSchemes?: SchemeRow[];
  stateSchemes?: SchemeRow[];
  stateSchemeOwner?: string;   // "Tamil Nadu" or "Gujarat" — header for state schemes section
  fundingTotalCr?: number;
  fundingReleasedPct?: number;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  onClose?: () => void;
}

const fmt = (n: number) => Number.isFinite(n) ? n.toFixed(1) : "—";

/**
 * Floating overlay shown ON TOP OF the map when a region is selected.
 * Inspired by the smart-city ICCC reference image — separated panels that
 * surface the most important info without leaving the map view.
 */
export function MapOverlayPanel({
  region, parent, level, kpis, rank, totalRanked,
  centralSchemes = [], stateSchemes = [], stateSchemeOwner,
  fundingTotalCr, fundingReleasedPct, position = "top-right", onClose,
}: MapOverlayPanelProps) {
  const posClass = {
    "top-left":     "top-16 left-3 sm:top-16",
    "top-right":    "top-16 right-3",
    "bottom-left":  "bottom-12 left-3",
    "bottom-right": "bottom-12 right-16 sm:bottom-3 sm:right-16",
  }[position];

  return (
    <div
      className={`absolute ${posClass} z-[800] w-[340px] sm:w-[380px] max-w-[calc(100vw-32px)] max-h-[calc(100%-80px)] overflow-y-auto bg-white/95 backdrop-blur-md border border-ink2-200 rounded-xl shadow-card`}
      style={{ animation: "panel-pop 280ms cubic-bezier(.2,.9,.2,1.05)" }}
    >
      {/* Top accent strip — colored per level */}
      <div
        className="h-1"
        style={{
          background: level === "district"
            ? "linear-gradient(90deg, #ff7722 0%, #c4368e 50%, #0c4ca3 100%)"
            : level === "state"
              ? "linear-gradient(90deg, #128807 0%, #0c4ca3 100%)"
              : "linear-gradient(90deg, #0c4ca3 0%, #128807 100%)",
        }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink2-400 font-semibold">
              <MapPin size={10} className="text-emerald2-600" />
              <span>{level === "district" && parent ? `${parent} · district` : level === "state" ? "State" : "National roll-up"}</span>
              {rank != null && totalRanked != null && (
                <span className="ml-1 inline-flex items-center gap-1 text-saffron-700">
                  <Crown size={10} />Rank {rank} / {totalRanked}
                </span>
              )}
            </div>
            <div className="display text-2xl font-bold text-ink2-800 leading-tight mt-0.5">{region}</div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 -m-1 rounded hover:bg-cream-100 text-ink2-400 hover:text-ink2-700">
              <X size={16} />
            </button>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {kpis.map((k) => {
            const delta = k.baseline != null ? k.value - k.baseline : null;
            const dir = k.direction ?? "lower_is_better";
            const better = delta == null ? null : (dir === "lower_is_better" ? delta < 0 : delta > 0);
            const TrendIcon = better == null ? null : (dir === "lower_is_better" ? TrendingDown : TrendingUp);
            const deltaColor = better == null ? "text-ink2-400" : (better ? "text-emerald2-600" : "text-ruby-600");
            return (
              <div key={k.code} className="rounded-lg border border-ink2-200/40 bg-cream-50 px-2 py-2">
                <div className="text-[9px] uppercase tracking-wider text-ink2-400 font-semibold">{k.label}</div>
                <div className="fig display text-xl font-bold leading-none mt-0.5" style={{ color: k.accent }}>
                  {fmt(k.value)}
                </div>
                <div className="text-[8.5px] font-mono text-ink2-400 leading-tight">{k.unit}</div>
                {delta != null && Number.isFinite(delta) && (
                  <div className={`mt-1 text-[10px] flex items-center gap-0.5 ${deltaColor}`} style={{ color: better ? "#128807" : "#b81d24" }}>
                    {TrendIcon && <TrendIcon size={9} />}
                    <span className="fig font-semibold">{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</span>
                    <span className="text-ink2-400 ml-0.5">vs nat'l</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Funding chip */}
        {fundingTotalCr != null && (
          <div className="rounded-lg border border-ink2-200/40 bg-emerald2-50/60 px-3 py-2 mb-3 flex items-center justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-emerald2-600 font-semibold">Health · Total funding (FY 26-27)</div>
              <div className="fig text-base font-bold text-emerald2-600">
                ₹{fundingTotalCr.toLocaleString("en-IN")} Cr
              </div>
            </div>
            {fundingReleasedPct != null && (
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-ink2-400 font-semibold">released</div>
                <div className="fig text-base font-bold text-saffron-700">{fundingReleasedPct.toFixed(0)}%</div>
              </div>
            )}
          </div>
        )}

        {/* Central schemes — name, metric label, value with unit */}
        {centralSchemes.length > 0 && (
          <div className="mb-2">
            <div className="text-[10px] uppercase tracking-wider text-saffron-700 font-semibold flex items-center gap-1 mb-1.5">
              <Layers size={11} />
              <span>Central schemes · live</span>
            </div>
            <div className="space-y-2 border-t border-ink2-200/30 pt-2">
              {centralSchemes.map((s) => (
                <div key={s.name} className="flex items-start justify-between gap-2 text-[11px]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-saffron-500 shrink-0" />
                      <span className="text-ink2-700 font-semibold truncate">{s.name}</span>
                    </div>
                    <div className="text-[10px] text-ink2-400 leading-tight ml-3.5 mt-0.5">{s.metric}</div>
                  </div>
                  <span className="fig text-[12px] font-bold text-saffron-700 whitespace-nowrap shrink-0">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State schemes — only when applicable */}
        {stateSchemes.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-emerald2-600 font-semibold flex items-center gap-1 mb-1.5">
              <Layers size={11} />
              <span>State govt schemes{stateSchemeOwner ? ` · ${stateSchemeOwner}` : ""}</span>
            </div>
            <div className="space-y-2 border-t border-ink2-200/30 pt-2">
              {stateSchemes.map((s) => (
                <div key={s.name} className="flex items-start justify-between gap-2 text-[11px]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald2-500 shrink-0" />
                      <span className="text-ink2-700 font-semibold truncate">{s.name}</span>
                    </div>
                    <div className="text-[10px] text-ink2-400 leading-tight ml-3.5 mt-0.5">{s.metric}</div>
                  </div>
                  <span className="fig text-[12px] font-bold text-emerald2-600 whitespace-nowrap shrink-0">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
