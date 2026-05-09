/**
 * Generates simulated district-level KPI values for any department when
 * real district data is not available (all departments except Health in v0).
 *
 * Each district gets a seeded pseudo-random variation around the state mean.
 * The seed is deterministic (district name × KPI code) so the values are
 * stable across renders and don't shuffle on every tick.
 */

export const TN_DISTRICTS = [
  "Ariyalur", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
  "Dindigul", "Erode", "Kancheepuram", "Kanniyakumari", "Karur",
  "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur",
  "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur",
  "Theni", "Thiruvallur", "Thiruvarur", "Thoothukudi", "Tiruchchirappalli",
  "Tirunelveli Kattabo", "Tiruvannamalai", "Vellore", "Villupuram", "Virudhunagar",
];

export const GJ_DISTRICTS = [
  "Ahmadabad", "Amreli", "Anand", "Aravalli", "Banaskantha",
  "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod",
  "Dang", "Devbhumi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar",
  "Junagadh", "Kachchh", "Kheda", "Mahisagar", "Mehsana",
  "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan",
  "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar",
  "Tapi", "Vadodara", "Valsad",
];

/** Seeded deterministic noise in [0, 1] using a simple hash. */
function seededNoise(district: string, kpiCode: string, seed = 42): number {
  let h = seed;
  const s = district + ":" + kpiCode;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 10_000) / 10_000; // [0, 1)
}

/**
 * Given a state's KPI snapshot, generate plausible district-level values.
 * Each district gets state_value × (0.80 + noise × 0.40) — a ±20% band.
 * Urban centres (Chennai, Coimbatore, Ahmedabad, Surat) are biased toward
 * better outcomes; remote districts toward worse.
 */
const GOOD_DISTRICTS = new Set([
  "Chennai", "Coimbatore", "Kanniyakumari", "Nilgiris", "Thanjavur",
  "Ahmadabad", "Surat", "Gandhinagar", "Vadodara", "Rajkot",
]);
const POOR_DISTRICTS = new Set([
  "Ramanathapuram", "Pudukkottai", "Dharmapuri", "Ariyalur", "Perambalur",
  "Dahod", "Dangs", "Dang", "Narmada", "Chhota Udaipur", "Tapi",
]);

export function simulateDistrictKPIs(
  stateKpis: Record<string, number>,
  districtNames: string[],
  dept: { kpis: { code: string; direction: string }[] },
): { region: string; kpis: Record<string, number> }[] {
  return districtNames.map((district) => {
    const kpis: Record<string, number> = {};
    dept.kpis.forEach(({ code, direction }) => {
      const stateVal = stateKpis[code];
      if (!Number.isFinite(stateVal)) { kpis[code] = NaN; return; }

      const n = seededNoise(district, code);
      // ±20% random band
      let factor = 0.80 + n * 0.40;

      // Bias well-known urban centres toward better outcomes
      if (GOOD_DISTRICTS.has(district)) {
        factor = direction === "lower_is_better"
          ? Math.min(factor, 0.88) // pull down (lower is better)
          : Math.max(factor, 1.08); // pull up (higher is better)
      }
      if (POOR_DISTRICTS.has(district)) {
        factor = direction === "lower_is_better"
          ? Math.max(factor, 1.12)
          : Math.min(factor, 0.92);
      }

      kpis[code] = stateVal * factor;
    });
    return { region: district, kpis };
  });
}
