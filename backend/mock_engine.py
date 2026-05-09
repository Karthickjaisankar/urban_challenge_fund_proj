"""Mock data engine — produces realistic-looking values for the ICCC dashboard.

Two modes:
  1. history(): 24 months of monthly snapshots per state/district, anchored to
     real published baselines, with a per-region trend (improvement) and noise.
  2. tick(): the latest snapshot mutated slightly, plus monotonic counters for
     scheme deliveries (admissions, meals, etc.) for the live ICCC feel.

The engine is deterministic given a seed — so reload of the dashboard does not
shuffle values arbitrarily.
"""
from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone

from . import baselines as bl
from .data_dictionary import HEALTH, Department


# -- Configuration -----------------------------------------------------------

HISTORY_MONTHS = 24
SEED = 42
IST = timezone(timedelta(hours=5, minutes=30))


@dataclass
class HealthSnapshot:
    region: str
    parent: str | None
    level: str            # "state" | "district"
    imr: float
    mmr: float
    oope: float
    # Central scheme metrics (per the scheme-KPI research)
    pmjay_admissions: int           # PM-JAY: hospital admissions authorised — output volume tile
    pmjay_claims_cr: float          # PM-JAY: claims paid (₹ Cr)
    nhm_idr_pct: float              # NHM: institutional delivery rate (%) — outcome
    nhm_phc_funding_cr: float       # NHM: PHC funding utilised (₹ Cr) — secondary
    pmsma_high_risk_lakh: float     # PMSMA: high-risk pregnancies identified (lakh/mo) — outcome
    pmsma_anc_checkups: int         # PMSMA: ANC checkups today — secondary
    # State-specific scheme outcomes (None when scheme not applicable to this state)
    mtm_ncd_control: float | None
    ik48_golden_hour: float | None
    muthulakshmi_dbt: float | None
    ma_claims_per_1k: float | None
    chiranjeevi_bpl_idr: float | None
    khilkhilat_trips_lakh: float | None

    def to_dict(self) -> dict:
        return {
            "region": self.region,
            "parent": self.parent,
            "level": self.level,
            "kpis": {
                "imr":  round(self.imr, 1),
                "mmr":  round(self.mmr, 1),
                "oope": round(self.oope, 1),
            },
            "schemes": {
                "central": {
                    "pmjay": {
                        "admissions": self.pmjay_admissions,
                        "claims_cr":  round(self.pmjay_claims_cr, 2),
                    },
                    "nhm": {
                        "institutional_delivery_pct": round(self.nhm_idr_pct, 1),
                        "phc_funding_cr":             round(self.nhm_phc_funding_cr, 2),
                    },
                    "pmsma": {
                        "high_risk_pregnancies_lakh": round(self.pmsma_high_risk_lakh, 2),
                        "anc_checkups":                self.pmsma_anc_checkups,
                    },
                },
                "state": {
                    # Tamil Nadu schemes
                    "mtm":          None if self.mtm_ncd_control is None else round(self.mtm_ncd_control, 1),
                    "ik48":         None if self.ik48_golden_hour is None else round(self.ik48_golden_hour, 1),
                    "muthulakshmi": None if self.muthulakshmi_dbt is None else round(self.muthulakshmi_dbt, 1),
                    # Gujarat schemes
                    "ma":           None if self.ma_claims_per_1k is None else round(self.ma_claims_per_1k, 1),
                    "chiranjeevi":  None if self.chiranjeevi_bpl_idr is None else round(self.chiranjeevi_bpl_idr, 1),
                    "khilkhilat":   None if self.khilkhilat_trips_lakh is None else round(self.khilkhilat_trips_lakh, 2),
                },
            },
        }


# -- History generation -------------------------------------------------------

def _months_back(n: int) -> list[date]:
    """Return the first day of each of the last n months, oldest first."""
    today = date.today()
    out: list[date] = []
    y, m = today.year, today.month
    for _ in range(n):
        out.append(date(y, m, 1))
        m -= 1
        if m == 0:
            m = 12
            y -= 1
    return list(reversed(out))


def _trend(months: int, improvement_pct_per_year: float, idx: int) -> float:
    """Linear improvement factor for month idx (0 = oldest)."""
    pct_per_month = improvement_pct_per_year / 12.0 / 100.0
    # current month should equal baseline; oldest month should be (1 + improvement) higher for IMR/MMR
    return 1.0 + (months - 1 - idx) * pct_per_month


def _noisy(value: float, rng: random.Random, sigma_pct: float) -> float:
    return value * rng.gauss(1.0, sigma_pct / 100.0)


def health_state_history(state: str) -> dict:
    """Return {months: [...], series: {imr: [...], mmr: [...], oope: [...]}} for state."""
    rng = random.Random(f"{SEED}|state|{state}")
    imr0, mmr0, oope0 = bl.state_health_seed(state)
    months = _months_back(HISTORY_MONTHS)
    imr_series, mmr_series, oope_series = [], [], []
    for i, _m in enumerate(months):
        imr_series.append(round(_noisy(imr0 * _trend(HISTORY_MONTHS, 4.0, i), rng, 3.5), 1))
        mmr_series.append(round(_noisy(mmr0 * _trend(HISTORY_MONTHS, 5.0, i), rng, 4.0), 1))
        # OOPE moves slowly and can go either way
        oope_series.append(round(_noisy(oope0 * _trend(HISTORY_MONTHS, 1.5, i), rng, 2.0), 1))
    return {
        "months": [m.strftime("%Y-%m") for m in months],
        "series": {"imr": imr_series, "mmr": mmr_series, "oope": oope_series},
    }


def health_district_history(district: str, parent_state: str) -> dict:
    rng = random.Random(f"{SEED}|district|{parent_state}|{district}")
    imr0, mmr0, oope0 = bl.district_health_seed(district, parent_state)
    months = _months_back(HISTORY_MONTHS)
    imr_series, mmr_series, oope_series = [], [], []
    for i, _m in enumerate(months):
        imr_series.append(round(_noisy(imr0 * _trend(HISTORY_MONTHS, 3.5, i), rng, 5.0), 1))
        mmr_series.append(round(_noisy(mmr0 * _trend(HISTORY_MONTHS, 4.5, i), rng, 6.0), 1))
        oope_series.append(round(_noisy(oope0 * _trend(HISTORY_MONTHS, 1.0, i), rng, 3.5), 1))
    return {
        "months": [m.strftime("%Y-%m") for m in months],
        "series": {"imr": imr_series, "mmr": mmr_series, "oope": oope_series},
    }


# -- Live snapshot ------------------------------------------------------------

def _baseline_admissions_per_day(pop_m: float) -> int:
    """PM-JAY admissions ~~ 0.45 per 1000 BPL pop / day (back-of-envelope)."""
    bpl_pop = pop_m * 0.4  # rough BPL share
    return int(bpl_pop * 1000 * 0.00045 * 1000)  # crude scaling


def _baseline_anc_per_day(pop_m: float) -> int:
    return int(pop_m * 1000 * 0.0006 * 1000)


def _baseline_phc_funding_cr_year(pop_m: float) -> float:
    # NHM rough per-capita allocation ~₹350/yr at PHC level
    return round(pop_m * 1_000_000 * 350 / 1e7, 2)


def _drift_pct(value: float, t: float, period: float, amp_pct: float) -> float:
    """Smoothly drift a value within ±amp_pct using sin(t/period)."""
    return value * (1.0 + (amp_pct / 100.0) * math.sin(t / period))


def health_state_snapshot(state: str, t: float) -> HealthSnapshot:
    rng = random.Random(f"{SEED}|state|{state}|tick")
    imr0, mmr0, oope0 = bl.state_health_seed(state)
    pop_m = bl.state_population_m(state)
    outcomes = bl.state_health_outcomes(state)

    drift = 0.005
    imr = imr0 * (1.0 + drift * math.sin(t / 17.0 + rng.random() * 6.28))
    mmr = mmr0 * (1.0 + drift * math.sin(t / 23.0 + rng.random() * 6.28))
    oope = oope0 * (1.0 + drift * math.cos(t / 31.0))

    seconds_today = int(t) % 86400
    daily_admit = _baseline_admissions_per_day(pop_m)
    daily_anc = _baseline_anc_per_day(pop_m)
    jitter = rng.gauss(1.0, 0.04)

    pmjay_admissions = int(daily_admit * (seconds_today / 86400) * jitter)
    pmjay_claims_cr = pmjay_admissions * 0.00045 * jitter
    pmsma_anc = int(daily_anc * (seconds_today / 86400) * jitter)
    nhm_phc_funding_cr = _baseline_phc_funding_cr_year(pop_m) * (
        (datetime.now(IST).timetuple().tm_yday / 365.0) * jitter
    )

    # Outcome KPIs drift very slowly (sub-percent) — these are policy outcomes
    nhm_idr = _drift_pct(outcomes.get("idr") or 88.0, t, 41, 0.4)
    pmsma_hr = _drift_pct(outcomes.get("hr_preg_lakh") or 0.20, t, 53, 1.5)

    def _opt(key: str, period: float, amp: float) -> float | None:
        v = outcomes.get(key)
        return None if v is None else _drift_pct(v, t, period, amp)

    return HealthSnapshot(
        region=state, parent=None, level="state",
        imr=imr, mmr=mmr, oope=oope,
        pmjay_admissions=pmjay_admissions, pmjay_claims_cr=pmjay_claims_cr,
        nhm_idr_pct=nhm_idr, nhm_phc_funding_cr=nhm_phc_funding_cr,
        pmsma_high_risk_lakh=pmsma_hr, pmsma_anc_checkups=pmsma_anc,
        mtm_ncd_control=_opt("mtm_ncd_control", 19, 1.2),
        ik48_golden_hour=_opt("ik48_golden_hour", 23, 1.4),
        muthulakshmi_dbt=_opt("muthulakshmi_dbt", 47, 0.6),
        ma_claims_per_1k=_opt("ma_claims_per_1k", 31, 1.8),
        chiranjeevi_bpl_idr=_opt("chiranjeevi_bpl_idr", 37, 1.0),
        khilkhilat_trips_lakh=_opt("khilkhilat_trips_lakh", 29, 2.5),
    )


def health_district_snapshot(district: str, parent_state: str, t: float) -> HealthSnapshot:
    rng = random.Random(f"{SEED}|district|{parent_state}|{district}|tick")
    imr0, mmr0, oope0 = bl.district_health_seed(district, parent_state)
    state_pop_m = bl.state_population_m(parent_state)
    district_pop_m = max(0.5, state_pop_m / 32.0)
    state_outcomes = bl.state_health_outcomes(parent_state)

    drift = 0.008
    imr = imr0 * (1.0 + drift * math.sin(t / 13.0 + rng.random() * 6.28))
    mmr = mmr0 * (1.0 + drift * math.sin(t / 19.0 + rng.random() * 6.28))
    oope = oope0 * (1.0 + drift * math.cos(t / 29.0))

    seconds_today = int(t) % 86400
    jitter = rng.gauss(1.0, 0.06)
    pmjay_admissions = int(_baseline_admissions_per_day(district_pop_m) * (seconds_today / 86400) * jitter)
    pmjay_claims_cr = pmjay_admissions * 0.00045 * jitter
    pmsma_anc = int(_baseline_anc_per_day(district_pop_m) * (seconds_today / 86400) * jitter)
    nhm_phc_funding_cr = _baseline_phc_funding_cr_year(district_pop_m) * (
        (datetime.now(IST).timetuple().tm_yday / 365.0) * jitter
    )

    # District-level IDR varies more around state mean (urban better, tribal worse)
    state_idr = state_outcomes.get("idr") or 88.0
    district_idr = max(40.0, min(100.0, state_idr + rng.gauss(0, 3.0)))
    state_hr = state_outcomes.get("hr_preg_lakh") or 0.20
    district_hr = max(0.0, state_hr / 32 * (1.0 + rng.gauss(0, 0.15)))

    def _opt(key: str, period: float, amp: float) -> float | None:
        v = state_outcomes.get(key)
        return None if v is None else _drift_pct(v, t, period, amp)

    return HealthSnapshot(
        region=district, parent=parent_state, level="district",
        imr=imr, mmr=mmr, oope=oope,
        pmjay_admissions=pmjay_admissions, pmjay_claims_cr=pmjay_claims_cr,
        nhm_idr_pct=district_idr, nhm_phc_funding_cr=nhm_phc_funding_cr,
        pmsma_high_risk_lakh=district_hr, pmsma_anc_checkups=pmsma_anc,
        mtm_ncd_control=_opt("mtm_ncd_control", 19, 2.0),
        ik48_golden_hour=_opt("ik48_golden_hour", 23, 2.0),
        muthulakshmi_dbt=_opt("muthulakshmi_dbt", 47, 1.0),
        ma_claims_per_1k=_opt("ma_claims_per_1k", 31, 2.5),
        chiranjeevi_bpl_idr=_opt("chiranjeevi_bpl_idr", 37, 1.5),
        khilkhilat_trips_lakh=_opt("khilkhilat_trips_lakh", 29, 3.0),
    )


# -- National rollup ----------------------------------------------------------

def detect_state_anomalies(states: list[str]) -> list[dict]:
    """Look for MoM swings of >3% in IMR/MMR or >5% in OOPE across all states.

    Returns a list of anomaly events sorted by severity (largest swing first).
    """
    out: list[dict] = []
    for s in states:
        h = health_state_history(s)
        for metric, threshold in (("imr", 3.0), ("mmr", 3.0), ("oope", 5.0)):
            series = h["series"][metric]
            if len(series) < 2:
                continue
            cur = series[-1]
            prev = series[-2]
            if prev <= 0:
                continue
            pct = (cur - prev) / prev * 100
            if abs(pct) >= threshold:
                out.append({
                    "region": s,
                    "level": "state",
                    "metric": metric,
                    "current": cur,
                    "previous": prev,
                    "pct_change": round(pct, 2),
                    "direction": "up" if pct > 0 else "down",
                    "is_concerning": (pct > 0),  # all 3 are lower-is-better
                    "month": h["months"][-1],
                })
    out.sort(key=lambda a: abs(a["pct_change"]), reverse=True)
    return out


def rank_states_by_kpi(metric: str, t: float) -> list[dict]:
    """Return all states ranked best→worst on the given health KPI."""
    states = sorted(bl.HEALTH_STATE_BASELINES.keys())
    rows = []
    for s in states:
        snap = health_state_snapshot(s, t)
        kpis = snap.to_dict()["kpis"]
        rows.append({
            "region": s,
            "value": kpis[metric],
            "level": "state",
            "population_m": bl.state_population_m(s),
        })
    # All 3 health KPIs are lower-is-better; sort ascending = best→worst
    rows.sort(key=lambda r: r["value"])
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    return rows


def rank_districts_by_kpi(state: str, metric: str, t: float) -> list[dict]:
    if state != "Tamil Nadu":
        return []
    districts = list(bl.HEALTH_DISTRICT_BASELINES.keys())
    rows = []
    for d in districts:
        snap = health_district_snapshot(d, state, t)
        rows.append({
            "region": d,
            "value": snap.to_dict()["kpis"][metric],
            "level": "district",
        })
    rows.sort(key=lambda r: r["value"])
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    return rows


def health_national_snapshot(t: float) -> dict:
    """Aggregate over all states for the top-bar national tiles."""
    states = list(bl.HEALTH_STATE_BASELINES.keys())
    snaps = [health_state_snapshot(s, t) for s in states]
    total_pop = sum(bl.state_population_m(s) for s in states)
    imr = sum(sn.imr * bl.state_population_m(sn.region) for sn in snaps) / total_pop
    mmr = sum(sn.mmr * bl.state_population_m(sn.region) for sn in snaps) / total_pop
    oope = sum(sn.oope * bl.state_population_m(sn.region) for sn in snaps) / total_pop
    idr = sum(sn.nhm_idr_pct * bl.state_population_m(sn.region) for sn in snaps) / total_pop
    return {
        "kpis": {
            "imr":  round(imr, 1),
            "mmr":  round(mmr, 1),
            "oope": round(oope, 1),
        },
        "schemes": {
            "central": {
                "pmjay": {
                    "admissions": sum(sn.pmjay_admissions for sn in snaps),
                    "claims_cr":  round(sum(sn.pmjay_claims_cr for sn in snaps), 1),
                },
                "nhm": {
                    "institutional_delivery_pct": round(idr, 1),
                    "phc_funding_cr":             round(sum(sn.nhm_phc_funding_cr for sn in snaps), 1),
                },
                "pmsma": {
                    "high_risk_pregnancies_lakh": round(sum(sn.pmsma_high_risk_lakh for sn in snaps), 2),
                    "anc_checkups":                sum(sn.pmsma_anc_checkups for sn in snaps),
                },
            },
            # National rollup doesn't surface a single state-scheme — the front-end
            # falls back to TN/GJ when those states are focused.
            "state": {},
        },
        "covered_states": len(states),
    }
