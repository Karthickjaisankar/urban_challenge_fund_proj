/**
 * Department Index Score
 *
 * Formula (for each KPI):
 *   lower_is_better:  kpi_score = (1 − (value − min) / (max − min)) × 100
 *   higher_is_better: kpi_score = ((value − min) / (max − min)) × 100
 *
 * Composite score = simple mean of all KPI scores  →  0–100  (100 = best)
 *
 * Min/max are computed across ALL states/districts being compared so the
 * score is always relative — a state's score means "how good is this
 * state compared to the rest of India on this department?"
 */

export interface KpiMeta {
  code: string;
  direction: "lower_is_better" | "higher_is_better";
  weight?: number; // optional; defaults to 1 (equal weight)
}

/**
 * Compute the composite score for ONE region given its KPI values
 * and the global min/max across all regions.
 */
export function computeScore(
  kpis: Record<string, number>,
  globalMin: Record<string, number>,
  globalMax: Record<string, number>,
  kpiMetas: KpiMeta[],
): number {
  const scores: number[] = [];
  const weights: number[] = [];

  kpiMetas.forEach((k) => {
    const v   = kpis[k.code];
    const min = globalMin[k.code];
    const max = globalMax[k.code];
    if (!Number.isFinite(v) || !Number.isFinite(min) || !Number.isFinite(max)) return;
    if (max === min) { scores.push(50); weights.push(k.weight ?? 1); return; }
    const norm = (v - min) / (max - min) * 100;
    scores.push(k.direction === "lower_is_better" ? 100 - norm : norm);
    weights.push(k.weight ?? 1);
  });

  if (!scores.length) return 50;
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = scores.reduce((sum, s, i) => sum + s * weights[i], 0);
  return Math.round(weightedSum / totalWeight);
}

/**
 * Compute scores for ALL regions in a snapshot.
 * Returns a map: regionName → score (0–100).
 */
export function computeAllScores(
  regionsKpis: Record<string, Record<string, number>>,
  kpiMetas: KpiMeta[],
): Record<string, number> {
  // Build global min/max
  const globalMin: Record<string, number> = {};
  const globalMax: Record<string, number> = {};

  kpiMetas.forEach((k) => {
    const vals = Object.values(regionsKpis)
      .map((r) => r?.[k.code])
      .filter(Number.isFinite) as number[];
    if (!vals.length) return;
    globalMin[k.code] = Math.min(...vals);
    globalMax[k.code] = Math.max(...vals);
  });

  const out: Record<string, number> = {};
  Object.entries(regionsKpis).forEach(([region, kpis]) => {
    out[region] = computeScore(kpis, globalMin, globalMax, kpiMetas);
  });
  return out;
}

/** Grade label for a score */
export function scoreGrade(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: "Excellent", color: "#15803D", bg: "#F0FDF4" };
  if (score >= 65) return { label: "Good",      color: "#16A34A", bg: "#F0FDF4" };
  if (score >= 50) return { label: "Average",   color: "#D97706", bg: "#FFFBEB" };
  if (score >= 35) return { label: "Below Avg", color: "#DC2626", bg: "#FEF2F2" };
  return              { label: "Needs Help",    color: "#991B1B", bg: "#FEF2F2" };
}
