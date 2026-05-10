import {
  Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass,
  ChevronRight, LayoutGrid, Radio, Flag,
} from "lucide-react";
import { DEPT_REGISTRY, UCF_TOTAL_CR } from "@/lib/constants";

const ICONS: Record<string, any> = {
  Heart, BookOpen, Users, Landmark, Zap, ShieldAlert, Compass,
};

interface LeftSidebarProps {
  view: "india" | "state" | "district";
  stateName: string | null;
  districtName: string | null;
  activeDept: string | null;
  connected: boolean;
  onGoIndia: () => void;
  onGoState: () => void;
  onSelectDept: (code: string) => void;
  ticketCount?: number;
  onOpenTickets?: () => void;
}

export function LeftSidebar({
  view, stateName, districtName, activeDept, connected,
  onGoIndia, onGoState, onSelectDept, ticketCount = 0, onOpenTickets,
}: LeftSidebarProps) {
  return (
    <aside className="flex flex-col h-screen overflow-y-auto"
           style={{ background: "rgba(8,14,22,0.98)", borderRight: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Logo + brand */}
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
        {/* Live indicator */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-400 pulse-dot" : "bg-white/20"}`} />
          <span className={connected ? "text-green-400 font-semibold" : "text-white/30"}>
            {connected ? "Live · 3s stream" : "Reconnecting…"}
          </span>
        </div>
      </div>

      {/* Breadcrumb / scope */}
      <div className="px-5 py-3 border-b border-white/[0.07]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Scope</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={onGoIndia}
            className={`text-left text-[13px] font-semibold flex items-center gap-1.5 transition ${
              view === "india" ? "text-yellow-400" : "text-white/50 hover:text-white/80"
            }`}
          >
            <span className="text-[11px]">🇮🇳</span> All India
          </button>
          {stateName && (
            <button
              onClick={onGoState}
              className={`text-left text-[13px] font-semibold flex items-center gap-1.5 ml-4 transition ${
                view === "state" ? "text-yellow-400" : "text-white/50 hover:text-white/80"
              }`}
            >
              <ChevronRight size={12} className="text-white/30" />
              {stateName}
              <span className="text-[9px] text-white/30 font-normal">(Nodal ICCC)</span>
            </button>
          )}
          {districtName && (
            <div className="text-[13px] font-semibold flex items-center gap-1.5 ml-8 text-yellow-400">
              <ChevronRight size={12} className="text-white/30" />
              {districtName}
              <span className="text-[9px] text-white/30 font-normal">(Sub-Nodal)</span>
            </div>
          )}
        </div>
      </div>

      {/* UCF fund summary */}
      <div className="px-5 py-3 border-b border-white/[0.07]">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">Urban Challenge Fund</div>
        <div className="fig display text-2xl text-white font-black">
          ₹1,00,000 <span className="text-[14px] text-white/50 font-normal">Cr</span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1">
            <div className="text-[9px] text-white/30 uppercase mb-0.5">Central (60%)</div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "37%", background: "#FF7722" }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="text-[9px] text-white/30 uppercase mb-0.5">State (40%)</div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: "44%", background: "#7FE0FF" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Department nav */}
      <div className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 px-2 mb-2">Departments</div>
        <nav className="space-y-0.5">
          {DEPT_REGISTRY.map((d) => {
            const Icon = ICONS[d.icon] ?? LayoutGrid;
            const active = activeDept === d.code;
            return (
              <button
                key={d.code}
                onClick={() => onSelectDept(d.code)}
                className={`w-full nav-item group ${active ? "active" : ""}`}
                style={active ? { "--dept-color": d.accent, borderLeft: `3px solid ${d.accent}` } as any : { borderLeft: "3px solid transparent" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition"
                     style={{ background: active ? `${d.accent}28` : "rgba(255,255,255,0.04)" }}>
                  <Icon size={16} style={{ color: d.accent }} />
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-[13px] font-semibold leading-none">{d.name}</div>
                  <div className="text-[10px] text-white/30 mt-0.5 leading-none">{d.tagline}</div>
                </div>
                {active && <ChevronRight size={12} style={{ color: d.accent }} className="shrink-0" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer: Ticker button */}
      <div className="px-3 py-3 border-t border-white/[0.07]">
        <button onClick={onOpenTickets}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition hover:bg-white/05 relative"
          style={{ background: "rgba(255,119,34,0.08)", border: "1px solid rgba(255,119,34,0.2)" }}>
          <Flag size={15} className="text-saffron-500" />
          <div className="text-left">
            <div className="text-[12px] font-bold text-saffron-500">Collector Tickers</div>
            <div className="text-[10px] text-white/30">Flag data discrepancies</div>
          </div>
          {ticketCount > 0 && (
            <span className="ml-auto w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                  style={{ background: "#b81d24" }}>{ticketCount}</span>
          )}
        </button>
        <div className="mt-2 text-center text-[9px] text-white/20 uppercase tracking-wider">
          © 2026 MoHUA · UCF v1
        </div>
      </div>
    </aside>
  );
}
