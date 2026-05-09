export type KPICode = "imr" | "mmr" | "oope";

export interface HealthKPIs { imr: number; mmr: number; oope: number; }

export interface CentralHealthSchemes {
  pmjay: { admissions: number; claims_cr: number };
  nhm:   { institutional_delivery_pct: number; phc_funding_cr: number };
  pmsma: { high_risk_pregnancies_lakh: number; anc_checkups: number };
}

export interface StateHealthSchemes {
  // Tamil Nadu (null for non-TN states)
  mtm: number | null;
  ik48: number | null;
  muthulakshmi: number | null;
  // Gujarat (null for non-GJ states)
  ma: number | null;
  chiranjeevi: number | null;
  khilkhilat: number | null;
}

export interface HealthSchemes {
  central: CentralHealthSchemes;
  state: StateHealthSchemes | Record<string, never>;
}

export interface RegionSnapshot {
  region: string;
  parent: string | null;
  level: "state" | "district";
  kpis: HealthKPIs;
  schemes: HealthSchemes;
}

export interface NationalRollup {
  kpis: HealthKPIs;
  schemes: HealthSchemes;
  covered_states: number;
}

export interface FullSnapshot {
  t: number;
  national: NationalRollup;
  states: Record<string, RegionSnapshot>;
}

export interface HistorySeries {
  months: string[];
  series: { imr: number[]; mmr: number[]; oope: number[] };
}

export interface DistrictSnapshotResponse {
  t: number;
  districts: Record<string, RegionSnapshot>;
}

export interface DepartmentMeta {
  code: string;
  name: string;
  accent: string;
  kpis: { code: string; name: string; unit: string; direction: string }[];
  central_schemes: any[];
  tn_schemes: any[];
  gj_schemes: any[];
}

export interface MetaResponse {
  departments: DepartmentMeta[];
  states: string[];
  deep_dive: Record<string, string[]>;
  tick_interval_sec: number;
}

export interface FundingData {
  central: number;
  central_released: number;
  state: number;
  state_released: number;
  central_release_pct?: number;
  state_release_pct?: number;
  total_allocated: number;
  total_released: number;
}
export interface FundingResponse {
  per_state: Record<string, FundingData>;
  national: FundingData;
}

export interface RankRow {
  rank: number;
  region: string;
  value: number;
  level?: string;
  population_m?: number;
}
export interface RankingResponse {
  metric: string;
  state?: string;
  rows: RankRow[];
}

export interface AnomalyEvent {
  region: string;
  level: "state" | "district";
  metric: "imr" | "mmr" | "oope";
  current: number;
  previous: number;
  pct_change: number;
  direction: "up" | "down";
  is_concerning: boolean;
  month: string;
}
export interface AnomaliesResponse {
  events: AnomalyEvent[];
}
