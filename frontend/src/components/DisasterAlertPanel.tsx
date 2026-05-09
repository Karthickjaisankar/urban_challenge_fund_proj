import { useState } from "react";
import { CloudRain, Thermometer, Wind, Mountain, AlertTriangle, CheckCircle, Eye, Bell } from "lucide-react";

interface AlertData {
  district: string;
  alerts: Record<string, string>;
  aggregate: string;
  forecast?: any[];
}

interface DisasterAlertPanelProps {
  allAlerts: { alerts: AlertData[] };
  activeEvents: { events: any[] };
  selectedDistrict?: string | null;
  onSelectDistrict?: (name: string) => void;
}

const LEVEL_COLOR: Record<string, string> = {
  green:  "#128807",
  yellow: "#d68b00",
  orange: "#ff7722",
  red:    "#b81d24",
};
const LEVEL_BG: Record<string, string> = {
  green:  "#e9f7ec",
  yellow: "#fef9ec",
  orange: "#fff4ec",
  red:    "#fdf0f0",
};
const LEVEL_LABEL: Record<string, string> = {
  green:  "Normal",
  yellow: "Watch",
  orange: "Alert",
  red:    "Warning",
};

const HAZARD_ICONS: Record<string, any> = {
  rainfall:  CloudRain,
  heatwave:  Thermometer,
  cyclone:   Wind,
  landslide: Mountain,
};
const HAZARD_LABELS: Record<string, string> = {
  rainfall:  "High Rainfall",
  heatwave:  "Heatwave",
  cyclone:   "Cyclone",
  landslide: "Landslide",
};
const HAZARD_ACCENT: Record<string, string> = {
  rainfall:  "#0c4ca3",
  heatwave:  "#b81d24",
  cyclone:   "#7c3aed",
  landslide: "#d68b00",
};

const CONDITION_ICON: Record<string, string> = {
  "Heavy Rain": "🌧",
  "Rain": "🌦",
  "Partly Cloudy": "⛅",
  "Heatwave": "🌡",
  "Hot & Sunny": "☀",
  "Sunny": "☀",
};

export function DisasterAlertPanel({
  allAlerts, activeEvents, selectedDistrict, onSelectDistrict,
}: DisasterAlertPanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "forecast" | "feed">("overview");

  const allDistrictAlerts: AlertData[] = allAlerts?.alerts ?? [];
  const events = activeEvents?.events ?? [];

  // Sort by severity for display — worst first
  const levelOrder: Record<string, number> = { red: 4, orange: 3, yellow: 2, green: 1 };
  const sorted = [...allDistrictAlerts].sort((a, b) => (levelOrder[b.aggregate] ?? 0) - (levelOrder[a.aggregate] ?? 0));
  const red    = sorted.filter(a => a.aggregate === "red");
  const orange = sorted.filter(a => a.aggregate === "orange");
  const yellow = sorted.filter(a => a.aggregate === "yellow");

  // Selected district detail
  const detail = allDistrictAlerts.find(a => a.district === selectedDistrict);

  // Summary counts per hazard × severity
  const hazardSummary = ["rainfall", "heatwave", "cyclone", "landslide"].map((h) => {
    const worst = allDistrictAlerts.reduce((max, a) => {
      const lv = levelOrder[a.alerts[h]] ?? 0;
      return lv > (levelOrder[max] ?? 0) ? a.alerts[h] : max;
    }, "green");
    const count = allDistrictAlerts.filter(a => a.alerts[h] !== "green").length;
    return { hazard: h, worst, count };
  });

  return (
    <div className="space-y-4">
      {/* Live alert ticker strip */}
      {red.length > 0 && (
        <div
          className="rounded-xl px-5 py-3 flex items-center gap-4 overflow-hidden"
          style={{ background: "linear-gradient(90deg, #b81d24 0%, #7d0d12 100%)" }}
        >
          <div className="flex items-center gap-2 text-white shrink-0">
            <Bell size={18} className="animate-pulse" />
            <span className="text-[12px] font-bold uppercase tracking-widest">Active Warnings</span>
          </div>
          <div className="text-white text-[13px] font-semibold truncate">
            {red.slice(0, 3).map(a =>
              `${a.district} — ${Object.entries(a.alerts).filter(([,l]) => l === "red").map(([h]) => HAZARD_LABELS[h]).join(", ")}`
            ).join(" · ")}
          </div>
          <div className="ml-auto bg-white/20 text-white text-[12px] font-bold px-3 py-1 rounded-full shrink-0">
            {red.length} districts
          </div>
        </div>
      )}

      {/* 4-hazard summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hazardSummary.map(({ hazard, worst, count }) => {
          const Icon = HAZARD_ICONS[hazard];
          const accent = HAZARD_ACCENT[hazard];
          const lvColor = LEVEL_COLOR[worst];
          const lvBg    = LEVEL_BG[worst];
          return (
            <div
              key={hazard}
              className="card card-accent p-4 cursor-pointer hover:shadow-cardHover transition"
              style={{ "--accent": accent, background: lvBg } as any}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg" style={{ background: accent + "18" }}>
                  <Icon size={22} style={{ color: accent }} />
                </div>
                <span
                  className="text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                  style={{ color: lvColor, background: lvColor + "18" }}
                >
                  {LEVEL_LABEL[worst]}
                </span>
              </div>
              <div className="font-bold text-ink2-800 text-[15px] leading-tight">{HAZARD_LABELS[hazard]}</div>
              <div className="text-[12px] text-ink2-500 mt-1">
                {count > 0 ? (
                  <span style={{ color: lvColor }} className="font-semibold">{count} districts affected</span>
                ) : (
                  <span className="text-emerald2-600 font-semibold">All clear</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* District detail + forecast (if selected) or alert feed */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left: district severity list */}
        <div className="col-span-12 lg:col-span-4 card overflow-hidden">
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-ink2-200/40"
               style={{ background: "linear-gradient(90deg, #b81d24 0%, #ff7722 100%)" }}>
            <span className="text-[12px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={14} /> District Alert Status
            </span>
            <span className="text-[10px] font-mono text-white/80">{allDistrictAlerts.length} districts</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {sorted.map((a) => (
              <button
                key={a.district}
                onClick={() => onSelectDistrict?.(a.district)}
                className={`w-full text-left flex items-center justify-between px-4 py-2.5 border-b border-ink2-200/25 last:border-0 transition ${
                  a.district === selectedDistrict ? "bg-cream-100" : "hover:bg-cream-50"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-ink2-800 truncate">{a.district}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {["rainfall", "heatwave", "cyclone", "landslide"].map((h) => {
                      const lv = a.alerts[h];
                      if (lv === "green") return null;
                      return (
                        <span key={h} className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: LEVEL_COLOR[lv] + "18", color: LEVEL_COLOR[lv] }}>
                          {HAZARD_LABELS[h].split(" ")[0]}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <span
                  className="text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-md ml-2 shrink-0"
                  style={{ color: LEVEL_COLOR[a.aggregate], background: LEVEL_COLOR[a.aggregate] + "18" }}
                >
                  {LEVEL_LABEL[a.aggregate]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: selected district detail OR active events feed */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {detail ? (
            <>
              {/* District hazard details */}
              <div className="card overflow-hidden">
                <div className="px-5 py-2.5 text-white flex items-center justify-between"
                     style={{ background: `linear-gradient(90deg, ${LEVEL_COLOR[detail.aggregate]} 0%, ${LEVEL_COLOR[detail.aggregate]}cc 100%)` }}>
                  <span className="text-[13px] font-bold">{detail.district} · Alert Details</span>
                  <span className="text-[11px] font-mono opacity-90">{new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" })}</span>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {["rainfall", "heatwave", "cyclone", "landslide"].map((h) => {
                    const lv = detail.alerts[h];
                    const Icon = HAZARD_ICONS[h];
                    const accent = HAZARD_ACCENT[h];
                    return (
                      <div key={h} className="rounded-lg border p-3 flex items-center gap-3"
                           style={{ borderColor: LEVEL_COLOR[lv] + "40", background: LEVEL_BG[lv] }}>
                        <div className="p-2 rounded-md" style={{ background: accent + "15" }}>
                          <Icon size={20} style={{ color: accent }} />
                        </div>
                        <div>
                          <div className="text-[12px] font-bold text-ink2-700">{HAZARD_LABELS[h]}</div>
                          <div className="text-[13px] font-black uppercase" style={{ color: LEVEL_COLOR[lv] }}>{LEVEL_LABEL[lv]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 7-day forecast */}
              {detail.forecast && (
                <div className="card overflow-hidden">
                  <div className="px-5 py-2.5 text-white" style={{ background: "linear-gradient(90deg, #0c4ca3 0%, #062b66 100%)" }}>
                    <span className="text-[12px] font-bold uppercase tracking-widest">7-Day Weather Forecast · {detail.district}</span>
                  </div>
                  <div className="p-4 grid grid-cols-7 gap-2">
                    {detail.forecast.map((f: any, i: number) => (
                      <div key={i} className={`text-center rounded-lg py-3 px-1 border ${i === 0 ? "border-ashoka-200 bg-ashoka-50" : "border-ink2-100"}`}>
                        <div className="text-[10px] font-bold text-ink2-400 uppercase tracking-wider">{f.day}</div>
                        <div className="text-2xl my-1">{CONDITION_ICON[f.condition] ?? "🌤"}</div>
                        <div className="text-[11px] font-bold text-ink2-700">{Math.round(f.temp_day)}°</div>
                        <div className="text-[10px] text-ink2-400">{Math.round(f.temp_night)}°</div>
                        {f.rainfall_mm > 3 && (
                          <div className="text-[9px] font-bold mt-1" style={{ color: "#0c4ca3" }}>
                            {f.rainfall_mm.toFixed(0)}mm
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Active events feed when no district selected */
            <div className="card overflow-hidden">
              <div className="px-5 py-2.5 text-white" style={{ background: "linear-gradient(90deg, #b81d24 0%, #7d0d12 100%)" }}>
                <span className="text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <Eye size={14} /> Active Orange / Red Events · All Districts
                </span>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {events.slice(0, 20).map((e: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3 border-b border-ink2-200/30 last:border-0">
                    <span
                      className="shrink-0 px-2 py-0.5 text-[10px] font-black uppercase rounded mt-0.5"
                      style={{ color: LEVEL_COLOR[e.level], background: LEVEL_COLOR[e.level] + "18" }}
                    >
                      {LEVEL_LABEL[e.level]}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-ink2-800">
                        {e.district} <span style={{ color: HAZARD_ACCENT[e.hazard] }}>· {HAZARD_LABELS[e.hazard]}</span>
                      </div>
                      <div className="text-[11px] text-ink2-500 mt-0.5">{e.message?.split(": ").slice(1).join(": ")}</div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="flex items-center gap-3 px-5 py-8 text-emerald2-600">
                    <CheckCircle size={20} />
                    <span className="font-semibold">No active orange or red alerts. All districts normal.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
