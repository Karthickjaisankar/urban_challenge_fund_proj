/**
 * Left sidebar — always dark, deliberate contrast with light content area.
 * Departments are secondary filter pills (not primary navigation).
 */
import {
  Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass,
  ChevronRight, LayoutGrid, Radio, Flag,
} from "lucide-react";
import { DEPT_REGISTRY } from "@/lib/constants";

const ICONS: Record<string, any> = {
  Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass,
};

interface LeftSidebarProps {
  view: "india" | "state" | "district";
  stateName: string | null;
  districtName: string | null;
  filterDept: string | null;     // currently active dept filter
  connected: boolean;
  onGoIndia: () => void;
  onGoState: () => void;
  onFilterDept: (code: string | null) => void;
  ticketCount?: number;
  onOpenTickets?: () => void;
}

export function LeftSidebar({
  view, stateName, districtName, filterDept, connected,
  onGoIndia, onGoState, onFilterDept, ticketCount = 0, onOpenTickets,
}: LeftSidebarProps) {
  return (
    <aside className="flex flex-col h-screen overflow-y-auto"
           style={{ background: "rgba(8,14,22,0.98)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>

      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: "linear-gradient(135deg, #FF7722, #c4368e 60%, #7FE0FF)" }}>
            <LayoutGrid size={18} className="text-white" />
          </div>
          <div>
            <div className="display text-[15px] text-white leading-none">UCF · ICCC</div>
            <div className="text-[10px] text-white/40 uppercase tracking-[0.18em] mt-0.5">MoHUA · Command Centre</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 pulse-dot" : "bg-white/20"}`} />
          <span className={connected ? "text-green-400 font-semibold" : "text-white/30"}>
            {connected ? "Live · 3s stream" : "Reconnecting…"}
          </span>
        </div>
      </div>

      {/* Navigation breadcrumb */}
      <div className="px-5 py-3 border-b border-white/[0.07]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Location</div>
        <div className="space-y-1">
          <button onClick={onGoIndia}
            className={`flex items-center gap-2 w-full text-left text-[13px] font-semibold transition rounded-lg px-2 py-1.5 ${
              view === "india" ? "text-red-400 bg-white/05" : "text-white/50 hover:text-white hover:bg-white/05"
            }`}>
            <span className="text-[11px]">🇮🇳</span> All India
          </button>
          {stateName && (
            <button onClick={onGoState}
              className={`flex items-center gap-2 w-full text-left text-[13px] font-semibold transition rounded-lg px-2 py-1.5 ml-2 ${
                view === "state" ? "text-red-400 bg-white/05" : "text-white/50 hover:text-white hover:bg-white/05"
              }`}>
              <ChevronRight size={12} className="text-white/25 shrink-0" />
              <span className="truncate">{stateName}</span>
              <span className="text-[9px] text-white/20 font-normal shrink-0">Nodal</span>
            </button>
          )}
          {districtName && (
            <div className="flex items-center gap-2 text-[13px] font-semibold rounded-lg px-2 py-1.5 ml-4 text-red-400 bg-white/05">
              <ChevronRight size={12} className="text-white/25 shrink-0" />
              <span className="truncate">{districtName}</span>
              <span className="text-[9px] text-white/20 font-normal shrink-0">Sub-Nodal</span>
            </div>
          )}
        </div>
      </div>

      {/* UCF fund summary */}
      <div className="px-5 py-3 border-b border-white/[0.07]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Urban Challenge Fund</div>
        <div className="fig display text-2xl text-white font-black">
          ₹1,00,000 <span className="text-[14px] text-white/40 font-normal">Cr</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1">
            <div className="text-[9px] text-white/30 mb-0.5">Central 60%</div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "37%", background: "#FF7722" }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-white/30 mb-0.5">State 40%</div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "44%", background: "#7FE0FF" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Department filter pills */}
      <div className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 px-2 mb-2">
          {view === "india" ? "Filter by department" : "Rank districts by"}
        </div>
        <div className="space-y-0.5">
          {/* "Overall" option */}
          <button
            onClick={() => onFilterDept(null)}
            className={`w-full nav-item ${!filterDept ? "active" : ""}`}
            style={!filterDept ? { borderLeft: "3px solid #94A3B8" } : { borderLeft: "3px solid transparent" }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background: !filterDept ? "rgba(148,163,184,0.15)" : "rgba(255,255,255,0.04)" }}>
              <LayoutGrid size={15} className="text-slate-400" />
            </div>
            <div className="text-[13px] font-semibold">Overall</div>
          </button>

          {DEPT_REGISTRY.map((d) => {
            const Icon = ICONS[d.icon] ?? LayoutGrid;
            const active = filterDept === d.code;
            return (
              <button key={d.code} onClick={() => onFilterDept(d.code)}
                className={`w-full nav-item group ${active ? "active" : ""}`}
                style={active ? { borderLeft: `3px solid ${d.accent}` } : { borderLeft: "3px solid transparent" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition"
                     style={{ background: active ? `${d.accent}28` : "rgba(255,255,255,0.04)" }}>
                  <Icon size={15} style={{ color: d.accent }} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-[13px] font-semibold leading-none">{d.name}</div>
                  <div className="text-[10px] text-white/30 mt-0.5 leading-none">{d.tagline}</div>
                </div>
                {active && <ChevronRight size={12} style={{ color: d.accent }} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticker */}
      <div className="px-3 py-3 border-t border-white/[0.07]">
        <button onClick={onOpenTickets}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition relative"
          style={{ background: "rgba(255,119,34,0.08)", border: "1px solid rgba(255,119,34,0.2)" }}>
          <Flag size={15} className="text-saffron-500" />
          <div className="text-left">
            <div className="text-[12px] font-bold text-saffron-500">Collector Tickers</div>
            <div className="text-[10px] text-white/30">Flag data discrepancies</div>
          </div>
          {ticketCount > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                  style={{ background: "#DC2626" }}>{ticketCount}</span>
          )}
        </button>
        <div className="mt-2 text-center text-[9px] text-white/20 uppercase tracking-wider">© 2026 MoHUA · UCF v1</div>
      </div>
    </aside>
  );
}
