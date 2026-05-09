import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft, Building2, Landmark, MapPin,
  HeartPulse, GraduationCap, Baby, Scroll, Siren, Mountain,
} from "lucide-react";
import { api } from "@/lib/api";
import { TN_DISTRICTS, GJ_DISTRICTS, simulateDistrictKPIs } from "@/lib/simulateDistricts";
import { useLiveTick } from "@/hooks/useLiveTick";
import { ChoroplethMap } from "@/components/ChoroplethMap";
import { MapOverlayPanel } from "@/components/MapOverlayPanel";
import { KPITile } from "@/components/KPITile";
import { SchemeTile } from "@/components/SchemeTile";
import { TrendChart } from "@/components/TrendChart";
import { RankingList } from "@/components/RankingList";
import { FundingPanel } from "@/components/FundingPanel";
import { AnomalyStrip } from "@/components/AnomalyStrip";
import { FundingPerformanceScatter, computeScatterRows, type ScatterRow } from "@/components/FundingPerformanceScatter";
import { DisasterAlertPanel } from "@/components/DisasterAlertPanel";
import { TickerButton, TickerHeaderButton } from "@/components/TickerSystem";

// Icon registry — META.icon is a string from the backend, mapped here to lucide components.
const ICONS: Record<string, any> = {
  HeartPulse, GraduationCap, Baby, Scroll, Siren, Mountain,
};

const TN_DEEP_DIVE = ["Vellore", "Coimbatore", "Thoothukudi"];

interface KPIDef {
  code: string;
  name: string;
  short: string;
  unit: string;
  direction: "lower_is_better" | "higher_is_better";
  accent: string;
}
interface SchemeDef {
  code: string;
  name: string;
  metric: string;
  unit: string;
  value_path: string[];
  format: "int" | "pct" | "dec" | "cr";
  accent: string;
}
interface DeptMeta {
  code: string;
  name: string;
  accent: string;
  icon: string;
  kpis: KPIDef[];
  central_schemes: SchemeDef[];
  tn_schemes: SchemeDef[];
  gj_schemes: SchemeDef[];
  tagline_funding?: string;
}

// Helper: pull a value at a path inside the snapshot.schemes structure.
// Returns undefined (not throws) for any null/undefined along the path or when
// path itself is undefined (guards against stale cache with old META format).
function lookupPath(obj: any, path: string[] | undefined): any {
  if (!Array.isArray(path)) return undefined;
  let cur = obj;
  for (const p of path) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function formatSchemeValue(v: any, format: string, unit: string): string {
  if (v == null || (typeof v === "number" && !Number.isFinite(v))) return "—";
  if (format === "pct") return `${Number(v).toFixed(1)} %`;
  if (format === "cr")  return `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 1 })} Cr`;
  if (format === "dec") return `${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
  return Math.round(Number(v)).toLocaleString("en-IN") + (unit && unit !== "count" ? ` ${unit}` : "");
}

export default function App() {
  // Meta — list of all 6 departments.
  // gcTime: 0 → old cache is immediately discarded; staleTime: 0 → always re-fetches.
  // Together they ensure the browser never shows the old format (without value_path)
  // from a stale cache after a backend restart.
  const qc = useQueryClient();
  const meta = useQuery({ queryKey: ["meta"], queryFn: api.meta, staleTime: 0, gcTime: 0 });
  // Safety valve: if cached meta is missing value_path (old format), invalidate immediately.
  useEffect(() => {
    if (meta.data) {
      const h = meta.data.departments?.find((d: any) => d.code === "health");
      if (h && !h.central_schemes?.[0]?.value_path) {
        qc.invalidateQueries({ queryKey: ["meta"] });
      }
    }
  }, [meta.data, qc]);

  const [activeDept, setActiveDept] = useState<string>("health");
  const dept: DeptMeta | undefined = useMemo(
    () => meta.data?.departments.find((d: any) => d.code === activeDept) as DeptMeta | undefined,
    [meta.data, activeDept],
  );

  // Live tick scoped to active dept (SSE — delivers first tick in ~3s)
  const { snapshot: sseSnapshot, connected } = useLiveTick(activeDept);
  // REST fallback — fetches once immediately on dept switch so cards aren't blank
  // while waiting for the first SSE frame.
  const restSnapshot = useQuery({
    queryKey: ["dept-rest-snap", activeDept],
    queryFn:  () => api.deptSnapshot(activeDept),
    staleTime: 0,                 // always fresh on dept switch
    refetchInterval: false,       // SSE handles live updates from here on
  });
  // Prefer the live SSE snapshot; fall back to REST snapshot while SSE is connecting.
  const snapshot = sseSnapshot ?? restSnapshot.data ?? null;

  const funding = useQuery({ queryKey: ["funding", activeDept], queryFn: () => api.deptFunding(activeDept) });
  const anomalies = useQuery({ queryKey: ["anomalies", activeDept], queryFn: () => api.deptAnomalies(activeDept), refetchInterval: 30_000 });

  const [view, setView] = useState<"india" | "state">("india");
  const [stateName, setStateName] = useState<string>("Tamil Nadu");
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [primaryKpi, setPrimaryKpi] = useState<string>(""); // first KPI of active dept by default
  const [popupOpen, setPopupOpen] = useState<boolean>(false);

  const isDisasterTab = activeDept === "disaster";

  // Disaster alerts — fetched always (for header badge) but primarily used in Disaster tab
  const alertsAll = useQuery({ queryKey: ["alerts-all"], queryFn: () => api.alertsAll(), refetchInterval: 60_000 });
  const alertsActive = useQuery({ queryKey: ["alerts-active"], queryFn: () => api.alertsActive(), refetchInterval: 30_000 });
  const alertsDistrict = useQuery({
    queryKey: ["alerts-district", districtName],
    queryFn: () => api.alertsDistrict(districtName!),
    enabled: !!districtName && isDisasterTab,
  });

  // Default primaryKpi to the dept's first KPI whenever the active dept changes.
  // Must be useEffect (not useMemo) because it calls setPrimaryKpi (a side effect).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (dept && (!primaryKpi || !dept.kpis.find((k) => k.code === primaryKpi))) {
      setPrimaryKpi(dept.kpis[0]?.code ?? "");
    }
  }, [dept?.code]);

  // District snapshot (Health-only for v0)
  const districtSnap = useQuery({
    queryKey: ["district-snap", stateName],
    queryFn: () => api.districtSnapshot(stateName),
    enabled: view === "state" && activeDept === "health",
    refetchInterval: 3000,
  });

  // History — national or state level
  const history = useQuery({
    queryKey: districtName
      ? ["hist", "district", stateName, districtName]
      : view === "state"
        ? ["hist", activeDept, stateName]
        : ["hist", activeDept],
    queryFn: () =>
      districtName
        ? api.districtHistory(stateName, districtName)  // health-only district detail for now
        : view === "state"
          ? api.deptStateHistory(activeDept, stateName)
          : api.deptHistory(activeDept),
    enabled: !!dept,
  });

  // inDistrictView is true only when real Health district data is available.
  const inDistrictView = view === "state" && activeDept === "health" && !!districtSnap.data;

  // District list for the focused state (for simulated rankings in non-Health depts)
  const districtList = stateName === "Gujarat" ? GJ_DISTRICTS : TN_DISTRICTS;

  // Multi-KPI rankings.
  //  India view         → rank all 36 states by each KPI.
  //  State view (Health)→ rank real TN/GJ districts from districtSnap.
  //  State view (other) → rank simulated districts (seeded from state baseline + noise).
  const multiRankings = useMemo(() => {
    if (!dept) return null;

    const computeFrom = (entries: { region: string; kpis: Record<string, number> }[]) => {
      const out: Record<string, { rank: number; region: string; value: number }[]> = {};
      dept.kpis.forEach((k: any) => {
        const sorted = entries
          .map((s) => ({ region: s.region, value: s.kpis?.[k.code] }))
          .filter((r) => Number.isFinite(r.value))
          .sort((a, b) =>
            k.direction === "lower_is_better" ? a.value - b.value : b.value - a.value,
          );
        out[k.code] = sorted.map((r, i) => ({ ...r, rank: i + 1 }));
      });
      return out;
    };

    // Real district data (Health only)
    if (inDistrictView && districtSnap.data) {
      return computeFrom(
        Object.entries(districtSnap.data.districts).map(([r, s]: any) => ({ region: r, kpis: s.kpis })),
      );
    }

    // State view for any dept — generate simulated district rankings
    if (view === "state" && snapshot?.states) {
      const stateKpis = snapshot.states[stateName]?.kpis as Record<string, number> | undefined;
      if (stateKpis) {
        const simRows = simulateDistrictKPIs(stateKpis, districtList, dept as any);
        return computeFrom(simRows);
      }
    }

    // India view — rank all states
    if (snapshot?.states) {
      return computeFrom(
        Object.entries(snapshot.states).map(([r, s]: any) => ({ region: r, kpis: s.kpis })),
      );
    }

    return null;
  }, [dept, inDistrictView, snapshot, districtSnap.data, view, stateName, districtList]);

  // Focus reflects whatever is currently selected
  const focused = useMemo(() => {
    if (!snapshot) return null;
    if (view === "state" && activeDept === "health" && districtName && districtSnap.data?.districts[districtName]) {
      const d = districtSnap.data.districts[districtName];
      return { name: districtName, scopeLabel: `District · ${stateName}`, kpis: d.kpis, schemes: d.schemes, level: "district" as const };
    }
    if (view === "state") {
      const s = snapshot.states?.[stateName];
      if (s) return { name: stateName, scopeLabel: "State view", kpis: s.kpis, schemes: s.schemes, level: "state" as const };
    }
    return { name: "All India", scopeLabel: "National roll-up", kpis: snapshot.national.kpis, schemes: snapshot.national.schemes, level: "national" as const };
  }, [snapshot, districtSnap.data, view, stateName, districtName, activeDept]);

  const baseline = focused?.level === "national" ? null : snapshot?.national.kpis;

  // Choropleth values — on Disaster tab, show alert severity (0=green, 1=yellow, 2=orange, 3=red)
  const ALERT_LEVEL_VAL: Record<string, number> = { green: 0, yellow: 1, orange: 2, red: 3 };
  const choroValues = useMemo(() => {
    // Disaster tab: colour by alert severity for TN districts
    if (isDisasterTab && view === "state" && alertsAll.data) {
      const out: Record<string, number> = {};
      alertsAll.data.alerts?.forEach((a: any) => { out[a.district] = ALERT_LEVEL_VAL[a.aggregate] ?? 0; });
      return out;
    }
    if (!primaryKpi) return {};
    if (view === "india") {
      if (!snapshot) return {};
      const out: Record<string, number> = {};
      Object.entries(snapshot.states ?? {}).forEach(([k, v]: any) => { out[k] = v.kpis?.[primaryKpi]; });
      return out;
    }
    if (!districtSnap.data) return {};
    const out: Record<string, number> = {};
    Object.entries(districtSnap.data.districts).forEach(([k, v]: any) => { out[k] = v.kpis?.[primaryKpi]; });
    return out;
  }, [view, snapshot, districtSnap.data, primaryKpi, isDisasterTab, alertsAll.data]);

  const fundingFocus = view === "india"
    ? funding.data?.national
    : funding.data?.per_state[stateName];

  const stateSchemeOwner = stateName === "Gujarat" ? "Gujarat" : "Tamil Nadu";
  const stateSchemeData = snapshot?.states?.[stateSchemeOwner]?.schemes?.state;

  // Choose which list (TN or GJ) to render in the State Schemes section
  const stateSchemesToRender: SchemeDef[] = useMemo(() => {
    if (!dept) return [];
    return stateSchemeOwner === "Gujarat" ? dept.gj_schemes : dept.tn_schemes;
  }, [dept, stateSchemeOwner]);

  // Funding × Performance scatter rows.
  // India view → states × per-capita funding (x) vs composite outcome score (y).
  // State/district view → districts × primary KPI value (x) vs composite score (y).
  //   We use the KPI value as X because all districts share the same estimated
  //   per-capita funding (state pool ÷ districts), making funding a flat x-axis.
  //   Using the primary KPI creates meaningful horizontal spread.
  const scatterRows = useMemo(() => {
    if (!dept) return [];

    if (inDistrictView && districtSnap.data && Object.keys(districtSnap.data.districts).length > 0) {
      const districts = districtSnap.data.districts as Record<string, any>;
      // Use primary KPI value as X so dots spread horizontally.
      const rows = Object.entries(districts).map(([name, d]: any) => ({
        region: name,
        fundingPerCapita: d.kpis?.[primaryKpi] ?? 0,   // re-using x-slot for primary KPI value
        performanceScore: 0,                              // computed below
        population_m: 0.5,                               // uniform for districts
        quadrant: "efficient" as ScatterRow["quadrant"],
      }));
      // Compute composite score per district (same logic as computeScatterRows normalizes states)
      const kpiCodes = dept.kpis.map((k: any) => k.code);
      const kpiDirs  = Object.fromEntries(dept.kpis.map((k: any) => [k.code, k.direction]));
      kpiCodes.forEach((k: string) => {
        const vals = rows.map(r => districts[r.region].kpis?.[k]).filter(Number.isFinite);
        const vmin = Math.min(...vals), vmax = Math.max(...vals);
        rows.forEach((r) => {
          const v = districts[r.region].kpis?.[k];
          if (!Number.isFinite(v)) return;
          const norm = vmax === vmin ? 50 : ((v - vmin) / (vmax - vmin)) * 100;
          r.performanceScore += (kpiDirs[k] === "lower_is_better" ? 100 - norm : norm) / kpiCodes.length;
        });
      });
      // Quadrant vs medians of the primary KPI (x) and composite score (y)
      const xs = rows.map(r => r.fundingPerCapita).sort((a, b) => a - b);
      const ys = rows.map(r => r.performanceScore).sort((a, b) => a - b);
      const xMid = xs[Math.floor(xs.length / 2)] ?? 0;
      const yMid = ys[Math.floor(ys.length / 2)] ?? 0;
      rows.forEach((r) => {
        const lowX = r.fundingPerCapita < xMid;  // low primary-KPI = good (lower-is-better) or bad?
        const activeKpiMeta = dept.kpis.find((k: any) => k.code === primaryKpi);
        const goodAtLowX = activeKpiMeta?.direction === "lower_is_better";
        const goodX = goodAtLowX ? lowX : !lowX;
        const goodY = r.performanceScore >= yMid;
        r.quadrant = goodX
          ? (goodY ? "efficient" : "low-fund-bad")
          : (goodY ? "high-fund-good" : "inefficient");
      });
      return rows;
    }

    // Default: state-level scatter — funding × composite outcome
    if (!snapshot?.states || !funding.data) return [];
    const pop: Record<string, number> = {};
    Object.keys(snapshot.states).forEach((s) => { pop[s] = POP_FALLBACK[s] ?? 10; });
    return computeScatterRows(snapshot.states, funding.data.per_state, pop, stateName);
  }, [snapshot, districtSnap.data, funding.data, dept, stateName, districtName, primaryKpi, inDistrictView]);

  const activeKpiDef = dept?.kpis.find((k) => k.code === primaryKpi);

  return (
    <div className="min-h-screen flex flex-col">
      <Header connected={connected} />
      <div className="tricolor-strip" />

      {/* Department tabs */}
      <nav className="bg-white border-b border-ink2-200/40">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
          {(meta.data?.departments ?? []).map((d: any) => {
            const Icon = ICONS[d.icon] ?? HeartPulse;
            const active = activeDept === d.code;
            return (
              <button
                key={d.code}
                onClick={() => setActiveDept(d.code)}
                className={`relative flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition whitespace-nowrap ${
                  active ? "text-ink2-800" : "text-ink2-400 hover:text-ink2-700"
                }`}
              >
                <Icon size={15} style={{ color: active ? d.accent : undefined }} />
                {d.name}
                {active && (
                  <span className="absolute bottom-0 inset-x-3 h-[2px] rounded-full" style={{ background: d.accent }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 max-w-[1640px] w-full mx-auto p-4 lg:p-6 space-y-5">

        {/* SECTION 1 — Map + Focus */}
        <section className="grid grid-cols-12 gap-4 lg:gap-5">
          <div className="col-span-12 xl:col-span-8 card p-0 overflow-hidden relative h-[440px] sm:h-[560px] xl:h-[680px]">
            {/* KPI selector */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 xl:left-auto xl:right-[68px] xl:translate-x-0 z-[700] flex items-center gap-1 bg-cream-50/95 backdrop-blur border border-ink2-200/40 rounded-full p-1 shadow-card">
              {(dept?.kpis ?? []).map((k) => (
                <button
                  key={k.code}
                  onClick={() => setPrimaryKpi(k.code)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition tracking-wider ${
                    primaryKpi === k.code ? "text-white shadow" : "text-ink2-400 hover:text-ink2-700"
                  }`}
                  style={{ background: primaryKpi === k.code ? k.accent : "transparent" }}
                >
                  {k.short}
                </button>
              ))}
            </div>

            {view === "state" && (
              <button
                onClick={() => { setView("india"); setDistrictName(null); }}
                className="absolute bottom-3 right-3 z-[700] flex items-center gap-1 bg-cream-50/95 backdrop-blur border border-ink2-200/40 rounded-md px-3 py-1.5 shadow-card text-[11px] text-ashoka-500 hover:text-ashoka-700 font-semibold"
              >
                <ChevronLeft size={12} /> Back to India
              </button>
            )}

            {view === "india" ? (
              <ChoroplethMap
                geojsonUrl="/geo/india_states.simplified.geojson"
                nameProp="NAME_1"
                values={choroValues}
                direction={activeKpiDef?.direction ?? "lower_is_better"}
                selected={stateName}
                onSelect={(name) => {
                  setStateName(name);
                  setPopupOpen(true);
                  if (name === "Tamil Nadu" && activeDept === "health") {
                    setView("state"); setDistrictName(null);
                  }
                }}
                labelMode="state"
                scopeLabel={`India · ${dept?.name ?? "Department"}`}
                metricBadge={{
                  label: activeKpiDef?.short ?? "",
                  unit:  activeKpiDef?.unit ?? "",
                  value: focused?.kpis?.[primaryKpi],
                }}
              />
            ) : (
              <ChoroplethMap
                geojsonUrl={`/geo/tn_districts.simplified.geojson`}
                nameProp="NAME_2"
                values={choroValues}
                direction={activeKpiDef?.direction ?? "lower_is_better"}
                selected={districtName}
                onSelect={(name) => { setDistrictName(name); setPopupOpen(true); }}
                highlightRegions={TN_DEEP_DIVE}
                labelMode="district"
                scopeLabel={`${stateName} · District view`}
                metricBadge={{
                  label: activeKpiDef?.short ?? "",
                  unit:  activeKpiDef?.unit ?? "",
                  value: focused?.kpis?.[primaryKpi],
                }}
              />
            )}

            {/* Popup overlay */}
            {popupOpen && focused && focused.level !== "national" && dept && (
              <MapOverlayPanel
                region={focused.name}
                parent={view === "state" ? stateName : null}
                level={focused.level}
                kpis={dept.kpis.map((k) => ({
                  code: k.code as any,
                  label: k.short,
                  unit: k.unit,
                  value: focused.kpis?.[k.code],
                  baseline: baseline?.[k.code] ?? null,
                  accent: k.accent,
                  direction: k.direction,
                }))}
                rank={null}
                totalRanked={null}
                centralSchemes={dept.central_schemes.map((s) => ({
                  name: s.name,
                  metric: s.metric,
                  value: formatSchemeValue(lookupPath(focused.schemes, s.value_path), s.format, s.unit),
                  tier: "central" as const,
                }))}
                stateSchemes={
                  ((focused.level === "state" || focused.level === "district") &&
                   (stateName === "Tamil Nadu" || stateName === "Gujarat"))
                    ? (stateName === "Gujarat" ? dept.gj_schemes : dept.tn_schemes).map((s) => ({
                        name: s.name,
                        metric: s.metric,
                        value: formatSchemeValue(lookupPath(focused.schemes, s.value_path), s.format, s.unit),
                        tier: "state" as const,
                      }))
                    : []
                }
                stateSchemeOwner={(stateName === "Gujarat" || stateName === "Tamil Nadu") ? stateName : undefined}
                fundingTotalCr={fundingFocus?.total_allocated}
                fundingReleasedPct={
                  fundingFocus
                    ? Math.round(fundingFocus.total_released / Math.max(1, fundingFocus.total_allocated) * 100)
                    : undefined
                }
                position="bottom-right"
                onClose={() => setPopupOpen(false)}
              />
            )}
          </div>

          {/* Right column */}
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-4">
            <FocusHeader focused={focused} dept={dept} />

            <div>
              <div
                className="section-banner"
                style={{
                  "--banner-from": dept?.accent ?? "#0c4ca3",
                  "--banner-to":   (dept?.accent ?? "#0c4ca3") + "cc",
                  "--banner-shadow": (dept?.accent ?? "#0c4ca3") + "55",
                } as any}
              >
                <span className="section-banner-title">Main Indexes · {dept?.name ?? "—"}</span>
                <span className="section-banner-meta">{dept?.kpis.length ?? 0} KPIs</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(dept?.kpis ?? []).map((k) => (
                  <div key={k.code} className="relative group">
                    <KPITile
                      label={k.short}
                      unit={k.unit}
                      value={focused?.kpis?.[k.code] ?? NaN}
                      baseline={baseline?.[k.code]}
                      direction={k.direction}
                      accent={k.accent}
                      size="md"
                    />
                    {/* Ticker flag button — visible on hover */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <TickerButton
                        district={focused?.level !== "national" ? focused?.name ?? "" : ""}
                        state={stateName}
                        department={activeDept}
                        kpiCode={k.code}
                        kpiLabel={k.name}
                        currentValue={focused?.kpis?.[k.code] ?? 0}
                        unit={k.unit}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {fundingFocus && (
              <FundingPanel
                scope={focused?.name ?? "All India"}
                data={fundingFocus}
                fy="FY 2026-27"
              />
            )}
          </div>
        </section>

        {/* DISASTER ALERT PANEL — only shown on Disaster Management tab */}
        {isDisasterTab && alertsAll.data && alertsActive.data && (
          <section>
            <div
              className="section-banner mb-4"
              style={{
                "--banner-from": "#b81d24",
                "--banner-to":   "#7d0d12",
                "--banner-shadow": "rgba(184,29,36,0.5)",
              } as any}
            >
              <span className="section-banner-title flex items-center gap-2">
                🚨 Live Disaster Alerts · Tamil Nadu Districts
              </span>
              <span className="section-banner-meta">
                {alertsActive.data.events?.length ?? 0} active orange/red events
              </span>
            </div>
            <DisasterAlertPanel
              allAlerts={alertsAll.data}
              activeEvents={alertsActive.data}
              selectedDistrict={districtName}
              onSelectDistrict={(name) => {
                setDistrictName(name);
                setStateName("Tamil Nadu");
                if (view !== "state") setView("state");
                setPopupOpen(false);
              }}
            />
          </section>
        )}

        {/* SECTION 2 — Multi-KPI rankings */}
        <section>
          <div
            className="section-banner"
            style={{
              "--banner-from": "#0c4ca3",
              "--banner-to":   "#062b66",
              "--banner-shadow": "rgba(12,76,163,0.45)",
            } as any}
          >
            <span className="section-banner-title">Performance ranking · all states (best → worst on each KPI)</span>
            <span className="section-banner-meta">
              {inDistrictView
                ? `${stateName} · districts (real data)`
                : view === "state"
                  ? `${stateName} · districts (simulated)`
                  : "All India · states"
              } · {dept?.name}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(dept?.kpis ?? []).map((k) => (
              <RankingList
                key={k.code}
                rows={multiRankings ? multiRankings[k.code] ?? [] : []}
                metric={k.short}
                unit={k.unit}
                direction={k.direction}
                accent={k.accent}
                selectedRegion={view === "india" ? stateName : districtName}
                onSelect={(region) => {
                  if (view === "india") {
                    setStateName(region);
                    setPopupOpen(true);
                    if (region === "Tamil Nadu" && activeDept === "health") { setView("state"); setDistrictName(null); }
                  } else {
                    setDistrictName(region);
                    setPopupOpen(true);
                  }
                }}
              />
            ))}
          </div>
        </section>

        {/* SECTION 3 — Funding × Performance scatter (decision-support) */}
        {scatterRows.length > 0 && (
          <section>
            <FundingPerformanceScatter
              rows={scatterRows}
              selected={inDistrictView ? districtName : stateName}
              scopeLabel={inDistrictView ? `${stateName} · districts` : "All India · states"}
              xLabel={inDistrictView
                ? `Primary KPI value — ${dept?.kpis.find((k: any) => k.code === primaryKpi)?.short ?? primaryKpi} (${dept?.kpis.find((k: any) => k.code === primaryKpi)?.unit ?? ""})`
                : "Per-capita spend (₹)"
              }
              onSelect={(region) => {
                if (inDistrictView) {
                  setDistrictName(region);
                } else {
                  setStateName(region);
                }
                setPopupOpen(true);
              }}
            />
          </section>
        )}

        {/* SECTION 4 — Anomalies
            When drilled into a state (view=state or district selected), filter events
            to show only that state's anomalies — not the full national list.        */}
        {anomalies.data && anomalies.data.events.length > 0 && (
          <section>
            <div
              className="section-banner"
              style={{
                "--banner-from": "#b81d24",
                "--banner-to":   "#7d0d12",
                "--banner-shadow": "rgba(184,29,36,0.45)",
              } as any}
            >
              <span className="section-banner-title">Anomalies · last month MoM swings · {dept?.name}</span>
              <span className="section-banner-meta">{anomalies.data.events.length} events</span>
            </div>
            <AnomalyStrip
              events={
                // When drilled into a state or district, only show anomaly events for
                // that state (not the full 38-event national list). In India overview,
                // show all events so officers can spot national patterns.
                view === "state"
                  ? anomalies.data.events.filter((e: any) => e.region === stateName)
                  : anomalies.data.events
              }
              kpis={(dept?.kpis ?? []).map((k) => ({ code: k.code, label: k.short, accent: k.accent, direction: k.direction }))}
              selected={view === "india" ? stateName : districtName}
              onSelect={(region) => {
                if (snapshot?.states[region]) {
                  setStateName(region);
                  setPopupOpen(true);
                }
              }}
            />
          </section>
        )}

        {/* SECTION 5 — Central schemes */}
        <section>
          <div
            className="section-banner"
            style={{
              "--banner-from": "#ff7722",
              "--banner-to":   "#b94d0a",
              "--banner-shadow": "rgba(255,119,34,0.45)",
            } as any}
          >
            <span className="section-banner-title flex items-center gap-2">
              <Landmark size={14} />
              Central Government Schemes · {dept?.name}
            </span>
            <span className="section-banner-meta">{focused?.scopeLabel}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(dept?.central_schemes ?? []).map((s) => {
              const v = lookupPath(focused?.schemes, s.value_path);
              return (
                <SchemeTile
                  key={s.code}
                  name={s.name}
                  metric={`${s.metric} (${s.unit})`}
                  value={typeof v === "number" ? v : NaN}
                  format={s.format as any}
                  accent={s.accent}
                  ribbon="Central"
                  ribbonTone="central"
                />
              );
            })}
          </div>
        </section>

        {/* SECTION 6 — State schemes */}
        <section>
          <div
            className="section-banner"
            style={{
              "--banner-from": "#128807",
              "--banner-to":   "#0a4f04",
              "--banner-shadow": "rgba(18,136,7,0.45)",
            } as any}
          >
            <span className="section-banner-title flex items-center gap-2">
              <Building2 size={14} />
              State Government Schemes · {stateSchemeOwner}
            </span>
            <span className="section-banner-meta">live · {stateSchemeOwner}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stateSchemesToRender.map((s) => {
              const v = lookupPath({ state: stateSchemeData }, s.value_path);
              return (
                <SchemeTile
                  key={s.code}
                  name={s.name}
                  metric={`${s.metric} (${s.unit})`}
                  value={typeof v === "number" ? v : NaN}
                  format={s.format as any}
                  accent={s.accent}
                  ribbon={stateSchemeOwner}
                  ribbonTone="state"
                />
              );
            })}
          </div>
          {stateName !== "Tamil Nadu" && stateName !== "Gujarat" && (
            <div className="mt-2 text-[11px] text-ink2-400">
              State-specific scheme data is configured for <span className="font-semibold text-emerald2-600">Tamil Nadu</span> and <span className="font-semibold text-saffron-700">Gujarat</span> in v0. Showing {stateSchemeOwner} as reference.
            </div>
          )}
        </section>

        {/* SECTION 7 — 24-month trend */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {history.data && (dept?.kpis ?? []).map((k) => (
            <TrendChart
              key={k.code}
              data={history.data!}
              metric={k.code as any}
              label={k.name}
              unit={k.unit}
              accent={k.accent}
            />
          ))}
        </section>

      </main>

      <Footer covered={meta.data?.states.length ?? 0} />
    </div>
  );
}

// Approximate state populations in millions for the scatter chart's per-capita math.
// (Keeps the frontend free of an extra round-trip; same values live in baselines.py.)
const POP_FALLBACK: Record<string, number> = {
  "Andhra Pradesh": 53.0, "Arunachal Pradesh": 1.5, "Assam": 35.6, "Bihar": 124.8,
  "Chhattisgarh": 29.5, "Goa": 1.6, "Gujarat": 70.0, "Haryana": 30.0,
  "Himachal Pradesh": 7.4, "Jammu and Kashmir": 13.6, "Jharkhand": 38.6,
  "Karnataka": 67.5, "Kerala": 35.7, "Madhya Pradesh": 85.0, "Maharashtra": 124.0,
  "Manipur": 3.3, "Meghalaya": 3.4, "Mizoram": 1.2, "Nagaland": 2.2,
  "Odisha": 46.4, "Punjab": 30.9, "Rajasthan": 81.0, "Sikkim": 0.7,
  "Tamil Nadu": 76.8, "Telangana": 38.5, "Tripura": 4.2,
  "Uttar Pradesh": 235.0, "Uttarakhand": 11.8, "West Bengal": 99.6,
  "Andaman and Nicobar": 0.4, "Chandigarh": 1.2, "Dadra and Nagar Haveli": 0.4,
  "Daman and Diu": 0.3, "Delhi": 31.2, "Lakshadweep": 0.07, "Puducherry": 1.6,
};

/* ============== Header / FocusHeader / Footer ============== */

function Header({ connected }: { connected: boolean }) {
  return (
    <header className="bg-cream-50 border-b border-ink2-200/40">
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="display text-xl sm:text-2xl font-black tracking-tight text-ink2-800 whitespace-nowrap">
            UCF<span className="text-saffron-700">·</span>Performance
          </div>
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink2-400 font-semibold border-l border-ink2-200 pl-3 hidden lg:block">
            Performance & Allocation Dashboard
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink2-400 font-semibold flex items-center gap-1 hidden sm:flex">
            <MapPin size={11} className="text-emerald2-600" />
            <span className="hidden md:inline">Government of India · </span>MoHUA
          </span>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald2-500 pulse-dot" : "bg-ink2-200"}`} />
            <span className={connected ? "text-emerald2-600 font-semibold" : "text-ink2-400"}>
              {connected ? "Live · 3s" : "Reconnecting…"}
            </span>
          </div>
          <TickerHeaderButton />
          <span className="text-[11px] font-mono text-ink2-400 hidden sm:inline">
            {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>
      </div>
    </header>
  );
}

function FocusHeader({ focused, dept }: { focused: any; dept?: DeptMeta }) {
  if (!focused) {
    return (
      <div className="card p-4">
        <div className="skeleton h-3 w-24 mb-2" />
        <div className="skeleton h-8 w-48" />
      </div>
    );
  }
  const accent = dept?.accent ?? "#0c4ca3";
  return (
    <div
      className="card relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${accent}1a 0%, #ffffff 60%)` }}
    >
      <div className="px-5 py-2 text-white flex items-center justify-between"
           style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}cc 100%)` }}>
        <span className="text-[10px] uppercase tracking-[0.22em] font-bold">{focused.scopeLabel}</span>
        <span className="text-[10px] font-mono opacity-90">live · {dept?.name}</span>
      </div>
      <div className="px-5 py-4">
        <div className="display text-4xl text-ink2-900 leading-tight" style={{ fontWeight: 900, color: accent }}>
          {focused.name}
        </div>
        <div className="text-[11px] text-ink2-400 mt-1 font-mono uppercase tracking-wider">
          {focused.level === "national" ? "All-states roll-up" : focused.level === "state" ? "State-level snapshot" : "District-level snapshot"}
        </div>
      </div>
    </div>
  );
}

function Footer({ covered }: { covered: number }) {
  return (
    <footer className="border-t border-ink2-200/40 bg-cream-50">
      <div className="max-w-[1640px] mx-auto px-6 py-2 flex items-center justify-between text-[10px] font-mono text-ink2-400">
        <span>States covered: <span className="text-ink2-700 font-semibold">{covered}</span> · Departments: 6 · Deep-dive: <span className="text-ashoka-500">Tamil Nadu</span> (Health districts)</span>
        <span>Anchored to NFHS-5 / SRS / NHA / U-DISE+ / Census / NDMA / MoT · For Central, State, District officials</span>
      </div>
    </footer>
  );
}
