"""Simplify and split India geojson files for browser delivery.

Inputs (from data/geo/):
  india_states.geojson    ~ 23 MB raw (state polygons; property NAME_1)
  tn_districts.geojson    ~ 34 MB raw (594 district polygons; properties NAME_1, NAME_2)

Outputs (data/geo/):
  india_states.simplified.geojson  ~ a few hundred KB
  tn_districts.simplified.geojson  ~ ~ TN-only districts, simplified
  gj_districts.simplified.geojson  ~ GJ-only districts, simplified
  states_index.json                 list of state names with capitals/centroid

Run once: python3 scripts/prepare_geo.py
"""
from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import shape, mapping
from shapely.ops import unary_union

GEO = Path(__file__).resolve().parent.parent / "data" / "geo"

DEEP_DIVE = {
    "Tamil Nadu": ["Vellore", "Thoothukudi", "Coimbatore"],
    "Gujarat": ["Ahmadabad", "Surat", "Kachchh"],  # source uses Ahmadabad, Kachchh
}


def simplify_features(in_path: Path, out_path: Path, tolerance: float, name_filter=None):
    raw = json.loads(in_path.read_text())
    out_features = []
    for f in raw["features"]:
        props = f["properties"]
        if name_filter and not name_filter(props):
            continue
        geom = shape(f["geometry"])
        try:
            simp = geom.simplify(tolerance, preserve_topology=True)
        except Exception:
            simp = geom
        if simp.is_empty:
            continue
        out_features.append({
            "type": "Feature",
            "properties": {k: props[k] for k in props if k in {"NAME_1", "NAME_2", "ID_1", "ID_2"}},
            "geometry": mapping(simp),
        })
    out_path.write_text(json.dumps({"type": "FeatureCollection", "features": out_features}))
    return len(out_features), out_path.stat().st_size


def build_states_index(states_path: Path, out_path: Path):
    raw = json.loads(states_path.read_text())
    out = []
    for f in raw["features"]:
        name = f["properties"]["NAME_1"]
        geom = shape(f["geometry"])
        c = geom.centroid
        out.append({
            "name": name,
            "centroid": [round(c.x, 4), round(c.y, 4)],
        })
    out.sort(key=lambda x: x["name"])
    out_path.write_text(json.dumps(out, indent=2))
    return len(out)


def main():
    states_in = GEO / "india_states.geojson"
    states_out = GEO / "india_states.simplified.geojson"
    n, sz = simplify_features(states_in, states_out, tolerance=0.02)
    print(f"states: {n} features, {sz/1024:.1f} KB -> {states_out.name}")

    districts_in = GEO / "tn_districts.geojson"

    tn_out = GEO / "tn_districts.simplified.geojson"
    n, sz = simplify_features(
        districts_in, tn_out, tolerance=0.01,
        name_filter=lambda p: p.get("NAME_1") == "Tamil Nadu",
    )
    print(f"TN districts: {n} features, {sz/1024:.1f} KB -> {tn_out.name}")

    gj_out = GEO / "gj_districts.simplified.geojson"
    n, sz = simplify_features(
        districts_in, gj_out, tolerance=0.01,
        name_filter=lambda p: p.get("NAME_1") == "Gujarat",
    )
    print(f"GJ districts: {n} features, {sz/1024:.1f} KB -> {gj_out.name}")

    idx_out = GEO / "states_index.json"
    n = build_states_index(states_out, idx_out)
    print(f"states index: {n} entries -> {idx_out.name}")


if __name__ == "__main__":
    main()
