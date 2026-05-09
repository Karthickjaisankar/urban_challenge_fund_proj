import { useEffect, useRef, useState } from "react";

interface SchemeTileProps {
  name: string;
  metric: string;
  value: number;
  format?: "int" | "cr" | "pct" | "dec";
  accent?: string;
  ribbon?: string;
  ribbonTone?: "central" | "state";
}

export function SchemeTile({ name, metric, value, format = "int", accent = "#0c4ca3", ribbon, ribbonTone = "central" }: SchemeTileProps) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef = useRef(value);
  const tsRef = useRef(performance.now());

  useEffect(() => {
    if (value === displayed || !Number.isFinite(value)) {
      setDisplayed(value);
      return;
    }
    fromRef.current = displayed;
    tsRef.current = performance.now();
    const dur = 800;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - tsRef.current) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplayed(fromRef.current + (value - fromRef.current) * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const fmt = (n: number) => {
    if (!Number.isFinite(n)) return "—";
    const abs = Math.abs(n);
    if (format === "cr")  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
    if (format === "pct") return `${n.toFixed(1)}%`;
    if (format === "dec") {
      if (abs >= 10_000) return Math.round(n).toLocaleString("en-IN");
      return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
    }
    // "int" — smart grouping
    if (abs >= 1_00_000) return `${(n / 1_00_000).toFixed(2)} L`;   // lakh
    if (abs >= 1_000)    return Math.round(n).toLocaleString("en-IN");
    return Math.round(n).toLocaleString("en-IN");
  };

  /** Adaptive font size so large numbers don't overflow the tile */
  const figSize = (() => {
    const s = fmt(displayed);
    if (s.length >= 10) return "text-2xl";
    if (s.length >= 7)  return "text-3xl";
    return "text-4xl";
  })();

  const ribbonBg = ribbonTone === "central"
    ? "linear-gradient(90deg, #ff7722 0%, #b94d0a 100%)"
    : "linear-gradient(90deg, #128807 0%, #0e6b06 100%)";

  const tint = accent + "10"; // very light accent tint for body

  return (
    <div
      className="card relative overflow-hidden"
      style={{ "--accent": accent, background: `linear-gradient(180deg, ${tint} 0%, #ffffff 60%)` } as any}
    >
      {/* Top ribbon — colored band identifying Central vs State */}
      <div
        className="px-4 py-1.5 text-[10px] uppercase tracking-[0.22em] font-bold text-white flex items-center justify-between"
        style={{ background: ribbonBg }}
      >
        <span>{ribbon ?? (ribbonTone === "central" ? "Central" : "State")}</span>
        <span className="opacity-80 text-[9px] font-mono">live</span>
      </div>
      <div className="px-5 pt-3 pb-4">
        <div className="text-[13px] font-bold text-ink2-800 leading-tight">{name}</div>
        <div className="text-[11px] text-ink2-400 mt-0.5 leading-tight">{metric}</div>
        {Number.isFinite(displayed) ? (
        <div className={`fig display ${figSize} mt-3 truncate overflow-hidden`} style={{ color: accent, fontWeight: 900 }}>
          {fmt(displayed)}
        </div>
      ) : (
        /* Loading skeleton — shows shimmering placeholder while data arrives */
        <div className="mt-3 space-y-1.5">
          <div className="skeleton h-9 w-28 rounded-md" />
        </div>
      )}
      </div>
      {/* Left edge stripe in scheme color */}
      <span className="absolute left-0 top-7 bottom-3 w-[3px] rounded-r" style={{ background: accent }} />
    </div>
  );
}
