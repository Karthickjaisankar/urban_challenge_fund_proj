"""FastAPI app for the UCF / ICCC dashboard prototype.

Endpoints (v0 — Health only):
  GET  /api/meta                                  -> dept dictionary, list of states/districts
  GET  /api/health/national/history               -> 24mo national rollup
  GET  /api/health/state/{state}/history          -> 24mo state series
  GET  /api/health/district/{state}/{district}/history -> 24mo district series
  GET  /api/health/snapshot                       -> all states + national, current tick
  GET  /api/health/district/{state}/snapshot      -> all districts of a state, current tick
  GET  /api/health/stream                         -> SSE: national + per-state ticks every TICK_INTERVAL

Static GeoJSON is served from /geo/* by the frontend's Vite dev server in dev,
and copied into the build for prod. We do not serve it from FastAPI to keep
this app focused on data.
"""
from __future__ import annotations

import asyncio
import json
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import baselines as bl
from . import mock_engine as me
from .data_dictionary import DEPARTMENTS
from . import departments as deptreg
from . import disaster_alerts as da
from . import tickets as tk

# Seed demo tickets once on startup
tk.seed_demo_tickets()

TICK_INTERVAL = 3.0  # seconds

app = FastAPI(title="UCF ICCC API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # open for demo; restrict to your Railway domain before production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/meta")
def meta():
    return {
        "departments": deptreg.list_meta(),
        "states": sorted(bl.HEALTH_STATE_BASELINES.keys()),
        "deep_dive": {
            "Tamil Nadu": ["Vellore", "Coimbatore", "Thoothukudi"],
            "Gujarat": ["Ahmadabad", "Surat", "Kachchh"],
        },
        "tick_interval_sec": TICK_INTERVAL,
    }


# -- Generic per-department endpoints (replaces /api/health/... going forward) -

def _build_dept_snapshot(code: str) -> dict:
    d = deptreg.get(code)
    t = time.time()
    states = sorted(bl.HEALTH_STATE_BASELINES.keys())
    return {
        "t": t,
        "code": code,
        "national": d.national_snapshot(t),
        "states":   {s: d.state_snapshot(s, t) for s in states},
    }


@app.get("/api/dept/{code}/snapshot")
def dept_snapshot(code: str):
    if code not in deptreg.REGISTRY:
        raise HTTPException(404, f"unknown department: {code}")
    return _build_dept_snapshot(code)


@app.get("/api/dept/{code}/history")
def dept_history(code: str):
    if code not in deptreg.REGISTRY:
        raise HTTPException(404, f"unknown department: {code}")
    return deptreg.get(code).national_history()


@app.get("/api/dept/{code}/state/{state}/history")
def dept_state_history(code: str, state: str):
    if code not in deptreg.REGISTRY:
        raise HTTPException(404, f"unknown department: {code}")
    if state not in bl.HEALTH_STATE_BASELINES:
        raise HTTPException(404, f"unknown state: {state}")
    return deptreg.get(code).state_history(state)


@app.get("/api/dept/{code}/funding")
def dept_funding(code: str):
    if code not in deptreg.REGISTRY:
        raise HTTPException(404, f"unknown department: {code}")
    d = deptreg.get(code)
    per_state = d.all_funding()
    national = {
        "central":          sum(v["central"]          for v in per_state.values()),
        "central_released": sum(v["central_released"] for v in per_state.values()),
        "state":            sum(v["state"]            for v in per_state.values()),
        "state_released":   sum(v["state_released"]   for v in per_state.values()),
    }
    national["total_allocated"] = national["central"] + national["state"]
    national["total_released"]  = national["central_released"] + national["state_released"]
    national["central_release_pct"] = round(national["central_released"] / max(1, national["central"]) * 100, 1)
    national["state_release_pct"]   = round(national["state_released"]   / max(1, national["state"])   * 100, 1)
    return {"per_state": per_state, "national": national}


@app.get("/api/dept/{code}/anomalies")
def dept_anomalies(code: str):
    if code not in deptreg.REGISTRY:
        raise HTTPException(404, f"unknown department: {code}")
    return {"events": deptreg.get(code).detect_anomalies()}


async def _dept_tick_stream(code: str):
    while True:
        snap = _build_dept_snapshot(code)
        yield f"data: {json.dumps(snap)}\n\n"
        await asyncio.sleep(TICK_INTERVAL)


@app.get("/api/dept/{code}/stream")
async def dept_stream(code: str):
    if code not in deptreg.REGISTRY:
        raise HTTPException(404, f"unknown department: {code}")
    return StreamingResponse(_dept_tick_stream(code), media_type="text/event-stream")


# -- Health: history ---------------------------------------------------------

@app.get("/api/health/national/history")
def national_history():
    states = sorted(bl.HEALTH_STATE_BASELINES.keys())
    per_state = {s: me.health_state_history(s) for s in states}
    months = next(iter(per_state.values()))["months"]
    pop = {s: bl.state_population_m(s) for s in states}
    total_pop = sum(pop.values())
    imr = []
    mmr = []
    oope = []
    for i in range(len(months)):
        imr.append(round(sum(per_state[s]["series"]["imr"][i] * pop[s] for s in states) / total_pop, 1))
        mmr.append(round(sum(per_state[s]["series"]["mmr"][i] * pop[s] for s in states) / total_pop, 1))
        oope.append(round(sum(per_state[s]["series"]["oope"][i] * pop[s] for s in states) / total_pop, 1))
    return {"months": months, "series": {"imr": imr, "mmr": mmr, "oope": oope}}


@app.get("/api/health/state/{state}/history")
def state_history(state: str):
    if state not in bl.HEALTH_STATE_BASELINES:
        raise HTTPException(404, f"unknown state: {state}")
    return me.health_state_history(state)


@app.get("/api/health/district/{state}/{district}/history")
def district_history(state: str, district: str):
    if state not in bl.HEALTH_STATE_BASELINES:
        raise HTTPException(404, f"unknown state: {state}")
    return me.health_district_history(district, state)


# -- Health: snapshot --------------------------------------------------------

def _build_snapshot() -> dict:
    t = time.time()
    states = sorted(bl.HEALTH_STATE_BASELINES.keys())
    per_state = {s: me.health_state_snapshot(s, t).to_dict() for s in states}
    return {
        "t": t,
        "national": me.health_national_snapshot(t),
        "states": per_state,
    }


@app.get("/api/health/snapshot")
def health_snapshot():
    return _build_snapshot()


@app.get("/api/health/district/{state}/snapshot")
def health_district_snapshot(state: str):
    if state not in bl.HEALTH_STATE_BASELINES:
        raise HTTPException(404, f"unknown state: {state}")
    t = time.time()
    # For TN/GJ deep-dives we have actual district geojson; we generate snapshots
    # for any district name passed in by the frontend (it knows them from the geojson).
    # Here we return a static map for the known TN seeds; the frontend supplements
    # by calling district endpoints individually if needed.
    if state == "Tamil Nadu":
        names = list(bl.HEALTH_DISTRICT_BASELINES.keys())
        # filter to TN's actual list (the seed dict only contains TN entries)
        return {
            "t": t,
            "districts": {n: me.health_district_snapshot(n, state, t).to_dict() for n in names},
        }
    return {"t": t, "districts": {}}


# -- SSE stream --------------------------------------------------------------

async def _tick_stream():
    while True:
        snap = _build_snapshot()
        yield f"data: {json.dumps(snap)}\n\n"
        await asyncio.sleep(TICK_INTERVAL)


@app.get("/api/health/stream")
async def health_stream():
    return StreamingResponse(_tick_stream(), media_type="text/event-stream")


@app.get("/api/health/funding")
def health_funding():
    """Return Central + State Health Dept funding (₹Cr, FY26-27) per state."""
    out = {s: bl.state_health_funding(s) for s in sorted(bl.HEALTH_STATE_BASELINES.keys())}
    total = {
        "central": sum(v["central"] for v in out.values()),
        "central_released": sum(v["central_released"] for v in out.values()),
        "state": sum(v["state"] for v in out.values()),
        "state_released": sum(v["state_released"] for v in out.values()),
    }
    total["total_allocated"] = total["central"] + total["state"]
    total["total_released"] = total["central_released"] + total["state_released"]
    return {"per_state": out, "national": total}


@app.get("/api/health/state/{state}/funding")
def health_state_funding(state: str):
    if state not in bl.HEALTH_STATE_BASELINES:
        raise HTTPException(404, f"unknown state: {state}")
    return bl.state_health_funding(state)


@app.get("/api/health/ranking/{metric}")
def health_ranking(metric: str):
    if metric not in {"imr", "mmr", "oope"}:
        raise HTTPException(400, f"unknown metric: {metric}")
    return {"metric": metric, "rows": me.rank_states_by_kpi(metric, time.time())}


@app.get("/api/health/state/{state}/ranking/{metric}")
def health_state_ranking(state: str, metric: str):
    if metric not in {"imr", "mmr", "oope"}:
        raise HTTPException(400, f"unknown metric: {metric}")
    return {"metric": metric, "state": state, "rows": me.rank_districts_by_kpi(state, metric, time.time())}


@app.get("/api/health/anomalies")
def health_anomalies():
    states = sorted(bl.HEALTH_STATE_BASELINES.keys())
    return {"events": me.detect_state_anomalies(states)}


# -- Disaster alerts -----------------------------------------------------------

@app.get("/api/alerts/all")
def alerts_all():
    return {"alerts": da.all_district_alerts(), "meta": da.HAZARD_META}


@app.get("/api/alerts/active")
def alerts_active():
    return {"events": da.active_red_orange_alerts()}


@app.get("/api/alerts/district/{district}")
def alerts_district(district: str):
    return {
        "district": district,
        "alerts":   da.district_alerts(district),
        "forecast": da.district_forecast(district),
        "meta":     da.HAZARD_META,
    }


# -- Collector Ticker system ---------------------------------------------------

@app.post("/api/tickets")
def create_ticket(body: dict):
    required = ["raised_by", "role", "district", "state", "department",
                 "kpi_code", "kpi_label", "ticket_type", "severity",
                 "unit", "notes"]
    for f in required:
        if f not in body:
            raise HTTPException(422, f"missing field: {f}")
    ticket = tk.create_ticket(
        raised_by=body["raised_by"], role=body["role"],
        district=body["district"],  state=body["state"],
        department=body["department"],
        kpi_code=body["kpi_code"],  kpi_label=body["kpi_label"],
        ticket_type=body["ticket_type"], severity=body["severity"],
        current_value=body.get("current_value"),
        reported_value=body.get("reported_value"),
        unit=body["unit"],          notes=body["notes"],
    )
    return ticket


@app.get("/api/tickets")
def list_tickets(
    district: Optional[str] = None,
    status: Optional[str] = None,
    department: Optional[str] = None,
):
    return {"tickets": tk.list_tickets(district=district, status=status, department=department)}


@app.get("/api/tickets/stats")
def ticket_stats():
    return tk.ticket_stats()


@app.get("/api/tickets/{ticket_id}")
def get_ticket(ticket_id: str):
    t = tk.get_ticket(ticket_id)
    if not t:
        raise HTTPException(404, f"ticket {ticket_id} not found")
    return t


@app.patch("/api/tickets/{ticket_id}")
def update_ticket(ticket_id: str, body: dict):
    new_status = body.get("status")
    if not new_status:
        raise HTTPException(422, "missing: status")
    t = tk.update_status(ticket_id, new_status, body.get("actor", "System"), body.get("resolution"))
    if not t:
        raise HTTPException(404, f"ticket {ticket_id} not found")
    return t


@app.get("/")
def root():
    return {"ok": True, "service": "UCF Performance & Allocation API", "endpoints": [
        "/api/meta",
        "/api/health/national/history",
        "/api/health/state/{state}/history",
        "/api/health/district/{state}/{district}/history",
        "/api/health/snapshot",
        "/api/health/district/{state}/snapshot",
        "/api/health/funding",
        "/api/health/state/{state}/funding",
        "/api/health/ranking/{metric}",
        "/api/health/state/{state}/ranking/{metric}",
        "/api/health/anomalies",
        "/api/health/stream  (SSE)",
    ]}


# ── Static file serving (production) ─────────────────────────────────────────
# When deployed to Railway the pre-built frontend/dist is included in the repo.
# API routes defined above take priority; this catch-all handles SPA routing.
_DIST = Path(__file__).parent.parent / "frontend" / "dist"

if _DIST.exists():
    # Serve GeoJSON and bundled assets from subpaths so they don't conflict with /api/
    app.mount("/geo",    StaticFiles(directory=str(_DIST / "geo")),    name="geo-static")
    app.mount("/assets", StaticFiles(directory=str(_DIST / "assets")), name="assets-static")

    @app.get("/{full_path:path}")
    async def _spa_fallback(full_path: str):
        """Return index.html for all non-API routes so React Router works."""
        return FileResponse(str(_DIST / "index.html"))
