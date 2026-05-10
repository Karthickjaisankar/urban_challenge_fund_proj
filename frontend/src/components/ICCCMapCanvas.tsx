/**
 * ICCCMapCanvas – full-screen Leaflet map with:
 * - CARTO dark basemap (no-labels + labels layered)
 * - State choropleth by active KPI
 * - Pulsing gold Nodal ICCC markers at state capitals
 * - Pulsing blue Sub-Nodal markers at TN districts (when drilled in)
 * - Floating top-stats strip
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { RotateCcw, Plus, Minus, Maximize2, Minimize2 } from "lucide-react";
import { STATE_CAPITALS } from "@/lib/constants";

const INDIA_BOUNDS: L.LatLngBoundsLiteral = [[6.5, 68.0], [37.0, 97.5]];

const RAMP: [number, [number, number, number]][] = [
  [0.00, [0,  196, 160]],  // teal
  [0.40, [74, 158, 255]],  // blue
  [0.70, [255, 179, 71]],  // amber
  [1.00, [255, 87,  87]],  // red
];

function ramp(v: number, min: number, max: number, dir: "lower_is_better" | "higher_is_better"): string {
  if (!Number.isFinite(v)) return "rgba(255,255,255,0.04)";
  const t = max === min ? 0.5 : (v - min) / (max - min);
  const k = dir === "lower_is_better" ? t : 1 - t;
  let lo = RAMP[0], hi = RAMP[RAMP.length - 1];
  for (let i = 0; i < RAMP.length - 1; i++) {
    if (k >= RAMP[i][0] && k <= RAMP[i + 1][0]) { lo = RAMP[i]; hi = RAMP[i + 1]; break; }
  }
  const frac = (k - lo[0]) / Math.max(0.0001, hi[0] - lo[0]);
  const c = [0,1,2].map(j => Math.round(lo[1][j] + (hi[1][j] - lo[1][j]) * frac));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function makeNodalIcon(size: number, cssClass: string) {
  return L.divIcon({
    html: `<div class="${cssClass}" style="width:${size}px;height:${size}px;border-radius:50%;"></div>`,
    className: "iccc-marker",
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

interface ICCCMapCanvasProps {
  geojsonUrl: string;
  nameProp: "NAME_1" | "NAME_2";
  values: Record<string, number>;
  direction: "lower_is_better" | "higher_is_better";
  selectedState: string | null;
  selectedDistrict: string | null;
  onSelectState: (name: string) => void;
  onSelectDistrict?: (name: string) => void;
  showDistrictMarkers?: boolean;     // show sub-nodal dots on TN districts
  districtCentroids?: Record<string, [number, number]>; // from geojson
  accentColor?: string;
  metricLabel?: string;
}

export function ICCCMapCanvas({
  geojsonUrl, nameProp, values, direction,
  selectedState, selectedDistrict,
  onSelectState, onSelectDistrict,
  showDistrictMarkers = false,
  districtCentroids = {},
  accentColor = "#00D4AA",
  metricLabel = "",
}: ICCCMapCanvasProps) {
  const mapEl  = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const nodalRef = useRef<L.LayerGroup | null>(null);
  const subNodalRef = useRef<L.LayerGroup | null>(null);
  const valuesRef = useRef(values);
  const dirRef    = useRef(direction);
  const onSelRef  = useRef(onSelectState);
  const onDistRef = useRef(onSelectDistrict);
  valuesRef.current = values;
  dirRef.current    = direction;
  onSelRef.current  = onSelectState;
  onDistRef.current = onSelectDistrict;
  const [fullscreen, setFullscreen] = useState(false);

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const m = L.map(mapEl.current, { zoomControl: false, minZoom: 3, maxBoundsViscosity: 0.7 });
    m.fitBounds(INDIA_BOUNDS, { padding: [10,10], animate: false });
    // Dark basemap
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd", maxZoom: 19,
    }).addTo(m);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
      attribution: "", subdomains: "abcd", maxZoom: 19, pane: "shadowPane",
    }).addTo(m);
    mapRef.current = m;
    nodalRef.current = L.layerGroup().addTo(m);
    subNodalRef.current = L.layerGroup().addTo(m);
    return () => { m.remove(); mapRef.current = null; };
  }, []);

  // Fullscreen resize
  useEffect(() => {
    const m = mapRef.current;
    if (m) setTimeout(() => m.invalidateSize(), 80);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && fullscreen) setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  // Load GeoJSON when URL changes
  useEffect(() => {
    let cancelled = false;
    const m = mapRef.current;
    if (!m) return;
    if (layerRef.current) { m.removeLayer(layerRef.current); layerRef.current = null; }
    fetch(geojsonUrl).then(r => r.json()).then((fc: any) => {
      if (cancelled || !mapRef.current) return;
      const styleFor = (feat?: any) => {
        const name = feat?.properties?.[nameProp];
        const v = name ? valuesRef.current[name] : NaN;
        const isSelected = name === (nameProp === "NAME_1" ? selectedState : selectedDistrict);
        const arr = Object.values(valuesRef.current).filter(Number.isFinite) as number[];
        const vmin = arr.length ? Math.min(...arr) : 0;
        const vmax = arr.length ? Math.max(...arr) : 1;
        return {
          fillColor: ramp(v, vmin, vmax, dirRef.current),
          fillOpacity: Number.isFinite(v) ? (isSelected ? 0.92 : 0.72) : 0.08,
          weight: isSelected ? 3 : 0.8,
          color: isSelected ? accentColor : "rgba(255,255,255,0.20)",
        };
      };
      const geo = L.geoJSON(fc, {
        style: styleFor as any,
        onEachFeature: (feat, layer: any) => {
          const name = feat.properties?.[nameProp];
          if (!name) return;
          layer.on({
            mouseover: (e: any) => {
              const v = valuesRef.current[name];
              e.target.bindTooltip(
                `<strong>${name}</strong>${Number.isFinite(v) ? `<span style="color:${accentColor};margin-left:6px;font-weight:700">${v.toFixed(1)}</span>` : ""}`,
                { direction: "top", className: "iccc-map-tip", sticky: true, permanent: false, opacity: 1 },
              ).openTooltip();
            },
            mouseout: (e: any) => { geo.resetStyle(e.target); },
            click: () => {
              if (nameProp === "NAME_1") onSelRef.current(name);
              else onDistRef.current?.(name);
            },
          });
        },
      }).addTo(mapRef.current!);
      layerRef.current = geo;
      const b = geo.getBounds();
      if (b.isValid()) mapRef.current!.fitBounds(b, { padding: [20,20], animate: true, duration: 0.5 });
    });
    return () => { cancelled = true; };
  }, [geojsonUrl, nameProp, accentColor]);

  // Restyle without rebuild when values change
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.eachLayer((l: any) => {
      const name = l.feature?.properties?.[nameProp];
      const v = name ? values[name] : NaN;
      const isSelected = name === (nameProp === "NAME_1" ? selectedState : selectedDistrict);
      const arr = Object.values(values).filter(Number.isFinite) as number[];
      const vmin = arr.length ? Math.min(...arr) : 0;
      const vmax = arr.length ? Math.max(...arr) : 1;
      l.setStyle({
        fillColor: ramp(v, vmin, vmax, direction),
        fillOpacity: Number.isFinite(v) ? (isSelected ? 0.92 : 0.72) : 0.08,
        weight: isSelected ? 3 : 0.8,
        color: isSelected ? accentColor : "rgba(255,255,255,0.20)",
      });
    });
  }, [values, selectedState, selectedDistrict, direction, nameProp, accentColor]);

  // Nodal ICCC markers (state capitals)
  useEffect(() => {
    const grp = nodalRef.current;
    if (!grp) return;
    grp.clearLayers();
    Object.entries(STATE_CAPITALS).forEach(([state, [lat, lng]]) => {
      const marker = L.marker([lat, lng], { icon: makeNodalIcon(16, "iccc-nodal-dot"), zIndexOffset: 200 });
      marker.bindTooltip(`<span style="color:#FFD700">⬡ Nodal ICCC</span><br>${state}`, { className: "iccc-map-tip", direction: "top" });
      marker.on("click", () => { if (onSelRef.current) onSelRef.current(state); });
      grp.addLayer(marker);
    });
  }, []);

  // Sub-nodal markers for TN districts
  useEffect(() => {
    const grp = subNodalRef.current;
    if (!grp) return;
    grp.clearLayers();
    if (!showDistrictMarkers) return;
    Object.entries(districtCentroids).forEach(([district, [lat, lng]]) => {
      const marker = L.marker([lat, lng], { icon: makeNodalIcon(10, "iccc-sub-dot"), zIndexOffset: 100 });
      marker.bindTooltip(`<span style="color:#4A9EFF">◉ Sub-Nodal ICCC</span><br>${district}`, { className: "iccc-map-tip", direction: "top" });
      marker.on("click", () => onDistRef.current?.(district));
      grp.addLayer(marker);
    });
  }, [showDistrictMarkers, districtCentroids]);

  // Fly to selected state
  const lastSelRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const m = mapRef.current;
    const geo = layerRef.current;
    if (!m || !geo || lastSelRef.current === selectedState) return;
    lastSelRef.current = selectedState;
    if (!selectedState) return;
    geo.eachLayer((l: any) => {
      if (l.feature?.properties?.[nameProp] === selectedState) {
        const b = l.getBounds?.();
        if (b && b.isValid()) m.flyToBounds(b, { padding: [60,60], duration: 0.7, maxZoom: nameProp === "NAME_1" ? 6 : 9 });
      }
    });
  }, [selectedState, nameProp]);

  const onZoom = (d: number) => mapRef.current?.setZoom((mapRef.current?.getZoom() ?? 4) + d, { animate: true });
  const onReset = () => mapRef.current?.flyToBounds(INDIA_BOUNDS, { padding: [20,20], duration: 0.6 });

  return (
    <div className={fullscreen ? "fixed inset-0 z-[3000]" : "relative w-full h-full"}>
      <div ref={mapEl} className="absolute inset-0" />

      {/* Floating metric badge */}
      {metricLabel && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[600] px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest text-white"
             style={{ background: `${accentColor}28`, border: `1px solid ${accentColor}50` }}>
          {metricLabel}
        </div>
      )}

      {/* Map controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[600] flex flex-col gap-1 rounded-xl overflow-hidden border border-white/10"
           style={{ background: "rgba(13,24,33,0.9)", backdropFilter: "blur(8px)" }}>
        {[
          { icon: <Plus size={14} />, fn: () => onZoom(1), title: "Zoom in" },
          { icon: <Minus size={14} />, fn: () => onZoom(-1), title: "Zoom out" },
          { icon: <RotateCcw size={13} />, fn: onReset, title: "Reset view" },
          { icon: fullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>, fn: () => setFullscreen(v => !v), title: "Fullscreen" },
        ].map(({ icon, fn, title }, i) => (
          <button key={i} onClick={fn} title={title}
            className="p-2 hover:bg-white/10 text-white/60 hover:text-white transition">{icon}</button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[600] flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono text-white/60"
           style={{ background: "rgba(13,24,33,0.85)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <div className="flex items-center gap-1">
          <span className="w-8 h-2 rounded-full" style={{ background: "linear-gradient(90deg, #00D4AA, #4A9EFF, #FFB347, #FF5757)" }} />
          <span className="ml-1">Better</span>
          <span className="mx-1">→</span>
          <span>Worse</span>
        </div>
      </div>

      {/* ICCC legend */}
      <div className="absolute bottom-4 left-40 z-[600] flex items-center gap-4 px-3 py-2 rounded-lg text-[10px] font-mono"
           style={{ background: "rgba(13,24,33,0.85)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="text-white/60">Nodal ICCC</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#4A9EFF" }} />
          <span className="text-white/60">Sub-Nodal ICCC</span>
        </span>
      </div>
    </div>
  );
}
