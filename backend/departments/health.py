"""Health department module — wraps the existing health baselines/mock_engine
into the generic department interface. The legacy `/api/health/...` routes
keep working, and the new `/api/dept/health/...` routes share the same data."""
from __future__ import annotations

from .. import baselines as bl
from .. import mock_engine as me
from . import common as c


META = {
    "code": "health",
    "name": "Health",
    "accent": "#128807",
    "icon": "HeartPulse",
    "kpis": [
        {"code": "imr",  "name": "Infant Mortality Rate",     "short": "IMR",  "unit": "per 1,000 live births",   "direction": "lower_is_better", "accent": "#0c4ca3"},
        {"code": "mmr",  "name": "Maternal Mortality Ratio",  "short": "MMR",  "unit": "per 100,000 live births", "direction": "lower_is_better", "accent": "#c4368e"},
        {"code": "oope", "name": "Out-of-Pocket Expenditure", "short": "OOPE", "unit": "% of total health exp.",  "direction": "lower_is_better", "accent": "#ff7722"},
    ],
    "central_schemes": [
        {"code": "pmjay", "name": "Ayushman Bharat (PM-JAY)",        "metric": "Hospital admissions authorised today", "unit": "admissions", "value_path": ["central", "pmjay", "admissions"],                  "format": "int", "accent": "#0c4ca3"},
        {"code": "nhm",   "name": "National Health Mission",         "metric": "Institutional Delivery Rate",          "unit": "%",          "value_path": ["central", "nhm", "institutional_delivery_pct"],     "format": "pct", "accent": "#128807"},
        {"code": "pmsma", "name": "PM Surakshit Matritva Abhiyan",   "metric": "High-risk pregnancies identified",     "unit": "lakh/mo",    "value_path": ["central", "pmsma", "high_risk_pregnancies_lakh"],   "format": "dec", "accent": "#c4368e"},
    ],
    "tn_schemes": [
        {"code": "mtm",          "name": "Makkalai Thedi Maruthuvam",          "metric": "% NCD patients with controlled BP/sugar",     "unit": "%", "value_path": ["state", "mtm"],          "format": "pct", "accent": "#128807"},
        {"code": "ik48",         "name": "Innuyir Kappom (Nammai Kaakkum 48)", "metric": "% accident victims treated within golden hr", "unit": "%", "value_path": ["state", "ik48"],         "format": "pct", "accent": "#0c4ca3"},
        {"code": "muthulakshmi", "name": "Dr Muthulakshmi Reddy Maternity",    "metric": "% women receiving full ₹18,000 entitlement",  "unit": "%", "value_path": ["state", "muthulakshmi"], "format": "pct", "accent": "#c4368e"},
    ],
    "gj_schemes": [
        {"code": "ma",          "name": "Mukhyamantri Amrutam (MA) Yojana", "metric": "Tertiary-care claims per 1k families",    "unit": "claims/1k", "value_path": ["state", "ma"],          "format": "dec", "accent": "#128807"},
        {"code": "chiranjeevi", "name": "Chiranjeevi Yojana",                "metric": "% institutional deliveries among BPL",     "unit": "%",         "value_path": ["state", "chiranjeevi"], "format": "pct", "accent": "#0c4ca3"},
        {"code": "khilkhilat",  "name": "Khilkhilat Ambulance Service",     "metric": "Newborn safe-transport trips/yr",          "unit": "lakh",      "value_path": ["state", "khilkhilat"],  "format": "dec", "accent": "#c4368e"},
    ],
    "tagline_funding": "Health funding · Centre + State (FY 26-27)",
}


def state_snapshot(state: str, t: float) -> dict:
    return me.health_state_snapshot(state, t).to_dict()


def state_history(state: str) -> dict:
    return me.health_state_history(state)


def national_snapshot(t: float) -> dict:
    return me.health_national_snapshot(t)


def national_history() -> dict:
    states = sorted(bl.HEALTH_STATE_BASELINES.keys())
    per_state = {s: me.health_state_history(s) for s in states}
    months = next(iter(per_state.values()))["months"]
    pop = {s: bl.state_population_m(s) for s in states}
    total_pop = sum(pop.values())
    series = {"imr": [], "mmr": [], "oope": []}
    for i in range(len(months)):
        for k in series:
            series[k].append(round(sum(per_state[s]["series"][k][i] * pop[s] for s in states) / total_pop, 1))
    return {"months": months, "series": series}


def state_funding(state: str) -> dict:
    return bl.state_health_funding(state)


def all_funding() -> dict:
    return {s: bl.state_health_funding(s) for s in sorted(bl.HEALTH_STATE_BASELINES.keys())}


def detect_anomalies() -> list[dict]:
    states = sorted(bl.HEALTH_STATE_BASELINES.keys())
    return me.detect_state_anomalies(states)
