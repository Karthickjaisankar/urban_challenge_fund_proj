"""Energy department — Smart-city energy KPIs: renewable share, grid reliability,
and EV charging penetration.

KPI baselines anchored to:
- Central Electricity Authority (CEA) State-wise installed capacity 2023-24
- NITI Aayog SDG India Index 2023 (energy indicators)
- MoP / DISCOM annual reports
"""
from __future__ import annotations

import math
import random
from .. import baselines as bl
from . import common as c

META = {
    "code": "energy", "name": "Energy", "accent": "#7FE0FF", "icon": "Zap",
    "kpis": [
        {"code": "renewable_pct", "name": "Renewable Energy Share",     "short": "RE%",   "unit": "%",    "direction": "higher_is_better", "accent": "#7FE0FF"},
        {"code": "ais",           "name": "Avg. Interruption Duration", "short": "AIS",   "unit": "hrs/yr","direction": "lower_is_better",  "accent": "#FFB347"},
        {"code": "ev_per_lakh",   "name": "EV Registrations",          "short": "EV/L",  "unit": "per lakh pop","direction": "higher_is_better", "accent": "#A78BFA"},
    ],
    "central_schemes": [
        {"code": "pm_kusum",   "name": "PM-KUSUM",                   "metric": "Solar pumps installed (cumulative)", "unit": "count",  "value_path": ["central", "pm_kusum", "solar_pumps"], "format": "int", "accent": "#7FE0FF"},
        {"code": "sristi",     "name": "SRISTI / RDSS",              "metric": "DISCOM loss reduction (%)",           "unit": "%",       "value_path": ["central", "sristi", "loss_pct"],    "format": "pct", "accent": "#FFB347"},
        {"code": "fame2",      "name": "FAME-II / PM E-DRIVE",       "metric": "EV subsidies disbursed (₹ Cr)",       "unit": "₹ Cr",    "value_path": ["central", "fame2", "subsidy_cr"],  "format": "cr",  "accent": "#A78BFA"},
    ],
    "tn_schemes": [
        {"code": "tnredco",    "name": "TNREDCO Solar Rooftop",       "metric": "Rooftop solar installed (MW)",        "unit": "MW",      "value_path": ["state", "tnredco"],   "format": "dec", "accent": "#7FE0FF"},
        {"code": "tangedco",   "name": "TANGEDCO Grid Upgradation",   "metric": "% feeders with 24×7 supply",          "unit": "%",       "value_path": ["state", "tangedco"],  "format": "pct", "accent": "#FFB347"},
        {"code": "tn_ev_hub",  "name": "TN EV Policy Charging Hubs",  "metric": "Public EV chargers installed",         "unit": "count",   "value_path": ["state", "tn_ev_hub"], "format": "int", "accent": "#A78BFA"},
    ],
    "gj_schemes": [
        {"code": "surya_gj",   "name": "Surya Gujarat",               "metric": "Residential solar connections",        "unit": "lakh",    "value_path": ["state", "surya_gj"],   "format": "dec", "accent": "#7FE0FF"},
        {"code": "gj_discom",  "name": "PGVCL/DGVCL Upgradation",    "metric": "% villages with smart meters",         "unit": "%",       "value_path": ["state", "gj_discom"],  "format": "pct", "accent": "#FFB347"},
        {"code": "gj_ev",      "name": "Gujarat EV Policy",           "metric": "EV subsidy disbursed (₹ Cr)",          "unit": "₹ Cr",    "value_path": ["state", "gj_ev"],      "format": "cr",  "accent": "#A78BFA"},
    ],
    "tagline_funding": "Energy funding · Centre + State (FY 26-27)",
}

# (Renewable share %, Avg Interruption hrs/yr, EV per lakh pop)
# Sources: CEA Renewable capacity share 2023, MoP SAIDI proxy, Vahan 2024 EV data
STATE_KPI_BASELINES: dict[str, tuple[float, float, float]] = {
    "Andhra Pradesh":   (52.0, 3.8, 42),
    "Arunachal Pradesh":(92.0, 22.0, 8),
    "Assam":            (35.0, 18.5, 18),
    "Bihar":            (12.0, 24.0, 22),
    "Chhattisgarh":     (30.0, 14.0, 19),
    "Goa":              (18.0, 5.2, 85),
    "Gujarat":          (54.0, 4.5, 95),
    "Haryana":          (28.0, 7.0, 82),
    "Himachal Pradesh": (95.0, 6.0, 28),
    "Jammu and Kashmir":(78.0, 14.0, 24),
    "Jharkhand":        (18.0, 22.0, 17),
    "Karnataka":        (69.0, 3.5, 122),
    "Kerala":           (40.0, 4.8, 140),
    "Madhya Pradesh":   (48.0, 9.0, 35),
    "Maharashtra":      (42.0, 5.8, 110),
    "Manipur":          (82.0, 28.0, 6),
    "Meghalaya":        (88.0, 26.0, 7),
    "Mizoram":          (76.0, 24.0, 5),
    "Nagaland":         (72.0, 30.0, 4),
    "Odisha":           (38.0, 10.0, 28),
    "Punjab":           (25.0, 6.5, 70),
    "Rajasthan":        (68.0, 7.5, 62),
    "Sikkim":           (98.0, 8.0, 12),
    "Tamil Nadu":       (65.0, 4.2, 132),
    "Telangana":        (50.0, 5.0, 88),
    "Tripura":          (22.0, 20.0, 10),
    "Uttar Pradesh":    (18.0, 16.0, 45),
    "Uttarakhand":      (88.0, 7.0, 38),
    "West Bengal":      (22.0, 9.5, 42),
    "Andaman and Nicobar":(15.0, 18.0, 18),
    "Chandigarh":       (30.0, 3.0, 200),
    "Dadra and Nagar Haveli":(20.0, 4.5, 95),
    "Daman and Diu":    (18.0, 4.0, 88),
    "Delhi":            (18.0, 3.2, 320),
    "Lakshadweep":      (30.0, 12.0, 15),
    "Puducherry":       (22.0, 4.5, 180),
}

STATE_FUNDING: dict[str, dict[str, float]] = {
    s: {"central": round(850 + bl.state_population_m(s) * 15.5, 1),
        "central_released": round((850 + bl.state_population_m(s) * 15.5) * 0.54, 1),
        "state": round(1200 + bl.state_population_m(s) * 28, 1),
        "state_released": round((1200 + bl.state_population_m(s) * 28) * 0.60, 1)}
    for s in STATE_KPI_BASELINES
}

STATE_SCHEME_OUTCOMES: dict[str, dict] = {
    "Tamil Nadu": {"tnredco": 2850.0, "tangedco": 86.0, "tn_ev_hub": 1240},
    "Gujarat":    {"surya_gj": 4.2, "gj_discom": 72.0, "gj_ev": 420.0},
}


def _seed(s: str) -> tuple[float, float, float]:
    return STATE_KPI_BASELINES.get(s, (30.0, 12.0, 40))


def state_snapshot(state: str, t: float) -> dict:
    rng = random.Random(f"{c.SEED}|energy|{state}|tick")
    re0, ais0, ev0 = _seed(state)
    pop = bl.state_population_m(state)
    re  = c.drift(re0,  t, 53, 0.8)
    ais = c.drift(ais0, t, 41, 2.0)
    ev  = c.drift(ev0,  t, 29, 1.5)
    # Central schemes
    pumps   = int(pop * 120 * c.drift(1.0, t, 47, 1.5) * rng.gauss(1, 0.04))
    loss_pct = c.drift(max(8.0, 28 - re0 * 0.18 + rng.gauss(0, 2)), t, 37, 0.8)
    sub_cr  = round(pop * 0.95 * c.fy_progress() * rng.gauss(1, 0.04), 1)
    so = STATE_SCHEME_OUTCOMES.get(state, {})
    def _opt(key, p, amp):
        v = so.get(key)
        return None if v is None else round(c.drift(v, t, p, amp), 2)
    return {
        "region": state, "parent": None, "level": "state",
        "kpis": {"renewable_pct": round(re, 1), "ais": round(ais, 1), "ev_per_lakh": round(ev, 0)},
        "schemes": {
            "central": {
                "pm_kusum": {"solar_pumps": pumps},
                "sristi":   {"loss_pct": round(loss_pct, 1)},
                "fame2":    {"subsidy_cr": sub_cr},
            },
            "state": {
                "tnredco":   _opt("tnredco", 53, 1.0),
                "tangedco":  _opt("tangedco", 41, 0.6),
                "tn_ev_hub": _opt("tn_ev_hub", 31, 2.5),
                "surya_gj":  _opt("surya_gj", 37, 1.5),
                "gj_discom": _opt("gj_discom", 47, 0.8),
                "gj_ev":     _opt("gj_ev", 29, 2.0),
            },
        },
    }


def state_history(state: str) -> dict:
    return c.state_history(state, _seed(state),
                           improvement_per_year=(6.0, -10.0, 25.0),
                           sigma_pct=(3.0, 6.0, 8.0),
                           kpi_codes=("renewable_pct", "ais", "ev_per_lakh"),
                           dept_code="energy")


def national_snapshot(t: float) -> dict:
    states = list(STATE_KPI_BASELINES.keys())
    snaps = [state_snapshot(s, t) for s in states]
    pop = {s: bl.state_population_m(s) for s in states}
    total_pop = sum(pop.values())
    def wm(key): return sum(sn["kpis"][key] * pop[sn["region"]] for sn in snaps) / total_pop
    return {
        "kpis": {"renewable_pct": round(wm("renewable_pct"), 1), "ais": round(wm("ais"), 1), "ev_per_lakh": round(wm("ev_per_lakh"), 0)},
        "schemes": {
            "central": {
                "pm_kusum": {"solar_pumps": sum(sn["schemes"]["central"]["pm_kusum"]["solar_pumps"] for sn in snaps)},
                "sristi":   {"loss_pct": round(sum(sn["schemes"]["central"]["sristi"]["loss_pct"] * pop[sn["region"]] for sn in snaps) / total_pop, 1)},
                "fame2":    {"subsidy_cr": round(sum(sn["schemes"]["central"]["fame2"]["subsidy_cr"] for sn in snaps), 1)},
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
    series = {k: [] for k in ("renewable_pct", "ais", "ev_per_lakh")}
    for i in range(len(months)):
        for k in series:
            series[k].append(round(sum(per_state[s]["series"][k][i] * pop[s] for s in states) / total_pop, 1))
    return {"months": months, "series": series}


def state_funding(state: str) -> dict:
    f = STATE_FUNDING.get(state, {"central": 200, "central_released": 100, "state": 350, "state_released": 170})
    return {**f, "central_release_pct": c.funding_release_pct(f["central"], f["central_released"]),
            "state_release_pct":   c.funding_release_pct(f["state"],   f["state_released"]),
            "total_allocated": f["central"] + f["state"], "total_released": f["central_released"] + f["state_released"]}

def all_funding() -> dict:
    return {s: state_funding(s) for s in STATE_KPI_BASELINES}

def detect_anomalies() -> list[dict]:
    return c.detect_anomalies(list(STATE_KPI_BASELINES.keys()), state_history,
                              thresholds={"renewable_pct": 5.0, "ais": 10.0, "ev_per_lakh": 12.0},
                              direction={"renewable_pct": "higher_is_better", "ais": "lower_is_better", "ev_per_lakh": "higher_is_better"},
                              dept_code="energy")
