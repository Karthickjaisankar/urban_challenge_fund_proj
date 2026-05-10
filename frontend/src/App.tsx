import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLiveTick } from "@/hooks/useLiveTick";
import { DEPT_REGISTRY } from "@/lib/constants";
import { LeftSidebar } from "@/components/LeftSidebar";
import { ICCCMapCanvas } from "@/components/ICCCMapCanvas";
import { HomeStatsStrip } from "@/components/HomeStatsStrip";
import { StateDeptPanel } from "@/components/StateDeptPanel";
import { DeptDetailPanel } from "@/components/DeptDetailPanel";
import { TickerHeaderButton, TickerInbox } from "@/components/TickerSystem";

/* ── Types ──────────────────────────────────────────────────────────────── */
type ViewLevel = "india" | "state" | "district";

/* ── Helper ──────────────────────────────────────────────────────────────── */
function lookupPath(obj: any, path: string[] | undefined): any {
  if (!Array.isArray(path)) return undefined;
  let cur = obj;
  for (const p of path) { if (cur == null) return undefined; cur = cur[p]; }
  return cur;
}

/* ══════════════════════════════════════════════════════════════════════════
   App
══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const qc = useQueryClient();
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta, staleTime: 0, gcTime: 0 });

  // Kill stale meta cache that's missing value_path
  useEffect(() => {
    if (meta.data) {
      const h = meta.data.departments?.find((d: any) => d.code === "health");
      if (h && !h.central_schemes?.[0]?.value_path) qc.invalidateQueries({ queryKey: ["meta"] });
    }
  }, [meta.data, qc]);

  const deptMetas: any[] = meta.data?.departments ?? [];

  /* ── Navigation state ──────────────────────────────────────────────── */
  const [view, setView]               = useState<ViewLevel>("india");
  const [stateName, setStateName]     = useState<string | null>(null);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [activeDept, setActiveDept]   = useState<string | null>(null);
  const [rightMode, setRightMode]     = useState<"none" | "state" | "dept">("none");
  const [tickerOpen, setTickerOpen]   = useState(false);

  /* ── Data queries ─────────────────────────────────────────────────── */
  // Live SSE tick for the active dept (falls back to health on home view)
  const sseCode = activeDept ?? "health";
  const { snapshot: sseSnap, connected } = useLiveTick(sseCode);
  const restSnap = useQuery({ queryKey: ["rest-snap", sseCode], queryFn: () => api.deptSnapshot(sseCode), staleTime: 0 });
  const snapshot = sseSnap ?? restSnap.data ?? null;

  // Per-dept funding for the selected state
  const deptFunding = useQuery({
    queryKey: ["funding-all"],
    queryFn: async () => {
      const results: Record<string, any> = {};
      for (const d of DEPT_REGISTRY) {
        const f = await api.deptFunding(d.code);
        results[d.code] = f;
      }
      return results;
    },
    staleTime: 60_000,
  });

  // History for the active dept × state
  const history = useQuery({
    queryKey: ["history", activeDept, stateName],
    queryFn: () =>
      stateName && activeDept ? api.deptStateHistory(activeDept, stateName) : api.deptHistory(activeDept ?? "health"),
    enabled: !!activeDept && rightMode === "dept",
  });

  // District snapshot (Health only)
  const districtSnap = useQuery({
    queryKey: ["district-snap", stateName],
    queryFn: () => api.districtSnapshot(stateName!),
    enabled: view === "state" && activeDept === "health" && !!stateName,
    refetchInterval: 3000,
  });

  // Ticket stats for badge
  const ticketStats = useQuery({ queryKey: ["tickets-stats"], queryFn: api.ticketsStats, refetchInterval: 15_000 });
  const openTickets = (ticketStats.data?.open ?? 0) + (ticketStats.data?.reviewing ?? 0);

  /* ── Active dept meta ──────────────────────────────────────────────── */
  const dept = useMemo(
    () => deptMetas.find((d) => d.code === activeDept),
    [deptMetas, activeDept],
  );

  /* ── Active dept KPI selector ─────────────────────────────────────── */
  const [primaryKpi, setPrimaryKpi] = useState<string>("");
  useEffect(() => {
    if (dept?.kpis?.[0]?.code && primaryKpi !== dept.kpis[0].code) {
      setPrimaryKpi(dept.kpis[0].code);
    }
  }, [dept?.code]);

  const activeKpiMeta = dept?.kpis?.find((k: any) => k.code === primaryKpi);

  // No choropleth coloring — map uses neutral fills for all states/districts.
  // Colors are shown only in the right panel cards and KPI tiles, not on the map.

  /* ── Per-state funding for right panel ────────────────────────────── */
  const stateDeptFunding = useMemo(() => {
    if (!stateName || !deptFunding.data) return null;
    const out: Record<string, any> = {};
    DEPT_REGISTRY.forEach(d => {
      const df = deptFunding.data[d.code];
      out[d.code] = df?.per_state?.[stateName] ?? null;
    });
    return out;
  }, [deptFunding.data, stateName]);

  // Pre-fetch all dept snapshots (for multi-dept state panel).
  // We do this lazily once a state is selected to avoid 7 API calls on home view.
  const [allDeptSnaps, setAllDeptSnaps] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!stateName) return;
    let cancelled = false;
    (async () => {
      const results: Record<string, any> = {};
      for (const d of DEPT_REGISTRY) {
        try {
          const snap = await api.deptSnapshot(d.code);
          if (!cancelled) results[d.code] = snap;
        } catch { /* skip silently */ }
      }
      if (!cancelled) setAllDeptSnaps(results);
    })();
    return () => { cancelled = true; };
  }, [stateName]);

  /* ── Navigation helpers ────────────────────────────────────────────── */
  const handleSelectState = (name: string) => {
    setStateName(name);
    setDistrictName(null);
    setView("state");
    setRightMode("state");
    if (!activeDept) setActiveDept("health");
  };

  const handleSelectDept = (code: string) => {
    setActiveDept(code);
    setPrimaryKpi(deptMetas.find((d) => d.code === code)?.kpis?.[0]?.code ?? "");
    if (stateName) setRightMode("dept");
  };

  const handleGoIndia = () => {
    setView("india"); setStateName(null); setDistrictName(null);
    setRightMode("none"); setActiveDept(null);
  };

  const handleGoState = () => {
    setView("state"); setDistrictName(null); setRightMode("state");
  };

  /* ── Geojson URLs ──────────────────────────────────────────────────── */
  const geoUrl = view === "state"
    ? (stateName === "Gujarat"
        ? "/geo/gj_districts.simplified.geojson"
        : "/geo/tn_districts.simplified.geojson")
    : "/geo/india_states.simplified.geojson";
  const nameProp = view === "state" ? "NAME_2" : "NAME_1";

  /* ── Dept context for DeptDetailPanel ─────────────────────────────── */
  const stateSnap = snapshot?.states?.[stateName!];
  const nationalSnap = snapshot?.national;
  const activeFunding = stateName && activeDept ? stateDeptFunding?.[activeDept] : null;

  return (
    <div className="app-grid">
      {/* ── Left sidebar ─────────────────────────────────────────────── */}
      <LeftSidebar
        view={view}
        stateName={stateName}
        districtName={districtName}
        activeDept={activeDept}
        connected={connected}
        onGoIndia={handleGoIndia}
        onGoState={handleGoState}
        onSelectDept={handleSelectDept}
        ticketCount={openTickets}
        onOpenTickets={() => setTickerOpen(true)}
      />

      {/* ── Center: map + overlays ────────────────────────────────────── */}
      <div className="relative h-screen overflow-hidden">
        {/* Dept label badge — top center of map */}
        {activeDept && dept && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[700] flex items-center gap-2 px-4 py-2 rounded-full"
               style={{ background: "rgba(255,255,255,0.92)", border: `1.5px solid ${DEPT_REGISTRY.find(d=>d.code===activeDept)?.accent}40`, boxShadow: "0 2px 8px rgba(0,0,0,0.10)" }}>
            <span className="w-2 h-2 rounded-full" style={{ background: DEPT_REGISTRY.find(d=>d.code===activeDept)?.accent }} />
            <span className="text-[12px] font-bold text-slate-700">{dept.name}</span>
            {stateName && <><span className="text-slate-300 mx-1">›</span><span className="text-[12px] font-semibold text-slate-500">{stateName}</span></>}
          </div>
        )}

        <ICCCMapCanvas
          geojsonUrl={geoUrl}
          nameProp={nameProp}
          selectedState={view === "state" ? stateName : null}
          selectedDistrict={districtName}
          onSelectState={handleSelectState}
          onSelectDistrict={(name) => { setDistrictName(name); }}
          showDistrictMarkers={view === "state"}
          accentColor={DEPT_REGISTRY.find(d => d.code === activeDept)?.accent ?? "#3B82F6"}
        />

        {/* Home stats strip */}
        {view === "india" && snapshot && (
          <HomeStatsStrip
            snapshot={snapshot}
            deptMetas={deptMetas.slice(0, 3)}
            onSelectState={handleSelectState}
          />
        )}
      </div>

      {/* ── Right slide-in panel ──────────────────────────────────────── */}
      <div className={`right-panel ${rightMode !== "none" ? "open" : ""}`}>
        {rightMode === "state" && stateName && (
          <StateDeptPanel
            stateName={stateName}
            snapshot={allDeptSnaps}
            funding={stateDeptFunding}
            deptMetas={deptMetas}
            onClose={() => setRightMode("none")}
            onSelectDept={handleSelectDept}
            activeDept={activeDept}
          />
        )}
        {rightMode === "dept" && dept && (
          <DeptDetailPanel
            stateName={stateName!}
            deptMeta={dept}
            stateSnap={stateSnap}
            nationalSnap={nationalSnap}
            history={history.data ?? null}
            fundingState={activeFunding}
            onBack={() => setRightMode("state")}
          />
        )}
      </div>

      {/* ── Ticker inbox overlay ──────────────────────────────────────── */}
      {tickerOpen && <TickerInbox onClose={() => setTickerOpen(false)} />}
    </div>
  );
}
