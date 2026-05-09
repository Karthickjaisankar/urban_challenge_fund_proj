"""Education department — KPIs, funding, schemes per state.

KPI baselines: U-DISE+ 2022-23 (GER higher-secondary, PTR-secondary, Dropout-secondary).
Funding: state Education-Department BE plus Samagra Shiksha + PM-POSHAN central allocation.
"""
from __future__ import annotations

import math
import random
from .. import baselines as bl
from . import common as c


META = {
    "code": "education",
    "name": "Education",
    "accent": "#0c4ca3",
    "icon": "GraduationCap",
    "kpis": [
        {"code": "ger",     "name": "Gross Enrolment Ratio (Higher Secondary)", "short": "GER",     "unit": "%",   "direction": "higher_is_better", "accent": "#0c4ca3"},
        {"code": "ptr",     "name": "Pupil-Teacher Ratio (Secondary)",          "short": "PTR",     "unit": ":1",  "direction": "lower_is_better",  "accent": "#c4368e"},
        {"code": "dropout", "name": "Dropout Rate (Secondary)",                 "short": "Dropout", "unit": "%",   "direction": "lower_is_better",  "accent": "#ff7722"},
    ],
    "central_schemes": [
        {"code": "samagra", "name": "Samagra Shiksha",   "metric": "Schools covered (lakh)",                "unit": "lakh", "value_path": ["central", "samagra", "schools_lakh"],         "format": "dec", "accent": "#0c4ca3"},
        {"code": "pmshri",  "name": "PM SHRI Schools",   "metric": "Schools meeting quality index (%)",     "unit": "%",    "value_path": ["central", "pmshri", "quality_pct"],            "format": "pct", "accent": "#128807"},
        {"code": "poshan",  "name": "PM-POSHAN",         "metric": "Children availing hot cooked meal",     "unit": "lakh/day", "value_path": ["central", "poshan", "meals_lakh_per_day"], "format": "dec", "accent": "#ff7722"},
    ],
    "tn_schemes": [
        {"code": "breakfast", "name": "CM Breakfast Scheme", "metric": "Children availing breakfast",                "unit": "lakh/day", "value_path": ["state", "breakfast"], "format": "dec", "accent": "#0c4ca3"},
        {"code": "itk",       "name": "Illam Thedi Kalvi",   "metric": "% FLN proficiency gain (learning recovery)", "unit": "%",        "value_path": ["state", "itk"],       "format": "pct", "accent": "#c4368e"},
        {"code": "naan",      "name": "Naan Mudhalvan",      "metric": "% trainees placed/employed post-course",     "unit": "%",        "value_path": ["state", "naan"],      "format": "pct", "accent": "#ff7722"},
    ],
    "gj_schemes": [
        {"code": "praveshotsav", "name": "Shala Praveshotsav",     "metric": "Net Enrolment Ratio Std I (campaign-end)", "unit": "%", "value_path": ["state", "praveshotsav"], "format": "pct", "accent": "#0c4ca3"},
        {"code": "accred",       "name": "School Accreditation",   "metric": "% schools graded A+ / A (Gunotsav)",       "unit": "%", "value_path": ["state", "accred"],       "format": "pct", "accent": "#c4368e"},
        {"code": "vidyanjali",   "name": "Vidyanjali Yojana",      "metric": "Volunteer-hours delivered (lakh hours/yr)","unit": "lakh", "value_path": ["state", "vidyanjali"],"format": "dec", "accent": "#ff7722"},
    ],
    "tagline_funding": "Education funding · Centre + State (FY 26-27)",
}


# (GER %, PTR :1, Dropout %)
# Anchored to U-DISE+ 2022-23 / NEP-2020 dashboards. Values rounded.
STATE_KPI_BASELINES: dict[str, tuple[float, float, float]] = {
    "Andhra Pradesh":   (29.7, 21.0, 12.6),
    "Arunachal Pradesh":(35.4, 16.1, 22.4),
    "Assam":            (18.9, 17.3, 20.3),
    "Bihar":            (17.1, 30.0, 21.4),
    "Chhattisgarh":     (20.4, 24.2, 14.6),
    "Goa":              (37.6, 16.7,  4.0),
    "Gujarat":          (23.6, 25.6, 17.9),
    "Haryana":          (32.2, 21.1,  8.7),
    "Himachal Pradesh": (43.1, 13.8,  4.6),
    "Jammu and Kashmir":(31.0, 11.5,  9.0),
    "Jharkhand":        (16.7, 25.5, 21.7),
    "Karnataka":        (32.9, 22.2,  8.9),
    "Kerala":           (43.2, 16.4,  4.9),
    "Madhya Pradesh":   (24.4, 26.5, 15.3),
    "Maharashtra":      (35.2, 24.0,  9.8),
    "Manipur":          (40.6, 12.1, 10.6),
    "Meghalaya":        (26.1, 10.6, 21.7),
    "Mizoram":          (26.4,  8.7, 12.8),
    "Nagaland":         (19.4, 10.0, 11.8),
    "Odisha":           (24.4, 21.4, 13.9),
    "Punjab":           (29.7, 19.6,  3.7),
    "Rajasthan":        (27.7, 24.4, 12.9),
    "Sikkim":           (45.0, 12.0,  4.7),
    "Tamil Nadu":       (47.0, 18.6,  8.5),
    "Telangana":        (37.0, 17.0, 14.4),
    "Tripura":          (15.7, 13.0, 25.0),
    "Uttar Pradesh":    (24.1, 25.6, 12.5),
    "Uttarakhand":      (40.6, 13.7,  6.7),
    "West Bengal":      (24.7, 32.1, 18.0),
    "Andaman and Nicobar":(40.0, 9.0,  2.5),
    "Chandigarh":       (52.0, 17.0,  3.0),
    "Dadra and Nagar Haveli":(25.0, 22.0, 12.0),
    "Daman and Diu":    (28.0, 25.0, 11.0),
    "Delhi":            (49.0, 22.5,  9.0),
    "Lakshadweep":      (40.0, 11.0,  3.0),
    "Puducherry":       (44.0, 16.0,  4.5),
}


# Education funding per state ₹ Cr — Centre = Samagra Shiksha + PM-POSHAN; State = own SE-Dept BE.
STATE_FUNDING: dict[str, dict[str, float]] = {
    "Tamil Nadu":      {"central": 3_900, "central_released": 2_700, "state": 38_500, "state_released": 28_900},
    "Gujarat":         {"central": 3_400, "central_released": 2_400, "state": 32_800, "state_released": 24_500},
    "Maharashtra":     {"central": 6_700, "central_released": 4_700, "state": 76_000, "state_released": 53_200},
    "Karnataka":       {"central": 3_500, "central_released": 2_400, "state": 38_400, "state_released": 26_200},
    "Kerala":          {"central": 1_900, "central_released": 1_500, "state": 22_500, "state_released": 17_500},
    "Andhra Pradesh":  {"central": 3_100, "central_released": 2_100, "state": 32_700, "state_released": 22_500},
    "Telangana":       {"central": 2_200, "central_released": 1_600, "state": 19_400, "state_released": 13_800},
    "Uttar Pradesh":   {"central": 12_900, "central_released": 8_500, "state": 88_500, "state_released": 60_000},
    "Bihar":           {"central":  7_500, "central_released": 4_900, "state": 42_000, "state_released": 27_500},
    "Madhya Pradesh":  {"central":  5_100, "central_released": 3_400, "state": 38_500, "state_released": 25_300},
    "Rajasthan":       {"central":  4_900, "central_released": 3_400, "state": 41_700, "state_released": 27_700},
    "West Bengal":     {"central":  6_000, "central_released": 4_000, "state": 38_700, "state_released": 26_500},
    "Odisha":          {"central":  3_000, "central_released": 2_100, "state": 25_400, "state_released": 17_400},
    "Punjab":          {"central":  1_900, "central_released": 1_350, "state": 17_700, "state_released": 12_300},
    "Haryana":         {"central":  1_900, "central_released": 1_300, "state": 19_400, "state_released": 13_500},
    "Jharkhand":       {"central":  2_400, "central_released": 1_650, "state": 12_900, "state_released":  8_400},
    "Chhattisgarh":    {"central":  1_900, "central_released": 1_300, "state": 18_300, "state_released": 12_200},
    "Assam":           {"central":  2_300, "central_released": 1_550, "state": 18_900, "state_released": 12_800},
    "Uttarakhand":     {"central":   850,  "central_released":   570, "state":  9_300, "state_released":  6_400},
    "Himachal Pradesh":{"central":   620,  "central_released":   420, "state":  8_700, "state_released":  6_100},
    "Jammu and Kashmir":{"central":  970,  "central_released":   650, "state": 13_400, "state_released":  9_300},
    "Delhi":           {"central":  1_100, "central_released":   780, "state": 16_300, "state_released": 12_100},
    "Goa":             {"central":   210,  "central_released":   150, "state":  2_400, "state_released":  1_800},
    "Manipur":         {"central":   320,  "central_released":   210, "state":  2_700, "state_released":  1_750},
    "Meghalaya":       {"central":   310,  "central_released":   200, "state":  2_400, "state_released":  1_600},
    "Mizoram":         {"central":   180,  "central_released":   120, "state":  1_800, "state_released":  1_200},
    "Nagaland":        {"central":   240,  "central_released":   160, "state":  2_100, "state_released":  1_350},
    "Sikkim":          {"central":   120,  "central_released":    80, "state":  1_400, "state_released":     950},
    "Tripura":         {"central":   320,  "central_released":   210, "state":  3_500, "state_released":  2_300},
    "Arunachal Pradesh":{"central":  220,  "central_released":   140, "state":  2_400, "state_released":  1_550},
    "Andaman and Nicobar":{"central": 80,  "central_released":    50, "state":   400,  "state_released":   270},
    "Chandigarh":      {"central":    80,  "central_released":    50, "state":   900,  "state_released":   620},
    "Dadra and Nagar Haveli":{"central": 50, "central_released":  30, "state":   240,  "state_released":   160},
    "Daman and Diu":   {"central":    40,  "central_released":    20, "state":   170,  "state_released":   115},
    "Lakshadweep":     {"central":    20,  "central_released":    10, "state":    90,  "state_released":    60},
    "Puducherry":      {"central":   140,  "central_released":    90, "state":  1_700, "state_released":  1_240},
}

# State-scheme outcomes (TN/GJ schemes)
STATE_SCHEME_OUTCOMES: dict[str, dict[str, float]] = {
    "Tamil Nadu": {"breakfast": 17.5, "itk": 64.0, "naan": 78.0},   # 17.5 lakh/day breakfast, 64% FLN gain, 78% placed
    "Gujarat":    {"praveshotsav": 99.0, "accred": 42.5, "vidyanjali": 6.2},
}


def _kpi_seed(state: str) -> tuple[float, float, float]:
    return STATE_KPI_BASELINES.get(state, (25.0, 24.0, 13.0))


def state_snapshot(state: str, t: float) -> dict:
    rng = random.Random(f"{c.SEED}|education|state|{state}|tick")
    ger0, ptr0, drop0 = _kpi_seed(state)
    pop_m = bl.state_population_m(state)

    # Slow drift
    ger  = c.drift(ger0,  t, 41, 0.4)
    ptr  = c.drift(ptr0,  t, 53, 0.3)
    drop = c.drift(drop0, t, 47, 0.6)

    # Central scheme outcomes
    # Samagra: schools covered (lakh) — proportional to pop & enrolment
    samagra_lakh = round(pop_m * 0.024 * c.drift(1.0, t, 31, 0.8) * rng.gauss(1.0, 0.02), 2)
    # PM SHRI quality % — slow drift, anchored ~70-90%
    pmshri_pct = c.drift(78.0 + (rng.random() - 0.5) * 10, t, 67, 0.5)
    # PM-POSHAN meals per day (lakh) — proportional to school-age pop
    poshan_meals = round(pop_m * 0.12 * c.fy_progress() / max(c.fy_progress(), 0.01) * rng.gauss(1.0, 0.04), 2)

    state_outcomes = STATE_SCHEME_OUTCOMES.get(state, {})

    def _opt(key: str, period: float, amp: float):
        v = state_outcomes.get(key)
        return None if v is None else round(c.drift(v, t, period, amp), 2)

    return {
        "region": state, "parent": None, "level": "state",
        "kpis": {"ger": round(ger, 1), "ptr": round(ptr, 1), "dropout": round(drop, 1)},
        "schemes": {
            "central": {
                "samagra": {"schools_lakh": samagra_lakh},
                "pmshri":  {"quality_pct":  round(pmshri_pct, 1)},
                "poshan":  {"meals_lakh_per_day": poshan_meals},
            },
            "state": {
                "breakfast":     _opt("breakfast", 19, 1.8),
                "itk":           _opt("itk", 23, 1.4),
                "naan":          _opt("naan", 31, 1.2),
                "praveshotsav":  _opt("praveshotsav", 47, 0.4),
                "accred":        _opt("accred", 31, 1.0),
                "vidyanjali":    _opt("vidyanjali", 29, 2.0),
            },
        },
    }


def state_history(state: str) -> dict:
    seeds = _kpi_seed(state)
    return c.state_history(
        state, seeds,
        improvement_per_year=(2.5, -1.5, 4.5),  # GER higher → improving means up; PTR lower → improving means down etc.
        sigma_pct=(2.0, 2.5, 3.5),
        kpi_codes=("ger", "ptr", "dropout"),
        dept_code="education",
    )


def national_snapshot(t: float) -> dict:
    states = list(STATE_KPI_BASELINES.keys())
    snaps = [state_snapshot(s, t) for s in states]
    pop = {s: bl.state_population_m(s) for s in states}
    total_pop = sum(pop.values())
    def wmean(key: str) -> float:
        return sum(sn["kpis"][key] * pop[sn["region"]] for sn in snaps) / total_pop
    return {
        "kpis": {"ger": round(wmean("ger"), 1), "ptr": round(wmean("ptr"), 1), "dropout": round(wmean("dropout"), 1)},
        "schemes": {
            "central": {
                "samagra": {"schools_lakh":         round(sum(sn["schemes"]["central"]["samagra"]["schools_lakh"] for sn in snaps), 1)},
                "pmshri":  {"quality_pct":          round(sum(sn["schemes"]["central"]["pmshri"]["quality_pct"]  * pop[sn["region"]] for sn in snaps) / total_pop, 1)},
                "poshan":  {"meals_lakh_per_day":  round(sum(sn["schemes"]["central"]["poshan"]["meals_lakh_per_day"] for sn in snaps), 1)},
            },
            "state": {},
        },
        "covered_states": len(states),
    }


def national_history() -> dict:
    states = list(STATE_KPI_BASELINES.keys())
    per_state = {s: state_history(s) for s in states}
    months = next(iter(per_state.values()))["months"]
    pop = {s: bl.state_population_m(s) for s in states}
    total_pop = sum(pop.values())
    series = {"ger": [], "ptr": [], "dropout": []}
    for i in range(len(months)):
        for k in series:
            series[k].append(round(sum(per_state[s]["series"][k][i] * pop[s] for s in states) / total_pop, 1))
    return {"months": months, "series": series}


def state_funding(state: str) -> dict:
    f = STATE_FUNDING.get(state, {"central": 800, "central_released": 540, "state": 5_000, "state_released": 3_400})
    return {
        **f,
        "central_release_pct": c.funding_release_pct(f["central"], f["central_released"]),
        "state_release_pct":   c.funding_release_pct(f["state"],   f["state_released"]),
        "total_allocated":     f["central"] + f["state"],
        "total_released":      f["central_released"] + f["state_released"],
    }


def all_funding() -> dict:
    return {s: state_funding(s) for s in STATE_KPI_BASELINES}


def detect_anomalies() -> list[dict]:
    return c.detect_anomalies(
        list(STATE_KPI_BASELINES.keys()),
        history_fn=state_history,
        thresholds={"ger": 4.0, "ptr": 3.0, "dropout": 5.0},
        direction={"ger": "higher_is_better", "ptr": "lower_is_better", "dropout": "lower_is_better"},
        dept_code="education",
    )
