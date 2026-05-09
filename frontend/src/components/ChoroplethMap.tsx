import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Maximize2, Minimize2, Plus, Minus, RotateCcw } from "lucide-react";
import type { Feature, FeatureCollection } from "geojson";

interface ChoroplethMapProps {
  geojsonUrl: string;
  nameProp: "NAME_1" | "NAME_2";
  values: Record<string, number>;
  direction: "lower_is_better" | "higher_is_better";
  selected?: string | null;
  onSelect?: (name: string) => void;
  highlightRegions?: string[];
  labelMode?: "state" | "district";
  metricBadge?: { label: string; unit: string; value?: number };
  scopeLabel?: string;
}

// India bounding box — tight, so first paint shows India fully without seeing Pakistan/China deep.
const INDIA_BOUNDS: L.LatLngBoundsLiteral = [[6.5, 68.0], [37.0, 97.5]];

function ramp(v: number, min: number, max: number, direction: "lower_is_better" | "higher_is_better"): string {
  if (!Number.isFinite(v)) return "rgba(232, 226, 211, 0.5)";
  const t = max === min ? 0.5 : (v - min) / (max - min);
  const k = direction === "lower_is_better" ? t : 1 - t;
  // 5-stop tricolor-anchored gradient
  const stops: [number, [number, number, number]][] = [
    [0.00, [12, 105, 5]],     // deep emerald (best)
    [0.30, [101, 184, 75]],   // sea green
    [0.55, [255, 167, 38]],   // bright saffron
    [0.80, [232, 90, 53]],    // coral red
    [1.00, [157, 21, 28]],    // deep ruby (worst)
  ];
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (k >= stops[i][0] && k <= stops[i + 1][0]) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const frac = (k - lo[0]) / Math.max(0.0001, (hi[0] - lo[0]));
  const c = [0, 1, 2].map((j) => Math.round(lo[1][j] + (hi[1][j] - lo[1][j]) * frac));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

export function ChoroplethMap({
  geojsonUrl, nameProp, values, direction, selected, onSelect,
  highlightRegions = [], labelMode = "state", metricBadge, scopeLabel,
}: ChoroplethMapProps) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const fcRef = useRef<FeatureCollection | null>(null);
  const initialBoundsRef = useRef<L.LatLngBounds | null>(null);

  // Stable refs for values/selected so the click/style closures see fresh data
  // without the geojson layer being torn down on every tick.
  const valuesRef = useRef(values);
  const selectedRef = useRef(selected);
  const highlightRef = useRef(highlightRegions);
  const directionRef = useRef(direction);
  const onSelectRef = useRef(onSelect);
  valuesRef.current = values;
  selectedRef.current = selected;
  highlightRef.current = highlightRegions;
  directionRef.current = direction;
  onSelectRef.current = onSelect;

  const [fullscreen, setFullscreen] = useState(false);

  // ---- Init map ONCE ----
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const m = L.map(mapEl.current, {
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: false,
      preferCanvas: false,
      maxBounds: [[ -10, 50], [50, 110]],   // soft clamp around the Indian sub-region
      maxBoundsViscosity: 0.7,
      minZoom: 3,
    });
    // Fit to India immediately so first paint never shows "all of Asia".
    m.fitBounds(INDIA_BOUNDS, { padding: [10, 10], animate: false });
    // CARTO Voyager basemap — more colorful and richer than 'light' (subtle terrain
    // hints, better water + land contrast).
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(m);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
      attribution: "",
      subdomains: "abcd",
      maxZoom: 19,
      pane: "shadowPane",
    }).addTo(m);
    mapRef.current = m;
    return () => {
      m.remove();
      mapRef.current = null;
    };
  }, []);

  // ---- Refresh size on fullscreen toggle + ESC handler ----
  useEffect(() => {
    const m = mapRef.current;
    if (m) setTimeout(() => m.invalidateSize(), 80);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && fullscreen) setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // ---- Load GeoJSON when URL changes; build the layer ONCE per dataset ----
  useEffect(() => {
    let cancelled = false;
    const m = mapRef.current;
    if (!m) return;

    // Tear down any previous layer for this map (URL changed)
    if (layerRef.current) {
      m.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    fetch(geojsonUrl).then((r) => r.json()).then((fc: FeatureCollection) => {
      if (cancelled || !mapRef.current) return;
      fcRef.current = fc;

      const styleFor = (feature?: Feature) => {
        const name = feature?.properties?.[nameProp];
        const v = name ? valuesRef.current[name] : NaN;
        const isSelected = name === selectedRef.current;
        const isHighlight = name && highlightRef.current.includes(name);
        const arr = Object.values(valuesRef.current).filter(Number.isFinite);
        const vmin = arr.length ? Math.min(...arr) : 0;
        const vmax = arr.length ? Math.max(...arr) : 1;
        return {
          fillColor: ramp(v, vmin, vmax, directionRef.current),
          // More opaque fills so the colors really pop over Voyager
          fillOpacity: Number.isFinite(v) ? (isSelected ? 0.92 : 0.82) : 0.22,
          weight: isSelected ? 4 : isHighlight ? 2.5 : 1.0,
          color: isSelected ? "#0c4ca3" : isHighlight ? "#7c3aed" : "rgba(15, 23, 42, 0.55)",
          dashArray: isHighlight && !isSelected ? "4 3" : undefined,
        };
      };

      const tinyStates = new Set([
        "Lakshadweep", "Daman and Diu", "Dadra and Nagar Haveli",
        "Andaman and Nicobar", "Chandigarh", "Puducherry",
      ]);

      const geo = L.geoJSON(fc as any, {
        style: styleFor as any,
        onEachFeature: (feature, layer: any) => {
          const name = feature.properties?.[nameProp];
          if (!name) return;
          const skipLabel = labelMode === "state" && tinyStates.has(name);
          if (!skipLabel) {
            const labelClasses = [
              "region-label",
              labelMode === "district" ? "region-label--district" : "",
            ].filter(Boolean).join(" ");
            layer.bindTooltip(name, {
              permanent: true,
              direction: "center",
              className: labelClasses,
              opacity: 1,
            });
          }
          layer.on({
            mouseover: (e: any) => {
              const v = valuesRef.current[name];
              const valTxt = Number.isFinite(v) ? `<span style="color:#0c4ca3;font-weight:700"> · ${v.toFixed(1)}</span>` : "";
              e.target.bindTooltip(`<strong>${name}</strong>${valTxt}`, {
                direction: "top", className: "iccc-tip", opacity: 1, sticky: true, permanent: false,
              }).openTooltip();
            },
            mouseout: (e: any) => {
              if (!skipLabel) {
                e.target.bindTooltip(name, {
                  permanent: true, direction: "center",
                  className: "region-label" + (labelMode === "district" ? " region-label--district" : ""),
                  opacity: 1,
                });
              }
              geo.resetStyle(e.target);
            },
            click: () => onSelectRef.current?.(name),
          });
        },
      }).addTo(mapRef.current!);

      layerRef.current = geo;

      // Set initial bounds for THIS dataset (state-level = India bbox; district-level = state bbox)
      const b = geo.getBounds();
      if (b.isValid()) {
        initialBoundsRef.current = b;
        mapRef.current!.fitBounds(b, { padding: [20, 20], animate: true, duration: 0.5 });
      }
    });

    return () => { cancelled = true; };
  }, [geojsonUrl, nameProp, labelMode]);

  // ---- Restyle ONLY (no rebuild, no fitBounds) when values or selected change ----
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.eachLayer((l: any) => {
      const feature: Feature = l.feature;
      const name = feature?.properties?.[nameProp];
      const v = name ? values[name] : NaN;
      const isSelected = name === selected;
      const isHighlight = name && highlightRegions.includes(name);
      const arr = Object.values(values).filter(Number.isFinite);
      const vmin = arr.length ? Math.min(...arr) : 0;
      const vmax = arr.length ? Math.max(...arr) : 1;
      l.setStyle({
        fillColor: ramp(v, vmin, vmax, direction),
        fillOpacity: Number.isFinite(v) ? (isSelected ? 0.92 : 0.82) : 0.22,
        weight: isSelected ? 4 : isHighlight ? 2.5 : 1.0,
        color: isSelected ? "#0c4ca3" : isHighlight ? "#7c3aed" : "rgba(15, 23, 42, 0.55)",
        dashArray: isHighlight && !isSelected ? "4 3" : undefined,
      });
    });
  }, [values, selected, direction, highlightRegions, nameProp]);

  // ---- Smooth fly-to ONLY when selected changes (and only if user actually selected something) ----
  const lastSelectedRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const m = mapRef.current;
    const layer = layerRef.current;
    if (!m || !layer) return;
    if (lastSelectedRef.current === selected) return;
    lastSelectedRef.current = selected;
    if (!selected) return;
    layer.eachLayer((l: any) => {
      if (l.feature?.properties?.[nameProp] === selected) {
        const b = l.getBounds?.();
        if (b && b.isValid()) {
          m.flyToBounds(b, { padding: [60, 60], duration: 0.7, maxZoom: labelMode === "district" ? 9 : 6 });
        }
      }
    });
  }, [selected, nameProp, labelMode]);

  const onZoom = (delta: number) => mapRef.current?.setZoom((mapRef.current?.getZoom() ?? 4) + delta, { animate: true });
  const onReset = () => {
    const m = mapRef.current;
    if (!m || !initialBoundsRef.current) return;
    m.flyToBounds(initialBoundsRef.current, { padding: [20, 20], duration: 0.6 });
  };

  return (
    <div className={fullscreen ? "fixed inset-0 z-[2000] bg-paper" : "relative w-full h-full"}>
      <div ref={mapEl} className="absolute inset-0 rounded-[14px] overflow-hidden" />

      {scopeLabel && (
        <div className="absolute top-3 left-3 z-[600] bg-cream-50/95 backdrop-blur border border-ink2-200/40 rounded-md px-2.5 py-1.5 shadow-card text-[10px] uppercase tracking-[0.18em] text-ink2-600 font-semibold">
          {scopeLabel}
        </div>
      )}

      {metricBadge && (
        <div className="absolute top-3 right-3 z-[600] flex items-center gap-3 bg-white/95 backdrop-blur border-2 border-ashoka-100 rounded-lg px-3 py-2 shadow-card">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-ashoka-700 font-bold">{metricBadge.label}</div>
            <div className="text-[10px] font-mono text-ink2-400 leading-none mt-0.5">{metricBadge.unit}</div>
          </div>
          {metricBadge.value != null && (
            <div className="display fig text-3xl text-ashoka-500 leading-none" style={{ fontWeight: 900 }}>
              {metricBadge.value.toFixed(1)}
            </div>
          )}
        </div>
      )}

      <div className="absolute top-1/2 -translate-y-1/2 right-3 z-[600] flex flex-col gap-1 bg-cream-50/95 backdrop-blur border border-ink2-200/40 rounded-md p-1 shadow-card">
        <button onClick={() => onZoom(1)} className="p-1.5 rounded hover:bg-cream-100 text-ink2-600 hover:text-ashoka-500 transition" title="Zoom in"><Plus size={14} /></button>
        <button onClick={() => onZoom(-1)} className="p-1.5 rounded hover:bg-cream-100 text-ink2-600 hover:text-ashoka-500 transition" title="Zoom out"><Minus size={14} /></button>
        <button onClick={onReset} className="p-1.5 rounded hover:bg-cream-100 text-ink2-600 hover:text-saffron-700 transition" title="Reset view"><RotateCcw size={13} /></button>
        <button onClick={() => setFullscreen((v) => !v)} className="p-1.5 rounded hover:bg-cream-100 text-ink2-600 hover:text-emerald2-600 transition" title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}>
          {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      <div className="absolute bottom-3 left-3 z-[600] bg-cream-50/95 backdrop-blur border border-ink2-200/40 rounded-md px-2.5 py-1.5 shadow-card flex items-center gap-2 text-[10px] font-mono text-ink2-700">
        <span className="uppercase tracking-wider text-ink2-400 font-semibold">{metricBadge?.label ?? "value"}</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-2 rounded-sm" style={{ background: "#0c6905" }} />Better
          <span className="w-3 h-2 rounded-sm" style={{ background: "#ffa726" }} />
          <span className="w-3 h-2 rounded-sm" style={{ background: "#9d151c" }} />Worse
        </span>
      </div>
    </div>
  );
}
