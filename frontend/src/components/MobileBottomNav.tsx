/**
 * MobileBottomNav — fixed bottom navigation bar shown only on mobile (≤768px).
 * Provides: Home | State | Departments (filter sheet) | Tickers
 */
import { useState } from "react";
import { LayoutGrid, ChevronRight, Flag, SlidersHorizontal, X } from "lucide-react";
import { DEPT_REGISTRY } from "@/lib/constants";

const ICONS_MAP: Record<string, string> = {
  health: "💚", education: "📚", wcd: "👩‍👧", revenue: "🏛️",
  energy: "⚡", disaster: "🛡️", tourism: "🗺️",
};

interface MobileBottomNavProps {
  view: "india" | "state" | "district";
  stateName: string | null;
  districtName: string | null;
  filterDept: string | null;
  connected: boolean;
  ticketCount: number;
  onGoIndia: () => void;
  onGoState: () => void;
  onFilterDept: (code: string | null) => void;
  onOpenTickets: () => void;
}

export function MobileBottomNav({
  view, stateName, districtName, filterDept, connected,
  ticketCount, onGoIndia, onGoState, onFilterDept, onOpenTickets,
}: MobileBottomNavProps) {
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);

  const handleDeptSelect = (code: string | null) => {
    onFilterDept(code);
    setDeptSheetOpen(false);
  };

  return (
    <>
      {/* Dept filter bottom sheet */}
      <div className={`dept-filter-sheet ${deptSheetOpen ? "open" : ""}`}>
        <div className="sheet-handle mx-auto mb-3" />
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-semibold">
            {view === "india" ? "Filter by department" : "Rank districts by"}
          </div>
          <button onClick={() => setDeptSheetOpen(false)}
            className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
            <X size={14} className="text-white/60" />
          </button>
        </div>

        {/* Overall */}
        <button
          onClick={() => handleDeptSelect(null)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition ${!filterDept ? "bg-white/10" : "hover:bg-white/05"}`}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px]"
               style={{ background: !filterDept ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.06)" }}>
            <LayoutGrid size={15} className="text-slate-400" />
          </div>
          <span className={`text-[14px] font-semibold ${!filterDept ? "text-white" : "text-white/50"}`}>Overall</span>
          {!filterDept && <span className="ml-auto text-[10px] text-white/30">active</span>}
        </button>

        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {DEPT_REGISTRY.map((d) => {
            const active = filterDept === d.code;
            return (
              <button
                key={d.code}
                onClick={() => handleDeptSelect(d.code)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition text-left"
                style={{
                  background: active ? `${d.accent}22` : "rgba(255,255,255,0.04)",
                  border: active ? `1px solid ${d.accent}44` : "1px solid transparent",
                }}
              >
                <span className="text-[18px]">{ICONS_MAP[d.code] ?? "📊"}</span>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold leading-none"
                       style={{ color: active ? d.accent : "rgba(255,255,255,0.7)" }}>
                    {d.name}
                  </div>
                  <div className="text-[9px] text-white/30 mt-0.5 leading-none truncate">{d.tagline}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Backdrop for dept sheet */}
      {deptSheetOpen && (
        <div className="fixed inset-0 z-[540] bg-black/30 backdrop-blur-sm"
             onClick={() => setDeptSheetOpen(false)} />
      )}

      {/* Bottom nav bar */}
      <nav className="mobile-bottom-nav">
        {/* Home */}
        <button
          className={`mobile-nav-btn ${view === "india" ? "active" : ""}`}
          onClick={onGoIndia}
        >
          <span className="text-[20px] leading-none">🇮🇳</span>
          <span>Home</span>
        </button>

        {/* State — only when a state is selected */}
        {stateName ? (
          <button
            className={`mobile-nav-btn ${view === "state" && !districtName ? "active" : ""}`}
            onClick={onGoState}
          >
            <div className="flex items-center gap-0.5">
              <ChevronRight size={10} className="text-white/30" />
              <span className="text-[11px] font-bold text-white/70 max-w-[56px] truncate leading-tight text-center">
                {stateName.split(" ")[0]}
              </span>
            </div>
            <span>State</span>
          </button>
        ) : (
          <div className="mobile-nav-btn opacity-30 pointer-events-none">
            <span className="text-[20px] leading-none">📍</span>
            <span>State</span>
          </div>
        )}

        {/* Dept filter */}
        <button
          className={`mobile-nav-btn ${filterDept ? "active" : ""}`}
          onClick={() => setDeptSheetOpen(o => !o)}
        >
          {filterDept ? (
            <span className="text-[20px] leading-none">{ICONS_MAP[filterDept] ?? "📊"}</span>
          ) : (
            <SlidersHorizontal size={20} className="text-white/50" />
          )}
          <span>Filter</span>
        </button>

        {/* Live / connection indicator */}
        <div className="mobile-nav-btn pointer-events-none">
          <div className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 pulse-dot" : "bg-white/20"}`} />
            <span className={`text-[9px] font-bold ${connected ? "text-green-400" : "text-white/30"}`}>
              {connected ? "Live" : "..."}
            </span>
          </div>
          <span>Stream</span>
        </div>

        {/* Tickers */}
        <button className="mobile-nav-btn relative" onClick={onOpenTickets}>
          <div className="relative">
            <Flag size={20} className="text-orange-400" />
            {ticketCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {ticketCount}
              </span>
            )}
          </div>
          <span>Tickers</span>
        </button>
      </nav>
    </>
  );
}
