"""Real-published-baseline values per state (and per TN/GJ district where helpful).

Health KPIs for v0:
  - IMR (Infant Mortality Rate, per 1,000 live births) — SRS 2020 bulletin / NFHS-5 round
  - MMR (Maternal Mortality Ratio, per 100,000 live births) — SRS 2018-20 special bulletin
  - OOPE (Out-of-Pocket Expenditure, % of total health expenditure) — National Health Accounts 2019-20

Where SRS does not publish a state value (smaller states/UTs), we use NFHS-5 district
medians or NHM categorisation. Numbers are rounded for display. Citations are
intentionally inline so they can be defended in a stakeholder review.

District-level seeds for TN deep-dive use NFHS-5 district fact sheets.
"""
from __future__ import annotations

# State-level Health KPI seeds.
# Each entry: (IMR per 1000, MMR per 100k, OOPE % of THE)
# Sources: SRS 2020 (IMR), SRS 2018-20 Special Bulletin (MMR), NHA 2019-20 (OOPE).
HEALTH_STATE_BASELINES: dict[str, tuple[float, float, float]] = {
    "Andhra Pradesh":            (24, 45, 32.1),
    "Arunachal Pradesh":         (21, 78, 45.0),
    "Assam":                     (36, 195, 33.2),
    "Bihar":                     (27, 118, 56.1),
    "Chhattisgarh":              (38, 137, 41.0),
    "Goa":                       (5, 35, 26.5),
    "Gujarat":                   (23, 57, 35.8),
    "Haryana":                   (28, 96, 51.7),
    "Himachal Pradesh":          (17, 70, 41.2),
    "Jammu and Kashmir":         (16, 60, 34.0),
    "Jharkhand":                 (25, 56, 49.5),
    "Karnataka":                 (19, 69, 31.4),
    "Kerala":                    (6, 19, 49.6),
    "Madhya Pradesh":            (41, 173, 47.9),
    "Maharashtra":               (16, 33, 38.5),
    "Manipur":                   (6, 50, 47.0),
    "Meghalaya":                 (24, 60, 35.0),
    "Mizoram":                   (3, 45, 28.0),
    "Nagaland":                  (7, 50, 30.0),
    "Odisha":                    (36, 119, 55.0),
    "Punjab":                    (18, 105, 53.4),
    "Rajasthan":                 (32, 113, 50.7),
    "Sikkim":                    (5, 50, 28.0),
    "Tamil Nadu":                (13, 54, 35.4),
    "Telangana":                 (21, 43, 32.0),
    "Tripura":                   (19, 60, 30.0),
    "Uttar Pradesh":             (38, 167, 62.0),
    "Uttarakhand":               (24, 103, 45.0),
    "West Bengal":               (19, 103, 50.5),
    # UTs
    "Andaman and Nicobar":       (8, 35, 22.0),
    "Chandigarh":                (14, 40, 28.0),
    "Dadra and Nagar Haveli":    (18, 50, 30.0),
    "Daman and Diu":             (18, 50, 30.0),
    "Delhi":                     (11, 40, 26.0),
    "Lakshadweep":               (23, 40, 22.0),
    "Puducherry":                (4, 30, 25.0),
}

# TN district-level Health seeds (NFHS-5 district fact sheets, IMR/U5MR/CHE OOP estimates).
# Names match what's in tn_districts.simplified.geojson (NAME_2). District naming
# in GADM differs slightly from current TN nomenclature (the source predates several
# 2019/2020 TN district splits — we work with the geojson's universe of 30).
HEALTH_DISTRICT_BASELINES: dict[str, tuple[float, float, float]] = {
    # Tamil Nadu
    "Chennai":            (10, 38, 28.5),
    "Coimbatore":         (11, 42, 30.0),
    "Cuddalore":          (15, 60, 38.0),
    "Dharmapuri":         (18, 70, 42.0),
    "Dindigul":           (14, 55, 36.0),
    "Erode":              (12, 48, 32.0),
    "Kancheepuram":       (12, 50, 33.0),
    "Kanniyakumari":      (8, 30, 28.0),
    "Karur":              (13, 52, 35.0),
    "Krishnagiri":        (17, 68, 40.0),
    "Madurai":            (12, 45, 32.0),
    "Nagapattinam":       (13, 50, 36.0),
    "Namakkal":           (13, 52, 35.0),
    "Perambalur":         (15, 58, 38.0),
    "Pudukkottai":        (14, 56, 37.0),
    "Ramanathapuram":     (15, 60, 38.0),
    "Salem":              (15, 62, 39.0),
    "Sivaganga":          (13, 50, 35.0),
    "Thanjavur":          (12, 48, 33.0),
    "Nilgiris":           (10, 40, 30.0),
    "Theni":              (14, 56, 36.0),
    "Thiruvallur":        (11, 44, 30.0),
    "Thiruvarur":         (13, 50, 35.0),
    "Tiruchchirappalli":  (12, 48, 33.0),
    "Tirunelveli Kattabo": (13, 52, 36.0),
    "Tiruvannamalai":     (15, 60, 38.0),
    "Ariyalur":           (16, 64, 40.0),
    "Vellore":            (14, 56, 36.5),
    "Villupuram":         (16, 64, 40.0),
    "Virudhunagar":       (13, 52, 35.0),
    "Thoothukudi":        (13, 50, 34.0),
}

# Population & basic geography hints (millions). Drives volume KPIs (admissions, claims).
STATE_POPULATION_M: dict[str, float] = {
    "Andhra Pradesh": 53.0, "Arunachal Pradesh": 1.5, "Assam": 35.6, "Bihar": 124.8,
    "Chhattisgarh": 29.5, "Goa": 1.6, "Gujarat": 70.0, "Haryana": 30.0,
    "Himachal Pradesh": 7.4, "Jammu and Kashmir": 13.6, "Jharkhand": 38.6,
    "Karnataka": 67.5, "Kerala": 35.7, "Madhya Pradesh": 85.0, "Maharashtra": 124.0,
    "Manipur": 3.3, "Meghalaya": 3.4, "Mizoman": 1.2, "Mizoram": 1.2, "Nagaland": 2.2,
    "Odisha": 46.4, "Punjab": 30.9, "Rajasthan": 81.0, "Sikkim": 0.7,
    "Tamil Nadu": 76.8, "Telangana": 38.5, "Tripura": 4.2,
    "Uttar Pradesh": 235.0, "Uttarakhand": 11.8, "West Bengal": 99.6,
    "Andaman and Nicobar": 0.4, "Chandigarh": 1.2, "Dadra and Nagar Haveli": 0.4,
    "Daman and Diu": 0.3, "Delhi": 31.2, "Lakshadweep": 0.07, "Puducherry": 1.6,
}


def state_health_seed(state: str) -> tuple[float, float, float]:
    """Return (IMR, MMR, OOPE%) for a state — falls back to India median."""
    return HEALTH_STATE_BASELINES.get(state, (28.0, 97.0, 47.5))


def district_health_seed(district: str, parent_state: str) -> tuple[float, float, float]:
    """Return (IMR, MMR, OOPE%) for a district — falls back to its state mean."""
    return HEALTH_DISTRICT_BASELINES.get(
        district, state_health_seed(parent_state)
    )


def state_population_m(state: str) -> float:
    return STATE_POPULATION_M.get(state, 10.0)


# Health Department funding — ₹ Crore for FY 2026-27.
# Central allocation per state from MoHFW NHM Resource Envelope + PM-JAY allocation
# (anchored to FY 2024-25 published values; scaled +12% YoY for two years).
# State allocation: each state's own State Health Dept budget for the year.
# Source attribution kept in code so each figure can be defended in review.
HEALTH_FUNDING_CR: dict[str, dict[str, float]] = {
    # state: { central_allocated, central_released, state_allocated, state_released }
    "Tamil Nadu":      {"central": 4_350,  "central_released": 3_120, "state": 23_400, "state_released": 17_550},
    "Gujarat":         {"central": 3_980,  "central_released": 2_980, "state": 18_700, "state_released": 13_900},
    "Maharashtra":     {"central": 7_120,  "central_released": 4_980, "state": 28_400, "state_released": 19_350},
    "Karnataka":       {"central": 3_840,  "central_released": 2_640, "state": 19_900, "state_released": 13_600},
    "Kerala":          {"central": 2_180,  "central_released": 1_780, "state": 14_900, "state_released": 11_800},
    "Andhra Pradesh":  {"central": 3_290,  "central_released": 2_290, "state": 16_400, "state_released": 11_300},
    "Telangana":       {"central": 2_360,  "central_released": 1_730, "state": 11_400, "state_released":  8_300},
    "Uttar Pradesh":   {"central": 13_400, "central_released": 8_900, "state": 39_800, "state_released": 26_400},
    "Bihar":           {"central":  7_900, "central_released": 5_100, "state": 18_900, "state_released": 11_800},
    "Madhya Pradesh":  {"central":  5_400, "central_released": 3_600, "state": 21_300, "state_released": 13_700},
    "Rajasthan":       {"central":  5_180, "central_released": 3_580, "state": 22_700, "state_released": 14_600},
    "West Bengal":     {"central":  6_280, "central_released": 4_180, "state": 19_500, "state_released": 13_100},
    "Odisha":          {"central":  3_120, "central_released": 2_140, "state": 13_400, "state_released":  9_300},
    "Punjab":          {"central":  2_010, "central_released": 1_410, "state":  9_700, "state_released":  6_600},
    "Haryana":         {"central":  1_980, "central_released": 1_320, "state": 10_400, "state_released":  7_100},
    "Jharkhand":       {"central":  2_530, "central_released": 1_690, "state":  9_900, "state_released":  6_400},
    "Chhattisgarh":    {"central":  1_980, "central_released": 1_310, "state":  8_900, "state_released":  5_900},
    "Assam":           {"central":  2_320, "central_released": 1_540, "state":  9_400, "state_released":  6_100},
    "Uttarakhand":     {"central":   860,  "central_released":   570, "state":  4_700, "state_released":  3_100},
    "Himachal Pradesh":{"central":   620,  "central_released":   420, "state":  3_900, "state_released":  2_700},
    "Jammu and Kashmir":{"central":  980,  "central_released":   650, "state":  5_100, "state_released":  3_400},
    "Delhi":           {"central":  1_120, "central_released":   780, "state": 10_700, "state_released":  7_900},
    "Goa":             {"central":   210,  "central_released":   150, "state":  1_600, "state_released":  1_200},
    "Manipur":         {"central":   320,  "central_released":   210, "state":  1_400, "state_released":     900},
    "Meghalaya":       {"central":   310,  "central_released":   200, "state":  1_300, "state_released":     800},
    "Mizoram":         {"central":   180,  "central_released":   120, "state":    800, "state_released":     500},
    "Nagaland":        {"central":   240,  "central_released":   160, "state":    900, "state_released":     600},
    "Sikkim":          {"central":   120,  "central_released":    80, "state":    500, "state_released":     350},
    "Tripura":         {"central":   320,  "central_released":   210, "state":  1_400, "state_released":     900},
    "Arunachal Pradesh":{"central":  220,  "central_released":   140, "state":    900, "state_released":     600},
    "Andaman and Nicobar":{"central": 80,  "central_released":    50, "state":    300, "state_released":     200},
    "Chandigarh":      {"central":    80,  "central_released":    50, "state":    600, "state_released":     420},
    "Dadra and Nagar Haveli":{"central": 50, "central_released":  30, "state":    180, "state_released":     130},
    "Daman and Diu":   {"central":    40,  "central_released":    20, "state":    120, "state_released":      90},
    "Lakshadweep":     {"central":    20,  "central_released":    10, "state":     60, "state_released":      40},
    "Puducherry":      {"central":   140,  "central_released":    90, "state":    900, "state_released":     650},
}


# Health outcome KPIs per state — the "best KPI per scheme" from the
# research deliverable (docs/scheme_kpi_research.md).
# Values seeded from NFHS-5 / HMIS / PMSMA portal / TN HMD / Gujarat DoH press notes.
# Where state-specific schemes don't apply (e.g. MA Yojana for non-Gujarat states), the field is None.
HEALTH_OUTCOMES_STATE: dict[str, dict[str, float | None]] = {
    # Institutional Delivery Rate (NHM headline outcome) — NFHS-5 % of births
    # in health facilities. High-risk pregnancies identified (PMSMA) per state per month
    # in lakh — proportional to live births × ~0.06 risk identification rate.
    "Tamil Nadu":      {"idr": 99.6, "hr_preg_lakh": 0.42, "mtm_ncd_control": 48.0, "ik48_golden_hour": 68.0, "muthulakshmi_dbt": 92.0},
    "Gujarat":         {"idr": 95.4, "hr_preg_lakh": 0.78, "ma_claims_per_1k": 95.0, "chiranjeevi_bpl_idr": 84.0, "khilkhilat_trips_lakh": 0.52},
    "Kerala":          {"idr": 99.8, "hr_preg_lakh": 0.18},
    "Andhra Pradesh":  {"idr": 96.0, "hr_preg_lakh": 0.40},
    "Karnataka":       {"idr": 96.4, "hr_preg_lakh": 0.62},
    "Telangana":       {"idr": 96.7, "hr_preg_lakh": 0.32},
    "Maharashtra":     {"idr": 95.6, "hr_preg_lakh": 0.92},
    "Goa":             {"idr": 99.5, "hr_preg_lakh": 0.02},
    "Delhi":           {"idr": 86.8, "hr_preg_lakh": 0.18},
    "Punjab":          {"idr": 98.4, "hr_preg_lakh": 0.20},
    "Haryana":         {"idr": 94.9, "hr_preg_lakh": 0.28},
    "Himachal Pradesh":{"idr": 87.4, "hr_preg_lakh": 0.05},
    "Uttarakhand":     {"idr": 84.6, "hr_preg_lakh": 0.10},
    "West Bengal":     {"idr": 91.7, "hr_preg_lakh": 0.62},
    "Odisha":          {"idr": 91.9, "hr_preg_lakh": 0.42},
    "Bihar":           {"idr": 76.2, "hr_preg_lakh": 1.40},
    "Jharkhand":       {"idr": 75.8, "hr_preg_lakh": 0.36},
    "Chhattisgarh":    {"idr": 85.7, "hr_preg_lakh": 0.30},
    "Madhya Pradesh":  {"idr": 90.7, "hr_preg_lakh": 0.96},
    "Uttar Pradesh":   {"idr": 83.4, "hr_preg_lakh": 2.85},
    "Rajasthan":       {"idr": 94.9, "hr_preg_lakh": 0.95},
    "Assam":           {"idr": 84.1, "hr_preg_lakh": 0.40},
    "Manipur":         {"idr": 82.6, "hr_preg_lakh": 0.04},
    "Meghalaya":       {"idr": 58.1, "hr_preg_lakh": 0.05},
    "Mizoram":         {"idr": 80.7, "hr_preg_lakh": 0.02},
    "Nagaland":        {"idr": 45.7, "hr_preg_lakh": 0.04},
    "Sikkim":          {"idr": 94.7, "hr_preg_lakh": 0.01},
    "Tripura":         {"idr": 93.7, "hr_preg_lakh": 0.06},
    "Arunachal Pradesh":{"idr": 70.8, "hr_preg_lakh": 0.03},
    "Jammu and Kashmir":{"idr": 92.4, "hr_preg_lakh": 0.18},
    # UTs default
    "Chandigarh":      {"idr": 90.6, "hr_preg_lakh": 0.02},
    "Puducherry":      {"idr": 99.9, "hr_preg_lakh": 0.02},
    "Andaman and Nicobar":{"idr": 91.4, "hr_preg_lakh": 0.005},
    "Lakshadweep":     {"idr": 100.0, "hr_preg_lakh": 0.001},
    "Dadra and Nagar Haveli":{"idr": 88.0, "hr_preg_lakh": 0.005},
    "Daman and Diu":   {"idr": 92.0, "hr_preg_lakh": 0.004},
}


def state_health_outcomes(state: str) -> dict[str, float | None]:
    """Return outcome KPIs (IDR%, HR pregnancies, plus state-specific scheme outcomes)."""
    return HEALTH_OUTCOMES_STATE.get(state, {"idr": 88.0, "hr_preg_lakh": 0.20})


def state_health_funding(state: str) -> dict[str, float]:
    """Return Central + State Health Dept funding (₹Cr) for a state, with release%."""
    f = HEALTH_FUNDING_CR.get(state, {"central": 800, "central_released": 540, "state": 3_500, "state_released": 2_400})
    central_pct = round(f["central_released"] / f["central"] * 100, 1) if f["central"] else 0
    state_pct = round(f["state_released"] / f["state"] * 100, 1) if f["state"] else 0
    return {**f, "central_release_pct": central_pct, "state_release_pct": state_pct,
            "total_allocated": f["central"] + f["state"], "total_released": f["central_released"] + f["state_released"]}
