import type {
  AnomaliesResponse, DistrictSnapshotResponse, FullSnapshot, FundingData, FundingResponse,
  HistorySeries, MetaResponse, RankingResponse,
} from "./types";

async function get<T>(path: string): Promise<T> {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

export const api = {
  meta:                () => get<MetaResponse>("/api/meta"),
  // Generic department endpoints — take a dept code (health/education/wcd/...)
  deptSnapshot:        (code: string) => get<any>(`/api/dept/${code}/snapshot`),
  deptHistory:         (code: string) => get<HistorySeries>(`/api/dept/${code}/history`),
  deptStateHistory:    (code: string, s: string) => get<HistorySeries>(`/api/dept/${code}/state/${encodeURIComponent(s)}/history`),
  deptFunding:         (code: string) => get<FundingResponse>(`/api/dept/${code}/funding`),
  deptAnomalies:       (code: string) => get<AnomaliesResponse>(`/api/dept/${code}/anomalies`),
  // Health-specific district drill-down
  districtSnapshot:    (s: string) => get<DistrictSnapshotResponse>(`/api/health/district/${encodeURIComponent(s)}/snapshot`),
  districtHistory:     (s: string, d: string) =>
    get<HistorySeries>(`/api/health/district/${encodeURIComponent(s)}/${encodeURIComponent(d)}/history`),
  // Disaster alerts
  alertsAll:           () => get<any>("/api/alerts/all"),
  alertsActive:        () => get<any>("/api/alerts/active"),
  alertsDistrict:      (district: string) => get<any>(`/api/alerts/district/${encodeURIComponent(district)}`),
  // Ticker system
  ticketsCreate:       (body: any) => fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
  ticketsList:         (params?: { district?: string; status?: string; department?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return get<any>(`/api/tickets${q ? "?" + q : ""}`);
  },
  ticketsStats:        () => get<any>("/api/tickets/stats"),
  ticketUpdate:        (id: string, body: any) => fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json()),
};
