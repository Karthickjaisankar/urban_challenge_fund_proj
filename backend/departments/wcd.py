"""Women & Child Development department.
KPI baselines: Census 2011 (CSR), NFHS-5 (SAM, FLFPR — 2019-21).
"""
from __future__ import annotations
import random
from .. import baselines as bl
from . import common as c

META = {
    "code": "wcd", "name": "Women & Child Development", "accent": "#c4368e", "icon": "Baby",
    "kpis": [
        {"code": "csr",   "name": "Child Sex Ratio (0–6 yrs)",       "short": "CSR",   "unit": "f / 1k m", "direction": "higher_is_better", "accent": "#c4368e"},
        {"code": "sam",   "name": "Severe Acute Malnutrition (0–5)", "short": "SAM",   "unit": "%",         "direction": "lower_is_better",  "accent": "#b81d24"},
        {"code": "flfpr", "name": "Female Labour Force Participation","short": "FLFPR","unit": "%",         "direction": "higher_is_better", "accent": "#0c4ca3"},
    ],
    "central_schemes": [
        {"code": "poshan", "name": "Poshan Abhiyaan",        "metric": "Stunting among children 0-6 yrs",      "unit": "%",   "value_path": ["central", "poshan", "stunting_pct"],  "format": "pct", "accent": "#0c4ca3"},
        {"code": "bbbp",   "name": "Beti Bachao Beti Padhao","metric": "Sex Ratio at Birth (girls/1k boys)",   "unit": "f/1k", "value_path": ["central", "bbbp", "srb"],            "format": "dec", "accent": "#c4368e"},
        {"code": "pmmvy",  "name": "PM Matru Vandana Yojana","metric": "% mothers receiving full instalment", "unit": "%",   "value_path": ["central", "pmmvy", "full_pct"],       "format": "pct", "accent": "#128807"},
    ],
    "tn_schemes": [
        {"code": "pudhumai", "name": "Pudhumai Penn",            "metric": "% girl-students transitioning to higher education", "unit": "%", "value_path": ["state", "pudhumai"], "format": "pct", "accent": "#0c4ca3"},
        {"code": "cradle",   "name": "Cradle Baby Scheme",       "metric": "Female infants saved & adopted (count/yr)",          "unit": "count", "value_path": ["state", "cradle"], "format": "int", "accent": "#c4368e"},
        {"code": "icds",     "name": "ICDS State Augmentation",  "metric": "% underweight children 0-6 yrs",                     "unit": "%", "value_path": ["state", "icds"],     "format": "pct", "accent": "#128807"},
    ],
    "gj_schemes": [
        {"code": "vhali",  "name": "Vhali Dikri Yojana",   "metric": "% eligible girls receiving Stage-3 ₹1L payout", "unit": "%", "value_path": ["state", "vhali"], "format": "pct", "accent": "#0c4ca3"},
        {"code": "ganga",  "name": "Ganga Swaroopa Pension","metric": "% widows receiving monthly pension on time",   "unit": "%", "value_path": ["state", "ganga"], "format": "pct", "accent": "#c4368e"},
        {"code": "dudh",   "name": "Dudh Sanjeevani",      "metric": "Tribal children receiving fortified milk",       "unit": "lakh", "value_path": ["state", "dudh"], "format": "dec", "accent": "#128807"},
    ],
    "tagline_funding": "WCD funding · Centre + State (FY 26-27)",
}

# (CSR f/1k m, SAM %, FLFPR %)
STATE_KPI_BASELINES: dict[str, tuple[float, float, float]] = {
    "Andhra Pradesh":   (939, 4.9, 33.4),
    "Arunachal Pradesh":(972, 7.2, 39.0),
    "Assam":            (962, 9.1, 22.5),
    "Bihar":            (935, 12.5, 11.7),
    "Chhattisgarh":     (969, 7.0, 36.0),
    "Goa":              (942, 4.0, 23.0),
    "Gujarat":          (890, 10.6, 22.0),
    "Haryana":          (834, 7.6, 17.3),
    "Himachal Pradesh": (909, 6.8, 50.0),
    "Jammu and Kashmir":(862, 6.6, 21.0),
    "Jharkhand":        (948, 9.0, 25.0),
    "Karnataka":        (948, 7.2, 28.0),
    "Kerala":           (964, 5.0, 25.0),
    "Madhya Pradesh":   (918, 9.1, 23.0),
    "Maharashtra":      (894, 9.4, 30.0),
    "Manipur":          (936, 4.7, 38.0),
    "Meghalaya":        (970, 5.6, 36.0),
    "Mizoram":          (970, 4.0, 31.0),
    "Nagaland":         (943, 5.4, 28.0),
    "Odisha":           (941, 6.5, 26.0),
    "Punjab":           (846, 4.7, 18.5),
    "Rajasthan":        (888, 8.6, 28.0),
    "Sikkim":           (957, 4.0, 35.0),
    "Tamil Nadu":       (943, 4.4, 31.0),
    "Telangana":        (932, 4.6, 38.0),
    "Tripura":          (957, 6.4, 26.0),
    "Uttar Pradesh":    (902, 7.5, 16.0),
    "Uttarakhand":      (890, 5.0, 20.0),
    "West Bengal":      (956, 8.0, 23.5),
    "Andaman and Nicobar":(966, 5.0, 30.0),
    "Chandigarh":       (880, 4.0, 18.0),
    "Dadra and Nagar Haveli":(926, 6.0, 24.0),
    "Daman and Diu":    (904, 6.0, 23.0),
    "Delhi":            (871, 5.0, 14.0),
    "Lakshadweep":      (911, 4.0, 22.0),
    "Puducherry":       (967, 4.0, 22.0),
}

STATE_FUNDING: dict[str, dict[str, float]] = {
    s: {"central": round(800 + bl.state_population_m(s) * 14, 1),
        "central_released": round((800 + bl.state_population_m(s) * 14) * 0.62, 1),
        "state": round(1200 + bl.state_population_m(s) * 24, 1),
        "state_released": round((1200 + bl.state_population_m(s) * 24) * 0.66, 1)}
    for s in STATE_KPI_BASELINES
}

STATE_SCHEME_OUTCOMES: dict[str, dict] = {
    "Tamil Nadu": {"pudhumai": 78.0, "cradle": 220, "icds": 8.5},
    "Gujarat":    {"vhali": 84.5, "ganga": 92.0, "dudh": 6.8},
}


def _kpi_seed(state: str) -> tuple[float, float, float]:
    return STATE_KPI_BASELINES.get(state, (920.0, 7.0, 25.0))


def state_snapshot(state: str, t: float) -> dict:
    rng = random.Random(f"{c.SEED}|wcd|state|{state}|tick")
    csr0, sam0, flf0 = _kpi_seed(state)
    csr  = c.drift(csr0, t, 47, 0.2)
    sam  = c.drift(sam0, t, 31, 0.8)
    flf  = c.drift(flf0, t, 53, 0.5)
    # Central scheme outcomes
    stunting_pct  = c.drift(35.5 - (csr0 - 920) * 0.04 + sam0 * 0.6 + rng.gauss(0, 1.5), t, 41, 0.6)
    srb           = round(c.drift(csr0 + rng.gauss(5, 8), t, 47, 0.2), 0)
    pmmvy_full    = c.drift(76.0 + rng.gauss(0, 6), t, 37, 1.0)
    state_outcomes = STATE_SCHEME_OUTCOMES.get(state, {})
    def _opt(key: str, period: float, amp: float):
        v = state_outcomes.get(key)
        return None if v is None else round(c.drift(v, t, period, amp), 2)
    return {
        "region": state, "parent": None, "level": "state",
        "kpis": {"csr": round(csr, 0), "sam": round(sam, 1), "flfpr": round(flf, 1)},
        "schemes": {
            "central": {
                "poshan": {"stunting_pct": round(stunting_pct, 1)},
                "bbbp":   {"srb":          srb},
                "pmmvy":  {"full_pct":     round(pmmvy_full, 1)},
            },
            "state": {
                "pudhumai": _opt("pudhumai", 31, 1.0),
                "cradle":   _opt("cradle", 47, 4.0),
                "icds":     _opt("icds", 23, 1.4),
                "vhali":    _opt("vhali", 31, 0.8),
                "ganga":    _opt("ganga", 47, 0.5),
                "dudh":     _opt("dudh", 23, 2.0),
            },
        },
    }


def state_history(state: str) -> dict:
    return c.state_history(state, _kpi_seed(state),
                           improvement_per_year=(0.5, -3.0, 1.5),
                           sigma_pct=(0.6, 4.0, 2.5),
                           kpi_codes=("csr", "sam", "flfpr"),
                           dept_code="wcd")


def national_snapshot(t: float) -> dict:
    states = list(STATE_KPI_BASELINES.keys())
    snaps = [state_snapshot(s, t) for s in states]
    pop = {s: bl.state_population_m(s) for s in states}
    total_pop = sum(pop.values())
    def wm(key):
        return sum(sn["kpis"][key] * pop[sn["region"]] for sn in snaps) / total_pop
    return {
        "kpis": {"csr": round(wm("csr"), 0), "sam": round(wm("sam"), 1), "flfpr": round(wm("flfpr"), 1)},
        "schemes": {
            "central": {
                "poshan": {"stunting_pct": round(sum(sn["schemes"]["central"]["poshan"]["stunting_pct"] * pop[sn["region"]] for sn in snaps) / total_pop, 1)},
                "bbbp":   {"srb":          round(sum(sn["schemes"]["central"]["bbbp"]["srb"] * pop[sn["region"]] for sn in snaps) / total_pop, 0)},
                "pmmvy":  {"full_pct":     round(sum(sn["schemes"]["central"]["pmmvy"]["full_pct"] * pop[sn["region"]] for sn in snaps) / total_pop, 1)},
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
    series = {k: [] for k in ("csr", "sam", "flfpr")}
    for i in range(len(months)):
        for k in series:
            series[k].append(round(sum(per_state[s]["series"][k][i] * pop[s] for s in states) / total_pop, 1))
    return {"months": months, "series": series}


def state_funding(state: str) -> dict:
    f = STATE_FUNDING.get(state, {"central": 600, "central_released": 380, "state": 1500, "state_released": 990})
    return {**f,
            "central_release_pct": c.funding_release_pct(f["central"], f["central_released"]),
            "state_release_pct":   c.funding_release_pct(f["state"],   f["state_released"]),
            "total_allocated":     f["central"] + f["state"],
            "total_released":      f["central_released"] + f["state_released"]}


def all_funding() -> dict:
    return {s: state_funding(s) for s in STATE_KPI_BASELINES}


def detect_anomalies() -> list[dict]:
    return c.detect_anomalies(list(STATE_KPI_BASELINES.keys()), state_history,
                              thresholds={"csr": 1.5, "sam": 5.0, "flfpr": 4.0},
                              direction={"csr": "higher_is_better", "sam": "lower_is_better", "flfpr": "higher_is_better"},
                              dept_code="wcd")
