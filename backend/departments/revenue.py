"""Revenue Administration department.
Tracking land + service-delivery KPIs.
"""
from __future__ import annotations
import random
from .. import baselines as bl
from . import common as c

META = {
    "code": "revenue", "name": "Revenue Administration", "accent": "#ff7722", "icon": "Scroll",
    "kpis": [
        {"code": "tat",      "name": "e-Service Turnaround Time",   "short": "TAT",         "unit": "days", "direction": "lower_is_better",  "accent": "#ff7722"},
        {"code": "grm",      "name": "Grievance Redressal Rate",     "short": "Redress%",   "unit": "%",    "direction": "higher_is_better", "accent": "#0c4ca3"},
        {"code": "ldr",      "name": "Land Record Digitization",     "short": "Digi%",      "unit": "%",    "direction": "higher_is_better", "accent": "#128807"},
    ],
    "central_schemes": [
        {"code": "svamitva", "name": "SVAMITVA",                          "metric": "Property cards issued (lakh)", "unit": "lakh", "value_path": ["central", "svamitva", "cards_lakh"],   "format": "dec", "accent": "#ff7722"},
        {"code": "dilrmp",   "name": "DILRMP",                            "metric": "% RoR records digitised",      "unit": "%",    "value_path": ["central", "dilrmp", "ror_pct"],         "format": "pct", "accent": "#128807"},
        {"code": "pmkisan",  "name": "PM-KISAN",                          "metric": "Eligible farmers receiving DBT (lakh)", "unit": "lakh", "value_path": ["central", "pmkisan", "farmers_lakh"], "format": "dec", "accent": "#0c4ca3"},
    ],
    "tn_schemes": [
        {"code": "tnilam",     "name": "Tamil Nilam (Patta-Chitta)",  "metric": "Online land mutations (lakh/yr)",   "unit": "lakh", "value_path": ["state", "tnilam"],     "format": "dec", "accent": "#ff7722"},
        {"code": "star2",      "name": "STAR 2.0",                    "metric": "Sub-registrar registrations/yr (lakh)","unit": "lakh", "value_path": ["state", "star2"],     "format": "dec", "accent": "#0c4ca3"},
        {"code": "makkaludan", "name": "Makkaludan Mudhalvan",        "metric": "% petitions resolved within SLA",   "unit": "%",    "value_path": ["state", "makkaludan"], "format": "pct", "accent": "#128807"},
    ],
    "gj_schemes": [
        {"code": "anyror", "name": "AnyRoR",                "metric": "RoR record lookups (lakh/mo)",            "unit": "lakh/mo", "value_path": ["state", "anyror"], "format": "dec", "accent": "#ff7722"},
        {"code": "iora",   "name": "iORA",                  "metric": "NA conversion applications processed/mo", "unit": "thousand", "value_path": ["state", "iora"],  "format": "dec", "accent": "#0c4ca3"},
        {"code": "garib",  "name": "Garib Kalyan Mela",     "metric": "Beneficiaries reached (lakh/yr)",          "unit": "lakh", "value_path": ["state", "garib"],     "format": "dec", "accent": "#128807"},
    ],
    "tagline_funding": "Revenue admin funding · Centre + State (FY 26-27)",
}

# (TAT days, Redressal %, Digitization %)
STATE_KPI_BASELINES: dict[str, tuple[float, float, float]] = {
    "Andhra Pradesh":   (3.5, 92, 99),
    "Arunachal Pradesh":(8.0, 70, 65),
    "Assam":            (7.0, 75, 78),
    "Bihar":            (9.0, 68, 72),
    "Chhattisgarh":     (4.5, 88, 96),
    "Goa":              (4.0, 90, 88),
    "Gujarat":          (3.0, 95, 100),
    "Haryana":          (5.0, 85, 99),
    "Himachal Pradesh": (5.5, 87, 92),
    "Jammu and Kashmir":(6.5, 75, 80),
    "Jharkhand":        (8.5, 70, 80),
    "Karnataka":        (4.5, 90, 99),
    "Kerala":           (5.0, 90, 95),
    "Madhya Pradesh":   (5.0, 85, 99),
    "Maharashtra":      (4.5, 88, 100),
    "Manipur":          (8.0, 70, 60),
    "Meghalaya":        (8.0, 65, 50),
    "Mizoram":          (7.5, 70, 55),
    "Nagaland":         (8.0, 68, 55),
    "Odisha":           (6.0, 82, 95),
    "Punjab":           (5.0, 88, 92),
    "Rajasthan":        (5.5, 84, 99),
    "Sikkim":           (5.0, 80, 85),
    "Tamil Nadu":       (3.5, 93, 98),
    "Telangana":        (3.0, 94, 100),
    "Tripura":          (6.5, 76, 78),
    "Uttar Pradesh":    (7.5, 75, 90),
    "Uttarakhand":      (5.5, 82, 87),
    "West Bengal":      (6.0, 80, 85),
    "Andaman and Nicobar":(5.0, 80, 70),
    "Chandigarh":       (3.5, 92, 96),
    "Dadra and Nagar Haveli":(5.0, 82, 85),
    "Daman and Diu":    (5.0, 82, 85),
    "Delhi":            (3.5, 90, 99),
    "Lakshadweep":      (4.5, 80, 80),
    "Puducherry":       (3.5, 92, 95),
}

STATE_FUNDING: dict[str, dict[str, float]] = {
    s: {"central": round(180 + bl.state_population_m(s) * 4, 1),
        "central_released": round((180 + bl.state_population_m(s) * 4) * 0.55, 1),
        "state": round(450 + bl.state_population_m(s) * 12, 1),
        "state_released": round((450 + bl.state_population_m(s) * 12) * 0.62, 1)}
    for s in STATE_KPI_BASELINES
}

STATE_SCHEME_OUTCOMES: dict[str, dict] = {
    "Tamil Nadu": {"tnilam": 18.0, "star2": 12.5, "makkaludan": 89.0},
    "Gujarat":    {"anyror": 22.0, "iora": 14.0, "garib": 15.5},
}


def _kpi_seed(state: str) -> tuple[float, float, float]:
    return STATE_KPI_BASELINES.get(state, (5.5, 82.0, 88.0))


def state_snapshot(state: str, t: float) -> dict:
    rng = random.Random(f"{c.SEED}|revenue|state|{state}|tick")
    tat0, grm0, ldr0 = _kpi_seed(state)
    pop = bl.state_population_m(state)
    tat = c.drift(tat0, t, 23, 1.5)
    grm = c.drift(grm0, t, 41, 0.5)
    ldr = c.drift(ldr0, t, 67, 0.2)
    # Central
    svamitva_lakh   = round(pop * 0.18 * c.drift(1.0, t, 31, 1.0) * rng.gauss(1, 0.03), 2)
    dilrmp_ror_pct  = c.drift(ldr0 - 4 + rng.gauss(0, 2), t, 53, 0.3)
    pmkisan_lakh    = round(pop * 0.6 * c.drift(1.0, t, 41, 0.4) * rng.gauss(1, 0.03), 2)
    state_outcomes  = STATE_SCHEME_OUTCOMES.get(state, {})
    def _opt(key, p, amp):
        v = state_outcomes.get(key)
        return None if v is None else round(c.drift(v, t, p, amp), 2)
    return {
        "region": state, "parent": None, "level": "state",
        "kpis": {"tat": round(tat, 1), "grm": round(grm, 1), "ldr": round(ldr, 1)},
        "schemes": {
            "central": {
                "svamitva": {"cards_lakh":   svamitva_lakh},
                "dilrmp":   {"ror_pct":      round(dilrmp_ror_pct, 1)},
                "pmkisan":  {"farmers_lakh": pmkisan_lakh},
            },
            "state": {
                "tnilam":     _opt("tnilam", 23, 1.5),
                "star2":      _opt("star2", 31, 1.5),
                "makkaludan": _opt("makkaludan", 41, 0.6),
                "anyror":     _opt("anyror", 19, 2.0),
                "iora":       _opt("iora", 23, 1.8),
                "garib":      _opt("garib", 47, 1.0),
            },
        },
    }


def state_history(state: str) -> dict:
    return c.state_history(state, _kpi_seed(state),
                           improvement_per_year=(-8.0, 3.0, 4.0),  # TAT down (improving), GRM up, LDR up
                           sigma_pct=(5.0, 1.8, 1.0),
                           kpi_codes=("tat", "grm", "ldr"), dept_code="revenue")


def national_snapshot(t: float) -> dict:
    states = list(STATE_KPI_BASELINES.keys())
    snaps = [state_snapshot(s, t) for s in states]
    pop = {s: bl.state_population_m(s) for s in states}
    total_pop = sum(pop.values())
    def wm(key): return sum(sn["kpis"][key] * pop[sn["region"]] for sn in snaps) / total_pop
    return {
        "kpis": {"tat": round(wm("tat"), 1), "grm": round(wm("grm"), 1), "ldr": round(wm("ldr"), 1)},
        "schemes": {
            "central": {
                "svamitva": {"cards_lakh": round(sum(sn["schemes"]["central"]["svamitva"]["cards_lakh"] for sn in snaps), 1)},
                "dilrmp":   {"ror_pct":    round(sum(sn["schemes"]["central"]["dilrmp"]["ror_pct"] * pop[sn["region"]] for sn in snaps) / total_pop, 1)},
                "pmkisan":  {"farmers_lakh": round(sum(sn["schemes"]["central"]["pmkisan"]["farmers_lakh"] for sn in snaps), 1)},
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
    series = {k: [] for k in ("tat", "grm", "ldr")}
    for i in range(len(months)):
        for k in series:
            series[k].append(round(sum(per_state[s]["series"][k][i] * pop[s] for s in states) / total_pop, 1))
    return {"months": months, "series": series}


def state_funding(state: str) -> dict:
    f = STATE_FUNDING.get(state, {"central": 250, "central_released": 130, "state": 600, "state_released": 380})
    return {**f, "central_release_pct": c.funding_release_pct(f["central"], f["central_released"]),
            "state_release_pct": c.funding_release_pct(f["state"], f["state_released"]),
            "total_allocated": f["central"] + f["state"], "total_released": f["central_released"] + f["state_released"]}

def all_funding() -> dict:
    return {s: state_funding(s) for s in STATE_KPI_BASELINES}

def detect_anomalies() -> list[dict]:
    return c.detect_anomalies(list(STATE_KPI_BASELINES.keys()), state_history,
                              thresholds={"tat": 8.0, "grm": 4.0, "ldr": 3.0},
                              direction={"tat": "lower_is_better", "grm": "higher_is_better", "ldr": "higher_is_better"},
                              dept_code="revenue")
