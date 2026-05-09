"""Tourism department.
KPIs: Domestic Footfall (lakh/mo), FTA (thousand/mo), Occupancy (%).
"""
from __future__ import annotations
import random
from .. import baselines as bl
from . import common as c

META = {
    "code": "tourism", "name": "Tourism", "accent": "#7c3aed", "icon": "Mountain",
    "kpis": [
        {"code": "dtv", "name": "Domestic Tourist Footfall",  "short": "Domestic", "unit": "lakh/mo", "direction": "higher_is_better", "accent": "#7c3aed"},
        {"code": "fta", "name": "Foreign Tourist Arrivals",   "short": "FTA",       "unit": "k/mo",    "direction": "higher_is_better", "accent": "#0c4ca3"},
        {"code": "occ", "name": "Accommodation Occupancy",     "short": "Occ%",     "unit": "%",       "direction": "higher_is_better", "accent": "#ff7722"},
    ],
    "central_schemes": [
        {"code": "swadesh","name": "Swadesh Darshan",  "metric": "Theme-circuit projects complete (cumulative)", "unit": "count", "value_path": ["central", "swadesh", "projects"], "format": "int", "accent": "#7c3aed"},
        {"code": "prashad","name": "PRASHAD",          "metric": "Pilgrimage sites upgraded (count)",            "unit": "count", "value_path": ["central", "prashad", "sites"],   "format": "int", "accent": "#0c4ca3"},
        {"code": "dekho",  "name": "Dekho Apna Desh",  "metric": "Campaign reach (lakh impressions/mo)",         "unit": "lakh",  "value_path": ["central", "dekho", "reach_lakh"],"format": "dec", "accent": "#ff7722"},
    ],
    "tn_schemes": [
        {"code": "hrce",     "name": "HR&CE Temple Renovation",    "metric": "Temples restored (cumulative)",       "unit": "count", "value_path": ["state", "hrce"],     "format": "int", "accent": "#7c3aed"},
        {"code": "destdev",  "name": "TN Destination Development", "metric": "Hill/coastal sites upgraded",          "unit": "count", "value_path": ["state", "destdev"],  "format": "int", "accent": "#0c4ca3"},
        {"code": "ecotour",  "name": "Eco-Tourism Development",    "metric": "Footfall in eco-sites (lakh/yr)",      "unit": "lakh",  "value_path": ["state", "ecotour"],  "format": "dec", "accent": "#128807"},
    ],
    "gj_schemes": [
        {"code": "rann",     "name": "Rann Utsav",             "metric": "Tent occupancy (% of inventory)",      "unit": "%",   "value_path": ["state", "rann"],     "format": "pct", "accent": "#7c3aed"},
        {"code": "heritage", "name": "Heritage Tourism Policy","metric": "Heritage sites covered (count)",       "unit": "count","value_path": ["state", "heritage"], "format": "int", "accent": "#0c4ca3"},
        {"code": "statue",   "name": "Statue of Unity",         "metric": "Daily ticket revenue (₹ lakh)",        "unit": "lakh","value_path": ["state", "statue"],   "format": "dec", "accent": "#128807"},
    ],
    "tagline_funding": "Tourism funding · Centre + State (FY 26-27)",
}

# (Domestic footfall lakh/mo, FTA thousand/mo, Occupancy %)
# Anchored to MoT Tourism Statistics 2023.
STATE_KPI_BASELINES: dict[str, tuple[float, float, float]] = {
    "Andhra Pradesh":   (210, 6, 64),
    "Arunachal Pradesh":(2.5, 0.3, 38),
    "Assam":            (62, 1.2, 50),
    "Bihar":            (32, 12, 58),
    "Chhattisgarh":     (42, 0.4, 46),
    "Goa":              (75, 75, 78),
    "Gujarat":          (155, 6, 60),
    "Haryana":          (130, 9, 62),
    "Himachal Pradesh": (160, 6, 64),
    "Jammu and Kashmir":(85, 1.6, 56),
    "Jharkhand":        (35, 0.6, 48),
    "Karnataka":        (290, 14, 70),
    "Kerala":           (190, 60, 72),
    "Madhya Pradesh":   (380, 4, 60),
    "Maharashtra":      (170, 95, 75),
    "Manipur":          (1.5, 0.1, 40),
    "Meghalaya":        (12, 0.5, 50),
    "Mizoram":          (1.0, 0.05, 38),
    "Nagaland":         (3, 0.3, 42),
    "Odisha":           (130, 1.4, 58),
    "Punjab":           (190, 14, 65),
    "Rajasthan":        (180, 65, 70),
    "Sikkim":           (15, 1.2, 55),
    "Tamil Nadu":       (245, 32, 72),
    "Telangana":        (220, 11, 68),
    "Tripura":          (4, 0.6, 48),
    "Uttar Pradesh":    (320, 22, 67),
    "Uttarakhand":      (160, 4, 64),
    "West Bengal":      (140, 16, 65),
    "Andaman and Nicobar":(2, 1.2, 60),
    "Chandigarh":       (20, 6, 70),
    "Dadra and Nagar Haveli":(8, 0.3, 50),
    "Daman and Diu":    (12, 0.4, 55),
    "Delhi":            (150, 220, 78),
    "Lakshadweep":      (0.2, 0.05, 40),
    "Puducherry":       (12, 4, 62),
}

STATE_FUNDING: dict[str, dict[str, float]] = {
    s: {"central": round(80 + bl.state_population_m(s) * 1.6, 1),
        "central_released": round((80 + bl.state_population_m(s) * 1.6) * 0.45, 1),
        "state": round(120 + bl.state_population_m(s) * 4, 1),
        "state_released": round((120 + bl.state_population_m(s) * 4) * 0.55, 1)}
    for s in STATE_KPI_BASELINES
}

STATE_SCHEME_OUTCOMES: dict[str, dict] = {
    "Tamil Nadu": {"hrce": 460, "destdev": 38, "ecotour": 28.0},
    "Gujarat":    {"rann": 84.0, "heritage": 22, "statue": 32.5},
}


def _seed(state: str) -> tuple[float, float, float]:
    return STATE_KPI_BASELINES.get(state, (50, 4, 55))


def state_snapshot(state: str, t: float) -> dict:
    rng = random.Random(f"{c.SEED}|tourism|state|{state}|tick")
    dtv0, fta0, occ0 = _seed(state)
    dtv = c.drift(dtv0, t, 17, 4.0)
    fta = c.drift(fta0, t, 19, 6.0)
    occ = c.drift(occ0, t, 23, 1.5)
    swadesh   = int(rng.gauss(28, 5) + dtv0 * 0.06)
    prashad   = int(rng.gauss(8, 2) + (dtv0 / 12))
    dekho     = round(c.drift(28.0 + rng.gauss(0, 6), t, 41, 1.5), 1)
    so = STATE_SCHEME_OUTCOMES.get(state, {})
    def _opt(key, p, amp):
        v = so.get(key); return None if v is None else round(c.drift(v, t, p, amp), 2)
    return {
        "region": state, "parent": None, "level": "state",
        "kpis": {"dtv": round(dtv, 1), "fta": round(fta, 1), "occ": round(occ, 1)},
        "schemes": {
            "central": {
                "swadesh": {"projects":   swadesh},
                "prashad": {"sites":      prashad},
                "dekho":   {"reach_lakh": dekho},
            },
            "state": {
                "hrce":     _opt("hrce", 41, 1.0),
                "destdev":  _opt("destdev", 31, 1.5),
                "ecotour":  _opt("ecotour", 23, 3.0),
                "rann":     _opt("rann", 19, 2.0),
                "heritage": _opt("heritage", 47, 1.0),
                "statue":   _opt("statue", 17, 4.0),
            },
        },
    }


def state_history(state: str) -> dict:
    return c.state_history(state, _seed(state),
                           improvement_per_year=(8.0, 12.0, 3.0),
                           sigma_pct=(6.0, 8.0, 2.0),
                           kpi_codes=("dtv", "fta", "occ"), dept_code="tourism")


def national_snapshot(t: float) -> dict:
    states = list(STATE_KPI_BASELINES.keys())
    snaps = [state_snapshot(s, t) for s in states]
    pop = {s: bl.state_population_m(s) for s in states}; total_pop = sum(pop.values())
    return {
        "kpis": {
            "dtv": round(sum(sn["kpis"]["dtv"] for sn in snaps), 1),
            "fta": round(sum(sn["kpis"]["fta"] for sn in snaps), 1),
            "occ": round(sum(sn["kpis"]["occ"] * pop[sn["region"]] for sn in snaps) / total_pop, 1),
        },
        "schemes": {
            "central": {
                "swadesh": {"projects":   sum(sn["schemes"]["central"]["swadesh"]["projects"] for sn in snaps)},
                "prashad": {"sites":      sum(sn["schemes"]["central"]["prashad"]["sites"] for sn in snaps)},
                "dekho":   {"reach_lakh": round(sum(sn["schemes"]["central"]["dekho"]["reach_lakh"] for sn in snaps), 1)},
            },
            "state": {},
        },
        "covered_states": len(states),
    }


def national_history() -> dict:
    states = list(STATE_KPI_BASELINES.keys())
    per_state = {s: state_history(s) for s in states}
    months = next(iter(per_state.values()))["months"]
    pop = {s: bl.state_population_m(s) for s in states}; total_pop = sum(pop.values())
    series = {k: [] for k in ("dtv", "fta", "occ")}
    for i in range(len(months)):
        # dtv & fta are sums; occ is pop-weighted
        series["dtv"].append(round(sum(per_state[s]["series"]["dtv"][i] for s in states), 1))
        series["fta"].append(round(sum(per_state[s]["series"]["fta"][i] for s in states), 1))
        series["occ"].append(round(sum(per_state[s]["series"]["occ"][i] * pop[s] for s in states) / total_pop, 1))
    return {"months": months, "series": series}


def state_funding(state: str) -> dict:
    f = STATE_FUNDING.get(state, {"central": 100, "central_released": 45, "state": 200, "state_released": 110})
    return {**f, "central_release_pct": c.funding_release_pct(f["central"], f["central_released"]),
            "state_release_pct": c.funding_release_pct(f["state"], f["state_released"]),
            "total_allocated": f["central"] + f["state"], "total_released": f["central_released"] + f["state_released"]}

def all_funding() -> dict:
    return {s: state_funding(s) for s in STATE_KPI_BASELINES}

def detect_anomalies() -> list[dict]:
    return c.detect_anomalies(list(STATE_KPI_BASELINES.keys()), state_history,
                              thresholds={"dtv": 12.0, "fta": 18.0, "occ": 5.0},
                              direction={"dtv": "higher_is_better", "fta": "higher_is_better", "occ": "higher_is_better"},
                              dept_code="tourism")
