import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLiveTick } from "@/hooks/useLiveTick";
import { DEPT_REGISTRY } from "@/lib/constants";
import { TN_DISTRICTS, GJ_DISTRICTS } from "@/lib/simulateDistricts";
import { simulateDistrictKPIs } from "@/lib/simulateDistricts";
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

  /* ── Choropleth values ─────────────────────────────────────────────── */
  const choroValues = useMemo(() => {
    if (!primaryKpi) return {};
    if (view === "state") {
      // district level
      if (activeDept === "health" && districtSnap.data) {
        const out: Record<string, number> = {};
        Object.entries(districtSnap.data.districts).forEach(([k, v]: any) => { out[k] = v.kpis?.[primaryKpi]; });
        return out;
      }
      // Simulated district data for non-Health
      if (snapshot?.states?.[stateName!] && dept) {
        const stateKpis = snapshot.states[stateName!].kpis;
        const distList  = stateName === "Gujarat" ? GJ_DISTRICTS : TN_DISTRICTS;
        const simRows   = simulateDistrictKPIs(stateKpis, distList, dept);
        const out: Record<string, number> = {};
        simRows.forEach((r) => { out[r.region] = r.kpis[primaryKpi]; });
        return out;
      }
      return {};
    }
    // India view
    if (!snapshot?.states) return {};
    const out: Record<string, number> = {};
    Object.entries(snapshot.states).forEach(([k, v]: any) => { out[k] = v.kpis?.[primaryKpi]; });
    return out;
  }, [view, primaryKpi, snapshot, districtSnap.data, activeDept, stateName, dept]);

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
        {/* KPI selector pills */}
        {activeDept && dept?.kpis && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[700] flex items-center gap-1 rounded-full p-1"
               style={{ background: "rgba(8,14,22,0.90)", border: "1px solid rgba(255,255,255,0.10)" }}>
            {dept.kpis.map((k: any) => (
              <button key={k.code} onClick={() => setPrimaryKpi(k.code)}
                className="px-3 py-1.5 text-[11px] font-bold rounded-full transition"
                style={{ background: primaryKpi === k.code ? k.accent : "transparent",
                         color: primaryKpi === k.code ? "#000" : "rgba(255,255,255,0.5)" }}>
                {k.short}
              </button>
            ))}
          </div>
        )}

        <ICCCMapCanvas
          geojsonUrl={geoUrl}
          nameProp={nameProp}
          values={choroValues}
          direction={activeKpiMeta?.direction ?? "lower_is_better"}
          selectedState={view === "state" ? stateName : null}
          selectedDistrict={districtName}
          onSelectState={handleSelectState}
          onSelectDistrict={(name) => { setDistrictName(name); }}
          showDistrictMarkers={view === "state"}
          accentColor={dept ? (DEPT_REGISTRY.find(d => d.code === activeDept)?.accent ?? "#00D4AA") : "#00D4AA"}
          metricLabel={primaryKpi ? `${activeKpiMeta?.short ?? primaryKpi} · ${activeKpiMeta?.unit ?? ""}` : ""}
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
