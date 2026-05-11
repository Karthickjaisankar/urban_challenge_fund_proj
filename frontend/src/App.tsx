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
// useLiveTick removed — values update monthly, REST snapshots are sufficient
import { DEPT_REGISTRY, STATE_CAPITALS, GEOJSON_TO_BACKEND } from "@/lib/constants";
import { computeAllScores, computeScoreWithBreakdown, scoreGrade } from "@/lib/scoring";
import { TN_DISTRICTS, GJ_DISTRICTS, simulateDistrictKPIs } from "@/lib/simulateDistricts";
import { LeftSidebar } from "@/components/LeftSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ICCCMapCanvas } from "@/components/ICCCMapCanvas";
import { HomeStatsStrip } from "@/components/HomeStatsStrip";
import { StateDistrictPanel } from "@/components/StateDistrictPanel";
import { DistrictDetailPanel } from "@/components/DistrictDetailPanel";
import { DeptDetailPanel } from "@/components/DeptDetailPanel";
import { TickerInbox } from "@/components/TickerSystem";
import { TourismLandmarkOverlay } from "@/components/TourismLandmarkOverlay";
import { TN_LANDMARKS, GJ_LANDMARKS } from "@/lib/tourismLandmarks";

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

  /* ── Mobile detection ────────────────────────────────────────────── */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ── Right panel mode ────────────────────────────────────────────── */
  const rightMode = view === "india"
    ? "none"
    : view === "state"
      ? "state"
      : districtDeptCode
        ? "district-dept"   // dept detail within a district
        : "district";       // district overview (all depts)

  /* ── Data ─────────────────────────────────────────────────────────── */
  // Static REST snapshot — KPIs update monthly in practice, SSE not needed.
  // 15-min staleTime keeps pages fresh across navigation without hammering the API.
  const deptCode = filterDept ?? "health";
  const deptSnapQuery = useQuery({
    queryKey: ["dept-snap", deptCode],
    queryFn:  () => api.deptSnapshot(deptCode),
    staleTime: 15 * 60 * 1000,
    gcTime:   30 * 60 * 1000,
  });
  const snapshot  = deptSnapQuery.data ?? null;
  const connected = !deptSnapQuery.isLoading && !!snapshot;

  // Per-dept funding for the selected state
  // Funding for the currently active dept (or the dept open in detail view)
  const fundingDeptCode = districtDeptCode ?? filterDept ?? "health";
  const stateFundingQuery = useQuery({
    queryKey: ["funding", fundingDeptCode],
    queryFn: () => api.deptFunding(fundingDeptCode),
    staleTime: 15 * 60 * 1000,
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

    if (view === "state" || view === "district") {
      // District-level scores (both state-view and district-view show district geojson)
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
    const scores = computeAllScores(regionsKpis, activeScoringMeta.kpis);
    // Add GeoJSON alias entries so old-named polygons also get coloured
    Object.entries(GEOJSON_TO_BACKEND).forEach(([geoName, backendName]) => {
      if (scores[backendName] !== undefined) scores[geoName] = scores[backendName];
    });
    return scores;
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
    const central    = stateFund.central / numDist;
    const state      = stateFund.state   / numDist;
    const cenRel     = stateFund.central_released / numDist;
    const stateRel   = stateFund.state_released   / numDist;
    return {
      central,
      central_released:     cenRel,
      state,
      state_released:       stateRel,
      central_release_pct:  stateFund.central_release_pct,
      state_release_pct:    stateFund.state_release_pct,
      total_allocated:      central + state,
      total_released:       cenRel  + stateRel,
    };
  }, [stateFund, stateName]);

  /* ── Benchmark KPIs for comparison in score breakdown ────────────── */
  // State view → compare against national average (snapshot.national.kpis)
  // District view → compare against state average (snapshot.states[stateName].kpis)
  const benchmarkKpis: Record<string, number> = useMemo(() => {
    if (!snapshot) return {};
    if (view === "district" && stateName) {
      return (snapshot.states?.[stateName]?.kpis ?? {}) as Record<string, number>;
    }
    return (snapshot.national?.kpis ?? {}) as Record<string, number>;
  }, [snapshot, view, stateName]);

  const benchmarkLabel = view === "district" && stateName
    ? `${stateName} avg`
    : "India avg";

  /* ── Score breakdown for the focused region (state panel header) ── */
  const focusedScoreBreakdown = useMemo(() => {
    if (!activeScoringMeta?.kpis || !snapshot?.states) return null;
    const focusRegion = view === "district" ? districtName : view === "state" ? stateName : null;
    if (!focusRegion) return null;

    // Find the KPI values for the focused region
    let regionKpis: Record<string, number> = {};
    if (view === "district" && activeScoringMeta.code === "health" && districtSnap.data?.districts?.[focusRegion]) {
      regionKpis = { ...districtSnap.data.districts[focusRegion].kpis } as Record<string, number>;
    } else {
      regionKpis = snapshot.states[focusRegion]?.kpis ?? {};
    }

    // Compute global min/max from all state KPIs in snapshot
    const allKpis: Record<string, Record<string, number>> = {};
    Object.entries(snapshot.states).forEach(([s, snap]: any) => { allKpis[s] = snap.kpis ?? {}; });
    const gMin: Record<string, number> = {};
    const gMax: Record<string, number> = {};
    activeScoringMeta.kpis.forEach((k: any) => {
      const vals = Object.values(allKpis).map((r) => r?.[k.code]).filter(Number.isFinite) as number[];
      if (vals.length) { gMin[k.code] = Math.min(...vals); gMax[k.code] = Math.max(...vals); }
    });

    return computeScoreWithBreakdown(regionKpis, gMin, gMax, activeScoringMeta.kpis);
  }, [activeScoringMeta, snapshot, districtSnap.data, view, stateName, districtName]);

  /* ── Navigation helpers ──────────────────────────────────────────── */
  const handleSelectState = (name: string) => {
    // Normalise GeoJSON old names to current official names
    const canonical = GEOJSON_TO_BACKEND[name] ?? name;
    setStateName(canonical);
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

        {/* Tourism landmark image overlay — shown for both tourism entry paths:
             1) Tourism filter active in left sidebar + district selected
             2) Tourism dept card opened from district detail (districtDeptCode === "tourism") */}
        {(filterDept === "tourism" || districtDeptCode === "tourism") && districtName && stateName && (() => {
          const landmarks = stateName === "Gujarat" ? GJ_LANDMARKS : TN_LANDMARKS;
          const landmark = landmarks[districtName];
          return landmark ? (
            <TourismLandmarkOverlay
              landmark={landmark}
              districtName={districtName}
              isMobile={isMobile}
              onClose={() => districtDeptCode === "tourism" ? setDistrictDeptCode(null) : setDistrictName(null)}
            />
          ) : null;
        })()}

        {/* Home stats strip — desktop only (overlaps map on mobile) */}
        {!isMobile && view === "india" && snapshot && (
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
            scoreBreakdown={focusedScoreBreakdown ?? undefined}
            scoreDeptName={activeScoringMeta?.name ?? "Health"}
            benchmarkKpis={benchmarkKpis}
            benchmarkLabel={benchmarkLabel}
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
          // Use the ACTIVE DEPT's state-level schemes (not Health district schemes).
          // districtSnap only has Health schemes; for Tourism/Education/etc. we must
          // pull from the dept-specific snapshot.
          const districtLikeSnap = {
            kpis: distKpis,
            schemes: deptSnap?.states?.[stateName!]?.schemes    // dept-specific first
              ?? districtSnap.data?.districts?.[districtName]?.schemes, // health fallback
          };
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

      {/* Mobile bottom navigation — only rendered on small screens */}
      {isMobile && (
        <MobileBottomNav
          view={view}
          stateName={stateName}
          districtName={districtName}
          filterDept={filterDept}
          connected={connected}
          ticketCount={openTickets}
          onGoIndia={handleGoIndia}
          onGoState={handleGoState}
          onFilterDept={setFilterDept}
          onOpenTickets={() => setTickerOpen(true)}
        />
      )}
    </div>
  );
}
