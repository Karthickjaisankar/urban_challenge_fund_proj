"""Collector Ticker / Flag system.

Collectors (district officers / IAS officers) can raise a ticker when they:
  A. Notice a data discrepancy (reported value ≠ ground reality)
  B. Record an action they've taken in response to a KPI alert
  C. Request validation of a recently corrected figure

Tickets flow:  open → reviewing → validated → closed
                              └→ rejected

In-memory store for prototype. SQLite migration path is one line change.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Literal

IST = timezone(timedelta(hours=5, minutes=30))

TicketType   = Literal["discrepancy", "action_taken", "data_update"]
TicketStatus = Literal["open", "reviewing", "validated", "rejected", "closed"]
TicketRole   = Literal["collector", "state_officer", "central_officer"]

_STORE: list[dict] = []   # in-memory; survives the session, resets on restart


def _now_ist() -> str:
    return datetime.now(IST).strftime("%Y-%m-%dT%H:%M:%S+05:30")


def create_ticket(
    *,
    raised_by: str,                  # name / designation of the filer
    role: TicketRole,
    district: str,
    state: str,
    department: str,
    kpi_code: str,
    kpi_label: str,
    ticket_type: TicketType,
    severity: Literal["low", "medium", "high"],
    current_value: float | None,
    reported_value: float | None,
    unit: str,
    notes: str,
) -> dict:
    ticket = {
        "id": str(uuid.uuid4())[:8].upper(),
        "raised_by":     raised_by,
        "role":          role,
        "district":      district,
        "state":         state,
        "department":    department,
        "kpi_code":      kpi_code,
        "kpi_label":     kpi_label,
        "ticket_type":   ticket_type,
        "severity":      severity,
        "current_value": current_value,
        "reported_value":reported_value,
        "unit":          unit,
        "notes":         notes,
        "status":        "open",
        "created_at":    _now_ist(),
        "updated_at":    _now_ist(),
        "resolution":    None,
        "history": [{"status": "open", "timestamp": _now_ist(), "actor": raised_by}],
    }
    _STORE.append(ticket)
    return ticket


def list_tickets(
    district: str | None = None,
    status: TicketStatus | None = None,
    department: str | None = None,
) -> list[dict]:
    out = list(_STORE)
    if district:
        out = [t for t in out if t["district"] == district]
    if status:
        out = [t for t in out if t["status"] == status]
    if department:
        out = [t for t in out if t["department"] == department]
    return sorted(out, key=lambda t: t["created_at"], reverse=True)


def get_ticket(ticket_id: str) -> dict | None:
    for t in _STORE:
        if t["id"] == ticket_id:
            return t
    return None


def update_status(
    ticket_id: str,
    new_status: TicketStatus,
    actor: str,
    resolution: str | None = None,
) -> dict | None:
    t = get_ticket(ticket_id)
    if not t:
        return None
    t["status"]     = new_status
    t["updated_at"] = _now_ist()
    if resolution:
        t["resolution"] = resolution
    t["history"].append({"status": new_status, "timestamp": _now_ist(), "actor": actor, "note": resolution})
    return t


def ticket_stats() -> dict:
    counts: dict[str, int] = {"open": 0, "reviewing": 0, "validated": 0, "rejected": 0, "closed": 0}
    for t in _STORE:
        counts[t["status"]] = counts.get(t["status"], 0) + 1
    return {"total": len(_STORE), **counts}


def seed_demo_tickets() -> None:
    """Seed a few realistic demo tickets so the inbox isn't empty on first load."""
    if _STORE:
        return  # Already seeded or has real data
    demos = [
        dict(
            raised_by="Collector, Vellore",          role="collector",
            district="Vellore",                       state="Tamil Nadu",
            department="health",
            kpi_code="mmr",                           kpi_label="Maternal Mortality Ratio",
            ticket_type="discrepancy",                severity="high",
            current_value=55.8,                       reported_value=48.0,
            unit="per 100,000 live births",
            notes="Our district hospital recorded 2 fewer maternal deaths this quarter than the state aggregation shows. "
                  "PHC records corrected and submitted to state portal. Requesting value update.",
        ),
        dict(
            raised_by="DM, Thoothukudi",              role="collector",
            district="Thoothukudi",                   state="Tamil Nadu",
            department="disaster",
            kpi_code="art",                           kpi_label="Avg Response Time",
            ticket_type="action_taken",               severity="medium",
            current_value=13.0,                       reported_value=None,
            unit="minutes",
            notes="Pre-positioned NDRF team at Thoothukudi port ahead of Bay of Bengal depression. "
                  "ART will improve significantly this week. EOC activated as of 06:00 today.",
        ),
        dict(
            raised_by="DHS, Coimbatore",              role="state_officer",
            district="Coimbatore",                    state="Tamil Nadu",
            department="health",
            kpi_code="oope",                          kpi_label="Out-of-Pocket Expenditure",
            ticket_type="data_update",                severity="low",
            current_value=30.0,                       reported_value=26.5,
            unit="% of total health exp.",
            notes="NHA 2025-26 district disaggregation published. Coimbatore OOPE revised down to 26.5 "
                  "after PM-JAY card uptake surge Q3. Uploading updated spreadsheet to state portal.",
        ),
    ]
    for d in demos:
        create_ticket(**d)
    # Auto-advance one to 'reviewing'
    if _STORE:
        update_status(_STORE[0]["id"], "reviewing", "State Health Director")
