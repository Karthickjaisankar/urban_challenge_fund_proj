import { useEffect, useRef } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface KPITileProps {
  label: string;
  unit: string;
  value: number;
  baseline?: number;          // benchmark (national avg for states, state avg for districts)
  baselineLabel?: string;
  direction: "lower_is_better" | "higher_is_better";
  accent?: string;
  size?: "lg" | "md" | "sm";
}

/**
 * Adaptive number format: avoids overflow for large values
 */
function fmtVal(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 10_000) return Math.round(v).toLocaleString("en-IN");
  if (abs >= 1_000)  return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return v.toFixed(1);
}

function figSizeClass(v: number, size: "lg" | "md" | "sm"): string {
  const len = fmtVal(v).length;
  if (size === "sm") return "text-3xl";
  if (size === "lg") {
    if (len >= 8) return "text-4xl";
    if (len >= 6) return "text-5xl";
    return "text-6xl";
  }
  if (len >= 9) return "text-2xl";
  if (len >= 7) return "text-3xl";
  if (len >= 5) return "text-4xl";
  return "text-5xl";
}

/** Corner glow based on value vs benchmark.
 *  Returns a CSS box-shadow string — glows are stronger at card corners
 *  because of the border-radius geometry.
 *  Tolerance: ±10% of benchmark = amber; outside = green/red.
 */
function cornerGlow(
  value: number,
  baseline: number | undefined,
  direction: "lower_is_better" | "higher_is_better",
): string | undefined {
  if (baseline == null || !Number.isFinite(value) || !Number.isFinite(baseline) || baseline === 0) return undefined;

  const relDiff = (value - baseline) / Math.abs(baseline); // negative = lower than benchmark
  const withinTolerance = Math.abs(relDiff) <= 0.10;

  let r: number, g: number, b: number;

  if (withinTolerance) {
    // Amber — near average
    [r, g, b] = [217, 119, 6];
  } else {
    const valueBetterThanBenchmark =
      direction === "lower_is_better" ? relDiff < 0 : relDiff > 0;
    [r, g, b] = valueBetterThanBenchmark ? [22, 163, 74] : [220, 38, 38];
  }

  // Two-layer shadow: thin border ring + outer glow
  // The rounded corners cause the glow to pool at corners — this is intentional.
  return [
    `0 0 0 1.5px rgba(${r},${g},${b},0.40)`,   // inner ring
    `0 0 18px 4px rgba(${r},${g},${b},0.22)`,   // outer glow
    `inset 0 0 8px 0 rgba(${r},${g},${b},0.06)`, // subtle inner blush
  ].join(", ");
}

export function KPITile({ label, unit, value, baseline, baselineLabel = "vs avg", direction, accent = "#0c4ca3", size = "md" }: KPITileProps) {
  const figRef = useRef<HTMLSpanElement>(null);
  const last = useRef(value);
  useEffect(() => {
    if (last.current !== value && figRef.current) {
      figRef.current.classList.remove("counter-flash");
      void figRef.current.offsetWidth;
      figRef.current.classList.add("counter-flash");
    }
    last.current = value;
  }, [value]);

  const delta = baseline != null ? value - baseline : null;
  const better = delta == null ? null
    : direction === "lower_is_better" ? delta < 0 : delta > 0;
  const TrendIcon = better == null ? null
    : (direction === "lower_is_better" ? TrendingDown : TrendingUp);

  const tint = accent + "14";
  const glow = cornerGlow(value, baseline, direction);

  return (
    <div
      className={`card card-accent ${size === "lg" ? "py-6" : size === "sm" ? "py-3" : "py-5"} px-4 transition-shadow`}
      style={{
        "--accent": accent,
        background: `linear-gradient(180deg, ${tint} 0%, #ffffff 75%)`,
        ...(glow ? { boxShadow: glow } : {}),
      } as any}
    >
      <div className="flex items-center justify-between gap-1 mb-2 flex-wrap">
        <div className="text-[12px] uppercase tracking-[0.16em] font-bold leading-tight" style={{ color: accent }}>{label}</div>
        <div className="text-[10px] text-ink2-400 font-mono leading-none">{unit}</div>
      </div>
      <div className="overflow-hidden min-w-0">
        <span
          ref={figRef}
          className={`fig display ${figSizeClass(value, size)} block truncate`}
          style={{ color: accent, fontWeight: 900 }}
        >
          {fmtVal(value)}
        </span>
      </div>
      {delta != null && Number.isFinite(delta) && (
        <div
          className="mt-2 inline-flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-md"
          style={{
            color: better ? "#0a4f04" : "#9d151c",
            background: better ? "rgba(18,136,7,0.10)" : "rgba(184,29,36,0.10)",
          }}
        >
          {TrendIcon && <TrendIcon size={14} strokeWidth={3} />}
          {delta >= 0 ? "+" : ""}{Math.abs(delta) >= 100 ? Math.round(delta) : delta.toFixed(1)}
          <span className="text-[10px] font-semibold opacity-70 ml-0.5 uppercase tracking-wider">{baselineLabel}</span>
        </div>
      )}
    </div>
  );
}
