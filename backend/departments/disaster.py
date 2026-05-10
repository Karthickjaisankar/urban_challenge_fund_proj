"""Disaster Management department.
KPIs: Avg Response Time (min), Early Warning Coverage (%), Relief Disbursement Speed (days).
"""
from __future__ import annotations
import random
from .. import baselines as bl
from . import common as c

META = {
    "code": "disaster", "name": "Disaster Management", "accent": "#b81d24", "icon": "Siren",
    "kpis": [
        {"code": "art", "name": "Avg Response Time",        "short": "ART",   "unit": "min",  "direction": "lower_is_better",  "accent": "#b81d24"},
        {"code": "ewc", "name": "Early Warning Coverage",   "short": "EWC",   "unit": "%",     "direction": "higher_is_better", "accent": "#0c4ca3"},
        {"code": "rds", "name": "Relief Disbursement Speed","short": "Relief","unit": "days",  "direction": "lower_is_better",  "accent": "#ff7722"},
    ],
    "central_schemes": [
        {"code": "ncrmp",  "name": "NCRMP",            "metric": "Multi-purpose cyclone shelters built", "unit": "count", "value_path": ["central", "ncrmp", "shelters"],   "format": "int", "accent": "#b81d24"},
        {"code": "aapda",  "name": "Aapda Mitra",      "metric": "Volunteers trained (cumulative)",       "unit": "count", "value_path": ["central", "aapda", "volunteers"], "format": "int", "accent": "#0c4ca3"},
        {"code": "sdrf",   "name": "SDRF Allocations", "metric": "% SDRF utilised vs allocation",         "unit": "%",     "value_path": ["central", "sdrf", "util_pct"],     "format": "pct", "accent": "#128807"},
    ],
    "tn_schemes": [
        {"code": "tnsmart",  "name": "TN-SMART",                 "metric": "Multi-hazard alerts issued/yr",         "unit": "count", "value_path": ["state", "tnsmart"],  "format": "int", "accent": "#b81d24"},
        {"code": "coastal",  "name": "Coastal DRR Project",      "metric": "% evacuation routes ready",              "unit": "%",     "value_path": ["state", "coastal"],  "format": "pct", "accent": "#0c4ca3"},
        {"code": "seoc",     "name": "SEOC Upgradation",         "metric": "Comms uptime (%)",                       "unit": "%",     "value_path": ["state", "seoc"],     "format": "pct", "accent": "#128807"},
    ],
    "gj_schemes": [
        {"code": "schoolsafe", "name": "GSDMA School Safety",        "metric": "Mock drills conducted (lakh/yr)", "unit": "lakh", "value_path": ["state", "schoolsafe"], "format": "dec", "accent": "#b81d24"},
        {"code": "smriti",     "name": "Earthquake Resilience",     "metric": "Buildings retrofitted (count)",   "unit": "count","value_path": ["state", "smriti"],     "format": "int", "accent": "#0c4ca3"},
        {"code": "ewbs",       "name": "Early Warning Broadcast",   "metric": "Sirens online (%)",                "unit": "%",    "value_path": ["state", "ewbs"],       "format": "pct", "accent": "#128807"},
    ],
    "tagline_funding": "Disaster Mgmt funding · Centre + State (FY 26-27)",
}

# (ART min, EWC %, RDS days)
STATE_KPI_BASELINES: dict[str, tuple[float, float, float]] = {
    "Andhra Pradesh":(18, 88, 14),  "Arunachal Pradesh":(35, 60, 28),
    "Assam":(22, 76, 18),  "Bihar":(28, 70, 22),
    "Chhattisgarh":(25, 72, 20),  "Goa":(15, 90, 12),
    "Gujarat":(15, 92, 10),  "Haryana":(18, 85, 14),
    "Himachal Pradesh":(28, 68, 18),  "Jammu and Kashmir":(30, 70, 22),
    "Jharkhand":(28, 70, 22),  "Karnataka":(18, 86, 14),
    "Kerala":(14, 92, 11),  "Madhya Pradesh":(24, 75, 18),
    "Maharashtra":(15, 88, 12),  "Manipur":(35, 60, 30),
    "Meghalaya":(30, 60, 28),  "Mizoram":(32, 58, 30),
    "Nagaland":(30, 58, 28),  "Odisha":(13, 95, 10),
    "Punjab":(18, 84, 14),  "Rajasthan":(22, 76, 18),
    "Sikkim":(25, 72, 18),  "Tamil Nadu":(13, 92, 10),
    "Telangana":(16, 88, 13),  "Tripura":(28, 70, 20),
    "Uttar Pradesh":(28, 70, 22),  "Uttarakhand":(26, 75, 18),
    "West Bengal":(20, 84, 16),
    "Andaman and Nicobar":(35, 70, 25),  "Chandigarh":(12, 92, 10),
    "Dadra and Nagar Haveli":(20, 80, 16),  "Daman and Diu":(20, 80, 16),
    "Delhi":(11, 95, 9),  "Lakshadweep":(40, 65, 25),  "Puducherry":(14, 90, 12),
}

STATE_FUNDING: dict[str, dict[str, float]] = {
    s: {"central": round(450 + bl.state_population_m(s) * 7.5, 1),
        "central_released": round((450 + bl.state_population_m(s) * 7.5) * 0.52, 1),
        "state": round(680 + bl.state_population_m(s) * 14.0, 1),
        "state_released": round((680 + bl.state_population_m(s) * 14.0) * 0.58, 1)}
    for s in STATE_KPI_BASELINES
}

STATE_SCHEME_OUTCOMES: dict[str, dict] = {
    "Tamil Nadu": {"tnsmart": 280, "coastal": 78, "seoc": 99.4},
    "Gujarat":    {"schoolsafe": 8.4, "smriti": 12500, "ewbs": 92.0},
}


def _seed(state: str) -> tuple[float, float, float]:
    return STATE_KPI_BASELINES.get(state, (22, 78, 18))


def state_snapshot(state: str, t: float) -> dict:
    rng = random.Random(f"{c.SEED}|disaster|state|{state}|tick")
    art0, ewc0, rds0 = _seed(state)
    pop = bl.state_population_m(state)
    art = c.drift(art0, t, 19, 2.0)
    ewc = c.drift(ewc0, t, 47, 0.4)
    rds = c.drift(rds0, t, 31, 1.5)
    ncrmp_shelters    = int(pop * 0.6 + rng.gauss(0, 5))
    aapda_volunteers  = int(pop * 90 + rng.gauss(0, 100))
    sdrf_pct          = c.drift(64.0 + rng.gauss(0, 4), t, 41, 0.6)
    so = STATE_SCHEME_OUTCOMES.get(state, {})
    def _opt(key, p, amp):
        v = so.get(key)
        return None if v is None else round(c.drift(v, t, p, amp), 2)
    return {
        "region": state, "parent": None, "level": "state",
        "kpis": {"art": round(art, 1), "ewc": round(ewc, 1), "rds": round(rds, 1)},
        "schemes": {
            "central": {
                "ncrmp": {"shelters":   ncrmp_shelters},
                "aapda": {"volunteers": aapda_volunteers},
                "sdrf":  {"util_pct":   round(sdrf_pct, 1)},
            },
            "state": {
                "tnsmart":    _opt("tnsmart", 19, 4.0),
                "coastal":    _opt("coastal", 47, 0.8),
                "seoc":       _opt("seoc", 53, 0.2),
                "schoolsafe": _opt("schoolsafe", 23, 2.5),
                "smriti":     _opt("smriti", 53, 1.0),
                "ewbs":       _opt("ewbs", 41, 0.6),
            },
        },
    }


def state_history(state: str) -> dict:
    return c.state_history(state, _seed(state),
                           improvement_per_year=(-6.0, 4.0, -8.0),
                           sigma_pct=(4.0, 1.5, 5.0),
                           kpi_codes=("art", "ewc", "rds"), dept_code="disaster")


def national_snapshot(t: float) -> dict:
    states = list(STATE_KPI_BASELINES.keys())
    snaps = [state_snapshot(s, t) for s in states]
    pop = {s: bl.state_population_m(s) for s in states}
    total_pop = sum(pop.values())
    def wm(key): return sum(sn["kpis"][key] * pop[sn["region"]] for sn in snaps) / total_pop
    return {
        "kpis": {"art": round(wm("art"), 1), "ewc": round(wm("ewc"), 1), "rds": round(wm("rds"), 1)},
        "schemes": {
            "central": {
                "ncrmp": {"shelters": sum(sn["schemes"]["central"]["ncrmp"]["shelters"] for sn in snaps)},
                "aapda": {"volunteers": sum(sn["schemes"]["central"]["aapda"]["volunteers"] for sn in snaps)},
                "sdrf":  {"util_pct": round(sum(sn["schemes"]["central"]["sdrf"]["util_pct"] * pop[sn["region"]] for sn in snaps) / total_pop, 1)},
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
    series = {k: [] for k in ("art", "ewc", "rds")}
    for i in range(len(months)):
        for k in series:
            series[k].append(round(sum(per_state[s]["series"][k][i] * pop[s] for s in states) / total_pop, 1))
    return {"months": months, "series": series}


def state_funding(state: str) -> dict:
    f = STATE_FUNDING.get(state, {"central": 200, "central_released": 100, "state": 280, "state_released": 150})
    return {**f, "central_release_pct": c.funding_release_pct(f["central"], f["central_released"]),
            "state_release_pct": c.funding_release_pct(f["state"], f["state_released"]),
            "total_allocated": f["central"] + f["state"], "total_released": f["central_released"] + f["state_released"]}

def all_funding() -> dict:
    return {s: state_funding(s) for s in STATE_KPI_BASELINES}

def detect_anomalies() -> list[dict]:
    return c.detect_anomalies(list(STATE_KPI_BASELINES.keys()), state_history,
                              thresholds={"art": 8.0, "ewc": 4.0, "rds": 8.0},
                              direction={"art": "lower_is_better", "ewc": "higher_is_better", "rds": "lower_is_better"},
                              dept_code="disaster")
