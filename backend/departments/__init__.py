"""Department registry — each module under this package describes one dept
with the same shape so the API and frontend can iterate them generically."""
from __future__ import annotations

from typing import Callable, Protocol


class DeptModule(Protocol):
    META: dict
    STATE_KPI_BASELINES: dict
    STATE_FUNDING: dict

    def state_snapshot(self, state: str, t: float) -> dict: ...
    def state_history(self, state: str) -> dict: ...
    def national_snapshot(self, t: float) -> dict: ...
    def national_history(self) -> dict: ...
    def state_funding(self, state: str) -> dict: ...
    def all_funding(self) -> dict: ...
    def detect_anomalies(self) -> list[dict]: ...


from . import education, wcd, revenue, disaster, tourism, health  # noqa: E402

REGISTRY: dict[str, "DeptModule"] = {
    "health":    health,
    "education": education,
    "wcd":       wcd,
    "revenue":   revenue,
    "disaster":  disaster,
    "tourism":   tourism,
}


def get(code: str) -> "DeptModule":
    if code not in REGISTRY:
        raise KeyError(f"unknown department: {code}")
    return REGISTRY[code]


def list_meta() -> list[dict]:
    return [m.META for m in REGISTRY.values()]
