import { useEffect, useRef } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface KPITileProps {
  label: string;
  unit: string;
  value: number;
  baseline?: number;
  baselineLabel?: string;
  direction: "lower_is_better" | "higher_is_better";
  accent?: string;
  size?: "lg" | "md" | "sm";
}

/**
 * Adaptive number format: avoids overflow for large values (e.g. Tourism domestic
 * footfall 3985 lakh, or Revenue TAT 5.8 days).
 * — ≥10k  → no decimal (e.g. "3,985")
 * — ≥100  → 1 decimal (e.g. "100.7")
 * — <100  → 1 decimal (e.g. "26.0")
 */
function fmtVal(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs >= 10_000) return Math.round(v).toLocaleString("en-IN");
  if (abs >= 1_000)  return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return v.toFixed(1);
}

/**
 * Choose a CSS font-size class based on the *rendered string length* (including
 * commas, decimals, and unit suffixes). JetBrains Mono at 48px (text-5xl) is
 * ~28px per character. A tile that's ~150px wide can hold ~5 chars at text-5xl
 * but ~7 chars at text-4xl (36px ≈ 21px/char).
 */
function figSizeClass(v: number, size: "lg" | "md" | "sm"): string {
  const len = fmtVal(v).length; // full formatted string, commas included
  if (size === "sm") return "text-3xl";
  if (size === "lg") {
    if (len >= 8) return "text-4xl";
    if (len >= 6) return "text-5xl";
    return "text-6xl";
  }
  // md (default) — tiles are roughly 150-180px wide in the right-rail grid
  if (len >= 9) return "text-2xl";
  if (len >= 7) return "text-3xl";
  if (len >= 5) return "text-4xl";   // e.g. "3,985" (5 chars) → fits at text-4xl
  return "text-5xl";                 // e.g. "26.0"  (4 chars) → text-5xl looks great
}

export function KPITile({ label, unit, value, baseline, baselineLabel = "vs national", direction, accent = "#0c4ca3", size = "md" }: KPITileProps) {
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

  return (
    <div
      className={`card card-accent ${size === "lg" ? "py-6" : size === "sm" ? "py-3" : "py-5"} px-4`}
      style={{ "--accent": accent, background: `linear-gradient(180deg, ${tint} 0%, #ffffff 75%)` } as any}
    >
      <div className="flex items-center justify-between gap-1 mb-2 flex-wrap">
        <div className="text-[12px] uppercase tracking-[0.16em] font-bold leading-tight" style={{ color: accent }}>{label}</div>
        <div className="text-[10px] text-ink2-400 font-mono leading-none">{unit}</div>
      </div>
      {/* Clipped container prevents overflow */}
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
