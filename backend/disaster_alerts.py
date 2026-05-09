"""Disaster Management alert engine.

Generates realistic simulated alerts for 4 hazard types:
  1. High Rainfall
  2. Heatwave
  3. Cyclone
  4. Landslide

Severity levels follow IMD convention:
  green  — normal / no advisory
  yellow — watch    (be alert, situation developing)
  orange — alert    (prepare to act)
  red    — warning  (act now, life-risk)

Alert level is driven by:
  - District static risk profile (coastal / hilly / drought-prone etc.)
  - Month of year (seasonal pattern anchored to TN/India climate)
  - A deterministic daily drift so refreshing doesn't flicker, but values
    change meaningfully each day.

Forecast: 7-day per-district simulation (temperature + rainfall + conditions).
"""
from __future__ import annotations

import math
import random
from datetime import date, datetime, timedelta, timezone
from typing import Literal

IST = timezone(timedelta(hours=5, minutes=30))
SEED = 42

AlertLevel = Literal["green", "yellow", "orange", "red"]

LEVEL_ORDER = {"green": 0, "yellow": 1, "orange": 2, "red": 3}

# --------------------------------------------------------------------------
# District risk profiles (TN deep-dive).
# Fields:
#   coastal   — exposed to Bay of Bengal cyclones
#   hilly     — elevated terrain → landslide risk
#   flood     — low-lying / river delta → flood/high-rainfall risk
#   drought   — semi-arid / low rainfall normals
# --------------------------------------------------------------------------
TN_DISTRICT_RISK: dict[str, dict[str, bool]] = {
    "Chennai":              {"coastal": True,  "hilly": False, "flood": True,  "drought": False},
    "Kancheepuram":         {"coastal": True,  "hilly": False, "flood": True,  "drought": False},
    "Tiruvallur":           {"coastal": True,  "hilly": False, "flood": True,  "drought": False},
    "Villupuram":           {"coastal": True,  "hilly": False, "flood": True,  "drought": False},
    "Nagapattinam":         {"coastal": True,  "hilly": False, "flood": True,  "drought": False},
    "Thiruvarur":           {"coastal": True,  "hilly": False, "flood": True,  "drought": False},
    "Cuddalore":            {"coastal": True,  "hilly": False, "flood": True,  "drought": False},
    "Thoothukudi":          {"coastal": True,  "hilly": False, "flood": False, "drought": False},
    "Ramanathapuram":       {"coastal": True,  "hilly": False, "flood": False, "drought": True },
    "Kanniyakumari":        {"coastal": True,  "hilly": True,  "flood": True,  "drought": False},
    "Tirunelveli Kattabo":  {"coastal": False, "hilly": False, "flood": True,  "drought": False},
    "Pudukkottai":          {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Nilgiris":             {"coastal": False, "hilly": True,  "flood": False, "drought": False},
    "Coimbatore":           {"coastal": False, "hilly": True,  "flood": False, "drought": False},
    "Erode":                {"coastal": False, "hilly": False, "flood": False, "drought": False},
    "Salem":                {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Namakkal":             {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Dharmapuri":           {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Krishnagiri":          {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Vellore":              {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Tiruvannamalai":       {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Madurai":              {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Theni":                {"coastal": False, "hilly": True,  "flood": False, "drought": False},
    "Virudhunagar":         {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Sivaganga":            {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Dindigul":             {"coastal": False, "hilly": True,  "flood": False, "drought": False},
    "Karur":                {"coastal": False, "hilly": False, "flood": True,  "drought": False},
    "Tiruchirappalli":      {"coastal": False, "hilly": False, "flood": True,  "drought": False},
    "Tiruchchirappalli":    {"coastal": False, "hilly": False, "flood": True,  "drought": False},
    "Thanjavur":            {"coastal": False, "hilly": False, "flood": True,  "drought": False},
    "Perambalur":           {"coastal": False, "hilly": False, "flood": False, "drought": True },
    "Ariyalur":             {"coastal": False, "hilly": False, "flood": False, "drought": True },
}

# Default profile for unlisted districts
_DEFAULT_RISK = {"coastal": False, "hilly": False, "flood": False, "drought": False}

# Seasonal alert likelihood (by calendar month) — 1 = peak, 0 = very low.
# Values represent the probability multiplier for each hazard type.
_SEASONAL: dict[str, list[float]] = {
    #                 J     F     M     A     M     J     J     A     S     O     N     D
    "rainfall":  [0.15, 0.10, 0.10, 0.20, 0.45, 0.55, 0.65, 0.70, 0.60, 0.80, 0.95, 0.70],
    "heatwave":  [0.05, 0.10, 0.45, 0.70, 0.90, 0.80, 0.45, 0.35, 0.20, 0.10, 0.05, 0.05],
    "cyclone":   [0.05, 0.05, 0.05, 0.05, 0.20, 0.15, 0.10, 0.10, 0.20, 0.60, 0.80, 0.50],
    "landslide": [0.05, 0.05, 0.05, 0.10, 0.20, 0.50, 0.70, 0.70, 0.60, 0.55, 0.30, 0.10],
}

_LEVEL_THRESHOLDS = [
    (0.85, "red"),
    (0.65, "orange"),
    (0.35, "yellow"),
    (0.0,  "green"),
]


def _day_seed(district: str, hazard: str) -> int:
    today = date.today()
    # Use abs() to avoid negative signs making the concatenated string unparseable.
    return (SEED * 1_000_003 + abs(hash(district)) * 997 + abs(hash(hazard)) * 101 + today.toordinal()) % (2**31)


def _alert_level(district: str, hazard: str) -> AlertLevel:
    """Return alert level for a district-hazard pair for today."""
    risk = TN_DISTRICT_RISK.get(district, _DEFAULT_RISK)
    month_idx = date.today().month - 1
    seasonal = _SEASONAL[hazard][month_idx]

    # Boosts based on district risk profile
    boosts = {
        "rainfall":  0.25 if risk["coastal"] or risk["flood"] else 0.0,
        "heatwave":  0.20 if risk["drought"] else 0.0,
        "cyclone":   0.45 if risk["coastal"] else -0.30,  # large negative for non-coastal
        "landslide": 0.40 if risk["hilly"] else -0.20,
    }

    rng = random.Random(_day_seed(district, hazard))
    noise = rng.gauss(0, 0.10)
    score = max(0.0, min(1.0, seasonal + boosts.get(hazard, 0) + noise))

    for threshold, level in _LEVEL_THRESHOLDS:
        if score >= threshold:
            return level  # type: ignore
    return "green"


def district_alerts(district: str) -> dict:
    """Return current alert levels for all 4 hazards for a district."""
    hazards = ["rainfall", "heatwave", "cyclone", "landslide"]
    alerts = {h: _alert_level(district, h) for h in hazards}
    # Aggregate severity = worst single hazard
    agg = max(alerts.values(), key=lambda l: LEVEL_ORDER[l])
    return {"district": district, "alerts": alerts, "aggregate": agg}


def all_district_alerts() -> list[dict]:
    """Return aggregated alert for every TN district."""
    districts = list(TN_DISTRICT_RISK.keys())
    out = [district_alerts(d) for d in districts]
    out.sort(key=lambda a: LEVEL_ORDER[a["aggregate"]], reverse=True)
    return out


def district_forecast(district: str) -> list[dict]:
    """7-day daily forecast for a district (temperature + rainfall + condition)."""
    risk = TN_DISTRICT_RISK.get(district, _DEFAULT_RISK)
    month_idx = date.today().month - 1
    rng = random.Random(_day_seed(district, "forecast"))

    # Seasonal base temperature (TN climate — warm year round)
    base_temp_day: list[float] = [
        29, 30, 33, 36, 38, 37, 34, 34, 33, 32, 30, 29,
    ]
    base_temp_night: list[float] = [
        20, 21, 23, 25, 27, 26, 25, 25, 24, 23, 21, 20,
    ]
    # Coastal districts slightly cooler
    cool = -2.0 if risk["coastal"] else 0.0
    hot  = +2.0 if risk["drought"] else 0.0

    # Rainfall tendency (mm/day)
    base_rain: list[float] = [2, 1, 1, 3, 6, 12, 15, 14, 10, 20, 30, 15]

    forecast = []
    today = date.today()
    for i in range(7):
        d = today + timedelta(days=i)
        mi = (d.month - 1)  # month index for that day
        noise = rng.gauss(0, 1.5)
        rain_noise = abs(rng.gauss(0, 5))
        rain = max(0.0, base_rain[mi] + rain_noise)
        temp_d = base_temp_day[mi] + cool + hot + noise
        temp_n = base_temp_night[mi] + cool + hot + noise * 0.6

        if rain > 40:      condition = "Heavy Rain"
        elif rain > 15:    condition = "Rain"
        elif rain > 3:     condition = "Partly Cloudy"
        elif temp_d > 40:  condition = "Heatwave"
        elif temp_d > 37:  condition = "Hot & Sunny"
        else:              condition = "Sunny"

        forecast.append({
            "date": d.strftime("%a %d %b"),
            "day": d.strftime("%a"),
            "condition": condition,
            "temp_day":   round(temp_d, 1),
            "temp_night": round(temp_n, 1),
            "rainfall_mm": round(rain, 1),
        })
    return forecast


def active_red_orange_alerts() -> list[dict]:
    """Return only red/orange alerts across all districts for the alert feed."""
    all_a = all_district_alerts()
    feed: list[dict] = []
    for a in all_a:
        for hazard, level in a["alerts"].items():
            if level in ("red", "orange"):
                feed.append({
                    "district": a["district"],
                    "hazard": hazard,
                    "level": level,
                    "message": _alert_message(a["district"], hazard, level),
                })
    return feed


_HAZARD_MESSAGES = {
    "rainfall": {
        "orange": "Heavy rainfall expected. Pre-position rescue teams and check drainage.",
        "red":    "EXTREME RAINFALL WARNING. Evacuate low-lying areas immediately.",
    },
    "heatwave": {
        "orange": "Heatwave conditions. Restrict outdoor work 12–4 PM. Activate cooling centres.",
        "red":    "SEVERE HEATWAVE. Declare district heat emergency. Open public shelters.",
    },
    "cyclone": {
        "orange": "Cyclone alert. Fishing ban enforced. Coastal communities on standby.",
        "red":    "CYCLONE WARNING. Mandatory evacuation within 10 km of coast.",
    },
    "landslide": {
        "orange": "Landslide watch. Alert hilly villages. Block hazardous routes.",
        "red":    "LANDSLIDE WARNING. Immediate evacuation of vulnerable slopes.",
    },
}


def _alert_message(district: str, hazard: str, level: AlertLevel) -> str:
    msgs = _HAZARD_MESSAGES.get(hazard, {})
    base = msgs.get(level, f"{hazard} {level} advisory in effect.")
    return f"{district}: {base}"


HAZARD_META = {
    "rainfall":  {"label": "High Rainfall",   "icon": "CloudRain",  "color": "#0c4ca3"},
    "heatwave":  {"label": "Heatwave",         "icon": "Thermometer","color": "#b81d24"},
    "cyclone":   {"label": "Cyclone",          "icon": "Wind",       "color": "#7c3aed"},
    "landslide": {"label": "Landslide",        "icon": "Mountain",   "color": "#d68b00"},
}
