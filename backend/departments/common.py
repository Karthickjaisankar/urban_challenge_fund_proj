"""Shared machinery for all department modules — history generation, drift,
anomaly detection, ranking. Each dept module composes these."""
from __future__ import annotations

import math
import random
from datetime import date, datetime, timedelta, timezone

HISTORY_MONTHS = 24
SEED = 42
IST = timezone(timedelta(hours=5, minutes=30))


def months_back(n: int) -> list[date]:
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


def linear_trend(months: int, improvement_pct_per_year: float, idx: int) -> float:
    pct_per_month = improvement_pct_per_year / 12.0 / 100.0
    return 1.0 + (months - 1 - idx) * pct_per_month


def noisy(value: float, rng: random.Random, sigma_pct: float) -> float:
    return value * rng.gauss(1.0, sigma_pct / 100.0)


def drift(value: float, t: float, period: float, amp_pct: float) -> float:
    return value * (1.0 + (amp_pct / 100.0) * math.sin(t / period))


def state_history(
    state: str,
    seeds: tuple[float, float, float],
    improvement_per_year: tuple[float, float, float],
    sigma_pct: tuple[float, float, float],
    kpi_codes: tuple[str, str, str],
    dept_code: str,
) -> dict:
    """Generic 24-month history generator for a 3-KPI department."""
    rng = random.Random(f"{SEED}|{dept_code}|state|{state}")
    months = months_back(HISTORY_MONTHS)
    series: dict[str, list[float]] = {k: [] for k in kpi_codes}
    for i in range(HISTORY_MONTHS):
        for j, k in enumerate(kpi_codes):
            v = noisy(seeds[j] * linear_trend(HISTORY_MONTHS, improvement_per_year[j], i), rng, sigma_pct[j])
            series[k].append(round(v, 2))
    return {
        "months": [m.strftime("%Y-%m") for m in months],
        "series": series,
    }


def detect_anomalies(
    states: list[str],
    history_fn,
    thresholds: dict[str, float],
    direction: dict[str, str],
    dept_code: str,
) -> list[dict]:
    """Inspect each state's last-month-vs-prior-month change per KPI and emit
    anomalies above threshold. `direction` says whether each KPI is
    'lower_is_better' or 'higher_is_better'.
    """
    out: list[dict] = []
    for s in states:
        h = history_fn(s)
        for metric, thr in thresholds.items():
            series = h["series"].get(metric, [])
            if len(series) < 2:
                continue
            cur, prev = series[-1], series[-2]
            if prev <= 0:
                continue
            pct = (cur - prev) / prev * 100
            if abs(pct) >= thr:
                up_is_concerning = (direction.get(metric) == "lower_is_better")
                is_concerning = (pct > 0) if up_is_concerning else (pct < 0)
                out.append({
                    "region": s, "level": "state", "department": dept_code,
                    "metric": metric, "current": cur, "previous": prev,
                    "pct_change": round(pct, 2),
                    "direction": "up" if pct > 0 else "down",
                    "is_concerning": is_concerning,
                    "month": h["months"][-1],
                })
    out.sort(key=lambda a: abs(a["pct_change"]), reverse=True)
    return out


def fy_progress() -> float:
    """How far through the financial year (April → March) are we, [0,1]."""
    n = datetime.now(IST)
    fy_start = datetime(n.year if n.month >= 4 else n.year - 1, 4, 1, tzinfo=IST)
    fy_end = datetime(fy_start.year + 1, 4, 1, tzinfo=IST)
    return max(0.0, min(1.0, (n - fy_start).total_seconds() / (fy_end - fy_start).total_seconds()))


def seconds_today_frac(t: float) -> float:
    return (int(t) % 86400) / 86400.0


def funding_release_pct(allocated: float, released: float) -> float:
    return round(released / max(1, allocated) * 100, 1)


def total_funding_dict(per_state: dict[str, dict]) -> dict:
    total = {
        "central":           sum(v["central"]          for v in per_state.values()),
        "central_released":  sum(v["central_released"] for v in per_state.values()),
        "state":             sum(v["state"]            for v in per_state.values()),
        "state_released":    sum(v["state_released"]   for v in per_state.values()),
    }
    total["total_allocated"] = total["central"] + total["state"]
    total["total_released"]  = total["central_released"] + total["state_released"]
    total["central_release_pct"] = funding_release_pct(total["central"], total["central_released"])
    total["state_release_pct"]   = funding_release_pct(total["state"],   total["state_released"])
    return total


def population_weighted_mean(per_state: dict[str, dict], pop_m: dict[str, float], path: list[str]) -> float:
    """Pop-weighted average of a nested numeric value at `path` in each state's dict."""
    total_pop = sum(pop_m.get(s, 0) for s in per_state)
    if total_pop == 0:
        return 0.0
    s = 0.0
    for state, v in per_state.items():
        cur = v
        for p in path:
            cur = cur.get(p) if isinstance(cur, dict) else None
            if cur is None:
                break
        if isinstance(cur, (int, float)):
            s += cur * pop_m.get(state, 0)
    return s / total_pop
