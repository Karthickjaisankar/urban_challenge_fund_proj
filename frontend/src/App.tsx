/**
 * UCF · ICCC Dashboard
 *
 * Navigation flow:
 *   India (home) → click state → State view (district ranking)
 *                              → click district → District detail (all depts)
 *
 * Left sidebar: department FILTER for district ranking (optional).
 * Right panel:  slides in when a state or district is selected.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useLiveTick } from "@/hooks/useLiveTick";
import { DEPT_REGISTRY, STATE_CAPITALS } from "@/lib/constants";
import { computeAllScores, scoreGrade } from "@/lib/scoring";
import { TN_DISTRICTS, GJ_DISTRICTS, simulateDistrictKPIs } from "@/lib/simulateDistricts";
import { LeftSidebar } from "@/components/LeftSidebar";
import { ICCCMapCanvas } from "@/components/ICCCMapCanvas";
import { HomeStatsStrip } from "@/components/HomeStatsStrip";
import { StateDistrictPanel } from "@/components/StateDistrictPanel";
import { DistrictDetailPanel } from "@/components/DistrictDetailPanel";
import { DeptDetailPanel } from "@/components/DeptDetailPanel";
import { TickerInbox } from "@/components/TickerSystem";

/* ════════════════════════════════════════════════════════════════════════ */

type ViewLevel = "india" | "state" | "district";

export default function App() {
  const qc = useQueryClient();
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta, staleTime: 0, gcTime: 0 });

  // Kill stale meta cache
  useEffect(() => {
    if (meta.data) {
      const h = meta.data.departments?.find((d: any) => d.code === "health");
      if (h && !h.central_schemes?.[0]?.value_path) qc.invalidateQueries({ queryKey: ["meta"] });
    }
  }, [meta.data, qc]);

  const deptMetas: any[] = meta.data?.departments ?? [];

  /* ── Navigation state ─────────────────────────────────────────────── */
  const [view, setView]               = useState<ViewLevel>("india");
  const [stateName, setStateName]     = useState<string | null>(null);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [filterDept, setFilterDept]       = useState<string | null>(null);
  const [districtDeptCode, setDistrictDeptCode] = useState<string | null>(null); // dept opened from district detail
  const [tickerOpen, setTickerOpen]       = useState(false);

  /* ── Right panel mode ────────────────────────────────────────────── */
  const rightMode = view === "india"
    ? "none"
    : view === "state"
      ? "state"
      : districtDeptCode
        ? "district-dept"   // dept detail within a district
        : "district";       // district overview (all depts)

  /* ── Data ─────────────────────────────────────────────────────────── */
  // SSE for the filter dept (or health as default for background data)
  const sseCode = filterDept ?? "health";
  const { snapshot: sseSnap, connected } = useLiveTick(sseCode);
  const restSnap = useQuery({ queryKey: ["rest-snap", sseCode], queryFn: () => api.deptSnapshot(sseCode), staleTime: 0 });
  const snapshot = sseSnap ?? restSnap.data ?? null;

  // Per-dept funding for the selected state
  const stateFundingQuery = useQuery({
    queryKey: ["funding", filterDept ?? "health"],
    queryFn: () => api.deptFunding(filterDept ?? "health"),
    staleTime: 60_000,
  });
  const stateFund = stateName ? stateFundingQuery.data?.per_state?.[stateName] : null;

  // District snapshot (Health only — real)
  const districtSnap = useQuery({
    queryKey: ["district-snap", stateName],
    queryFn: () => api.districtSnapshot(stateName!),
    enabled: view !== "india" && !!stateName,
    refetchInterval: 3000,
  });

  // All dept snapshots for district detail (lazy, loads when district selected)
  const [allDeptSnaps, setAllDeptSnaps] = useState<Record<string, any>>({});
  useEffect(() => {
    if (!districtName) return;
    let cancelled = false;
    (async () => {
      const results: Record<string, any> = {};
      for (const d of DEPT_REGISTRY) {
        try { results[d.code] = await api.deptSnapshot(d.code); } catch { /* skip */ }
      }
      if (!cancelled) setAllDeptSnaps(results);
    })();
    return () => { cancelled = true; };
  }, [districtName]);

  // History for district dept detail — use real district history for Health, state history for others
  const deptDetailHistory = useQuery({
    queryKey: ["dept-detail-history", districtDeptCode, districtName, stateName],
    queryFn: () => {
      if (!districtDeptCode || !stateName) return null;
      if (districtDeptCode === "health" && districtName) {
        return api.districtHistory(stateName, districtName);
      }
      return api.deptStateHistory(districtDeptCode, stateName);
    },
    enabled: !!districtDeptCode && !!stateName && rightMode === "district-dept",
  });

  // Ticket stats
  const ticketStats = useQuery({ queryKey: ["tickets-stats"], queryFn: api.ticketsStats, refetchInterval: 15_000 });
  const openTickets = (ticketStats.data?.open ?? 0) + (ticketStats.data?.reviewing ?? 0);

  /* ── Active dept meta + composite scores ─────────────────────────── */
  const filterDeptMeta = deptMetas.find((d) => d.code === filterDept);

  // Compute dept Index Scores for all regions visible on the map.
  // India view:  score per state  (defaults to Health when no dept filter chosen)
  // State view:  score per district
  // activeMeta drives the score — it's the selected filter dept, falling back to Health.
  const activeScoringMeta = filterDeptMeta ?? deptMetas.find((d: any) => d.code === "health");

  const mapScores = useMemo<Record<string, number>>(() => {
    if (!activeScoringMeta?.kpis) return {};

    if (view === "state") {
      // District-level scores
      let regionsKpis: Record<string, Record<string, number>> = {};
      const effectiveDept = filterDept ?? "health";
      if (effectiveDept === "health" && districtSnap.data) {
        Object.entries(districtSnap.data.districts).forEach(([d, s]: any) => {
          regionsKpis[d] = s.kpis ?? {};
        });
      } else if (snapshot?.states?.[stateName!]) {
        const distList = stateName === "Gujarat" ? GJ_DISTRICTS : TN_DISTRICTS;
        const stateKpis = snapshot.states[stateName!].kpis ?? {};
        simulateDistrictKPIs(stateKpis, distList, activeScoringMeta).forEach((r) => {
          regionsKpis[r.region] = r.kpis;
        });
      }
      if (!Object.keys(regionsKpis).length) return {};
      return computeAllScores(regionsKpis, activeScoringMeta.kpis);
    }

    // India view — state-level scores (always visible, defaults to Health)
    if (!snapshot?.states) return {};
    const regionsKpis: Record<string, Record<string, number>> = {};
    Object.entries(snapshot.states).forEach(([s, snap]: any) => {
      regionsKpis[s] = snap.kpis ?? {};
    });
    return computeAllScores(regionsKpis, activeScoringMeta.kpis);
  }, [activeScoringMeta, snapshot, districtSnap.data, view, stateName, filterDept]);
  const filterKpiMeta  = filterDeptMeta?.kpis?.[0];

  /* ── District ranking for StateDistrictPanel ─────────────────────── */
  const districtRows = useMemo(() => {
    if (!stateName) return [];
    const distList = stateName === "Gujarat" ? GJ_DISTRICTS : TN_DISTRICTS;

    // Get KPI values per district
    let distKpis: { region: string; kpis: Record<string, number> }[] = [];

    if (filterDept === "health" && districtSnap.data) {
      // Real Health district data
      distKpis = Object.entries(districtSnap.data.districts).map(([region, s]: any) => ({
        region, kpis: s.kpis ?? {},
      }));
    } else if (filterDeptMeta && snapshot?.states?.[stateName]) {
      // Simulated district data for the filter dept
      const stateKpis = snapshot.states[stateName].kpis ?? {};
      distKpis = simulateDistrictKPIs(stateKpis, distList, filterDeptMeta);
    } else if (!filterDept && snapshot?.states?.[stateName]) {
      // Overall: simulate for health as proxy
      const healthMeta = deptMetas.find(d => d.code === "health");
      if (healthMeta) {
        // Use health KPIs but apply overall weighting
        const stateKpis = snapshot.states[stateName].kpis ?? {};
        distKpis = simulateDistrictKPIs(stateKpis, distList, healthMeta);
      }
    }

    if (!distKpis.length) {
      // Fallback: use district list with placeholder rank
      return distList.map((district, i) => ({ district, value: NaN, score: 50 }));
    }

    // Compute ranking score (0-100, 100=best) based on active KPI or composite
    const kpiCode = filterKpiMeta?.code;
    const kpiDir  = filterKpiMeta?.direction ?? "lower_is_better";
    const vals    = distKpis.map(d => d.kpis?.[kpiCode ?? "imr"] ?? NaN).filter(Number.isFinite);
    const vmin    = vals.length ? Math.min(...vals) : 0;
    const vmax    = vals.length ? Math.max(...vals) : 1;

    const rows = distKpis.map((d) => {
      const v = kpiCode ? (d.kpis?.[kpiCode] ?? NaN) : NaN;
      let score = 50;
      if (Number.isFinite(v) && vmax !== vmin) {
        const norm = (v - vmin) / (vmax - vmin) * 100;
        score = kpiDir === "lower_is_better" ? 100 - norm : norm;
      }
      return { district: d.region, value: v, score };
    });

    // Sort best first (highest score first)
    rows.sort((a, b) => b.score - a.score);
    return rows;
  }, [stateName, filterDept, filterDeptMeta, filterKpiMeta, snapshot, districtSnap.data, deptMetas]);

  /* ── District detail data for DistrictDetailPanel ────────────────── */
  const districtDeptData = useMemo(() => {
    if (!districtName || !stateName) return [];
    const distList = stateName === "Gujarat" ? GJ_DISTRICTS : TN_DISTRICTS;

    return deptMetas.map((meta: any) => {
      // State average KPIs for comparison
      const stateSnap = allDeptSnaps[meta.code]?.states?.[stateName];
      const stateKpis: Record<string, number> = stateSnap?.kpis ?? {};

      // District KPIs
      let distKpis: Record<string, number> = {};

      if (meta.code === "health" && districtSnap.data?.districts?.[districtName]) {
        distKpis = { ...districtSnap.data.districts[districtName].kpis } as Record<string, number>;
      } else if (Object.keys(stateKpis).length > 0) {
        // Simulate district values from state baseline
        const simRows = simulateDistrictKPIs(stateKpis, distList, meta);
        const row = simRows.find(r => r.region === districtName);
        distKpis = row?.kpis ?? {};
      }

      return { code: meta.code, kpis: distKpis, stateKpis };
    });
  }, [districtName, stateName, deptMetas, allDeptSnaps, districtSnap.data]);

  // Estimated district-level funding (state / number of districts)
  const districtFunding = useMemo(() => {
    if (!stateFund || !stateName) return undefined;
    const numDist = (stateName === "Gujarat" ? GJ_DISTRICTS : TN_DISTRICTS).length;
    return {
      central:              stateFund.central / numDist,
      central_released:     stateFund.central_released / numDist,
      state:                stateFund.state / numDist,
      state_released:       stateFund.state_released / numDist,
      central_release_pct:  stateFund.central_release_pct,
      state_release_pct:    stateFund.state_release_pct,
    };
  }, [stateFund, stateName]);

  /* ── Navigation helpers ──────────────────────────────────────────── */
  const handleSelectState = (name: string) => {
    setStateName(name);
    setDistrictName(null);
    setView("state");
  };

  const handleSelectDistrict = (name: string) => {
    setDistrictName(name);
    setView("district");
  };

  const handleGoIndia = () => { setView("india"); setStateName(null); setDistrictName(null); setDistrictDeptCode(null); };
  const handleGoState = () => { setView("state"); setDistrictName(null); setDistrictDeptCode(null); };
  const handleGoDistrict = () => setDistrictDeptCode(null); // back from dept detail → district overview

  /* ── Map URL ─────────────────────────────────────────────────────── */
  const geoUrl   = view === "india"
    ? "/geo/india_states.simplified.geojson"
    : (stateName === "Gujarat" ? "/geo/gj_districts.simplified.geojson" : "/geo/tn_districts.simplified.geojson");
  const nameProp = view === "india" ? "NAME_1" : "NAME_2";

  const accentColor = filterDept
    ? (DEPT_REGISTRY.find(d => d.code === filterDept)?.accent ?? "#3B82F6")
    : "#3B82F6";

  return (
    <div className="app-grid">
      {/* Left sidebar */}
      <LeftSidebar
        view={view}
        stateName={stateName}
        districtName={districtName}
        filterDept={filterDept}
        connected={connected}
        onGoIndia={handleGoIndia}
        onGoState={handleGoState}
        onFilterDept={setFilterDept}
        ticketCount={openTickets}
        onOpenTickets={() => setTickerOpen(true)}
      />

      {/* Center map */}
      <div className="relative h-screen overflow-hidden">
        {/* Breadcrumb badge */}
        {(() => {
          const focusRegion = view === "district" ? districtName : view === "state" ? stateName : null;
          const focusScore  = focusRegion ? mapScores[focusRegion] : undefined;
          const grade       = Number.isFinite(focusScore) ? scoreGrade(focusScore!) : null;
          return (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[700] flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200"
                 style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              <span className="text-[12px] font-bold text-slate-700">
                {view === "india" ? "🇮🇳 All India"
                  : view === "state" ? `📍 ${stateName}`
                  : `📌 ${districtName}`}
              </span>
              {/* Always show which dept score is colouring the map */}
              <span className="text-slate-200 mx-0.5">|</span>
              <span className="text-[11px] font-semibold" style={{ color: filterDept ? accentColor : "#94A3B8" }}>
                {DEPT_REGISTRY.find(d => d.code === (filterDept ?? "health"))?.name} Score
                {!filterDept && <span className="text-[9px] text-slate-400 ml-1">(default)</span>}
              </span>
              {grade && (
                <>
                  <span className="text-slate-200 mx-0.5">|</span>
                  <span className="fig text-[12px] font-black" style={{ color: grade.color }}>
                    {focusScore}/100
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ color: grade.color, background: grade.bg }}>
                    {grade.label}
                  </span>
                </>
              )}
            </div>
          );
        })()}

        <ICCCMapCanvas
          geojsonUrl={geoUrl}
          nameProp={nameProp}
          selectedState={view !== "india" ? stateName : null}
          selectedDistrict={districtName}
          onSelectState={handleSelectState}
          onSelectDistrict={handleSelectDistrict}
          showDistrictMarkers={view !== "india"}
          accentColor={accentColor}
          scores={Object.keys(mapScores).length > 0 ? mapScores : undefined}
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

      {/* Right slide-in panel */}
      <div className={`right-panel ${rightMode !== "none" ? "open" : ""}`}>
        {rightMode === "state" && stateName && (
          <StateDistrictPanel
            stateName={stateName}
            rows={districtRows}
            filterDept={filterDept}
            filterKpi={filterKpiMeta?.name ?? null}
            filterKpiUnit={filterKpiMeta?.unit ?? ""}
            deptMetas={deptMetas}
            fundingState={stateFund}
            onClose={() => setView("india")}
            onSelectDistrict={handleSelectDistrict}
            onChangeDeptFilter={setFilterDept}
            selectedDistrict={districtName}
            scores={mapScores}
          />
        )}
        {rightMode === "district" && districtName && (
          <DistrictDetailPanel
            districtName={districtName}
            stateName={stateName!}
            deptData={districtDeptData}
            deptMetas={deptMetas}
            fundingDistrict={districtFunding}
            onBack={handleGoState}
            onSelectDept={(code) => setDistrictDeptCode(code)}
          />
        )}

        {rightMode === "district-dept" && districtDeptCode && districtName && (() => {
          // Build the district-level snapshot for the selected dept
          const deptSnap  = allDeptSnaps[districtDeptCode];
          // For Health use real district KPIs; for others use simulated from deptData
          const distKpis = districtDeptData.find(d => d.code === districtDeptCode)?.kpis ?? {};
          const distState = districtDeptData.find(d => d.code === districtDeptCode)?.stateKpis ?? {};
          const districtLikeSnap = { kpis: distKpis, schemes: districtSnap.data?.districts?.[districtName]?.schemes ?? deptSnap?.states?.[stateName!]?.schemes };
          const stateAsBaseline  = { kpis: distState };
          const deptMeta = deptMetas.find((d: any) => d.code === districtDeptCode);
          return (
            <DeptDetailPanel
              stateName={`${districtName} · ${stateName}`}
              deptMeta={deptMeta}
              stateSnap={districtLikeSnap}
              nationalSnap={stateAsBaseline}
              history={deptDetailHistory.data ?? null}
              fundingState={districtFunding}
              onBack={handleGoDistrict}
            />
          );
        })()}
      </div>

      {tickerOpen && <TickerInbox onClose={() => setTickerOpen(false)} />}
    </div>
  );
}
