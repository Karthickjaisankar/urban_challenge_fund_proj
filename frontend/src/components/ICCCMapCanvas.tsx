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

// Score-based ramp: 0 = red (needs help), 50 = amber, 100 = teal (excellent)
const SCORE_RAMP: [number, [number, number, number]][] = [
  [0,   [185, 28,  36]],   // red
  [35,  [234, 89,  53]],   // orange-red
  [50,  [217, 119, 6 ]],   // amber
  [65,  [101, 184, 75]],   // sea-green
  [100, [15,  118, 110]],  // teal
];

function scoreToColor(score: number): string {
  const ramp = SCORE_RAMP;
  let lo = ramp[0], hi = ramp[ramp.length - 1];
  for (let i = 0; i < ramp.length - 1; i++) {
    if (score >= ramp[i][0] && score <= ramp[i + 1][0]) { lo = ramp[i]; hi = ramp[i + 1]; break; }
  }
  const frac = (score - lo[0]) / Math.max(0.0001, hi[0] - lo[0]);
  const c = [0,1,2].map(j => Math.round(lo[1][j] + (hi[1][j] - lo[1][j]) * frac));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function regionStyle(
  name: string,
  isSelected: boolean,
  isHover: boolean,
  accentColor: string,
  scores?: Record<string, number>,
): { fill: string; fillOpacity: number; weight: number; color: string } {
  const hasScore = scores && name && Number.isFinite(scores[name]);
  const fillBase = hasScore ? scoreToColor(scores![name]!) : "#CBD5E0";

  if (isSelected) return { fill: hasScore ? scoreToColor(scores![name]!) : accentColor, fillOpacity: 0.80, weight: 3.0, color: accentColor };
  if (isHover)    return { fill: fillBase, fillOpacity: hasScore ? 0.80 : 0.35, weight: 1.5, color: "#64748B" };
  return               { fill: fillBase,  fillOpacity: hasScore ? 0.65 : 0.22, weight: 0.8, color: "#94A3B8" };
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
  selectedState: string | null;
  selectedDistrict: string | null;
  onSelectState: (name: string) => void;
  onSelectDistrict?: (name: string) => void;
  showDistrictMarkers?: boolean;
  accentColor?: string;
  /** Composite dept scores (0–100) per region — drives choropleth colouring */
  scores?: Record<string, number>;
}

export function ICCCMapCanvas({
  geojsonUrl, nameProp,
  selectedState, selectedDistrict,
  onSelectState, onSelectDistrict,
  showDistrictMarkers = false,
  accentColor = "#3B82F6",
  scores,
}: ICCCMapCanvasProps) {
  // Keep a stable ref so the GeoJSON style closures always see the latest scores
  const scoresRef = useRef(scores);
  scoresRef.current = scores;
  const mapEl  = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const nodalRef    = useRef<L.LayerGroup | null>(null);
  const subNodalRef = useRef<L.LayerGroup | null>(null);
  const linesRef    = useRef<L.LayerGroup | null>(null);
  // district centroids computed from geojson bounding-box centres
  const centroidsRef = useRef<Record<string, [number, number]>>({});
  const onSelRef  = useRef(onSelectState);
  const onDistRef = useRef(onSelectDistrict);
  onSelRef.current  = onSelectState;
  onDistRef.current = onSelectDistrict;
  const [fullscreen, setFullscreen] = useState(false);

  // Init map once
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const m = L.map(mapEl.current, { zoomControl: false, minZoom: 3, maxBoundsViscosity: 0.7 });
    m.fitBounds(INDIA_BOUNDS, { padding: [10,10], animate: false });
    // CARTO Light basemap
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO", subdomains: "abcd", maxZoom: 19,
    }).addTo(m);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png", {
      attribution: "", subdomains: "abcd", maxZoom: 19, pane: "shadowPane",
    }).addTo(m);
    mapRef.current = m;
    nodalRef.current    = L.layerGroup().addTo(m);
    linesRef.current    = L.layerGroup().addTo(m);
    subNodalRef.current = L.layerGroup().addTo(m); // on top of lines
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
        const isSelected = name === (nameProp === "NAME_1" ? selectedState : selectedDistrict);
        const s = regionStyle(name, isSelected, false, accentColor, scoresRef.current);
        return { fillColor: s.fill, fillOpacity: s.fillOpacity, weight: s.weight, color: s.color };
      };
      const geo = L.geoJSON(fc, {
        style: styleFor as any,
        onEachFeature: (feat, layer: any) => {
          const name = feat.properties?.[nameProp];
          if (!name) return;
          layer.on({
            mouseover: (e: any) => {
              const isSelected = name === (nameProp === "NAME_1" ? selectedState : selectedDistrict);
              const h = regionStyle(name, isSelected, true, accentColor, scoresRef.current);
              e.target.setStyle({ fillColor: h.fill, fillOpacity: h.fillOpacity, weight: h.weight, color: h.color });
              const sc = scoresRef.current?.[name];
              const scoreTag = Number.isFinite(sc) && sc != null
                ? `<span style="margin-left:6px;font-weight:700;color:${scoreToColor(sc)}">${sc}/100</span>`
                : "";
              e.target.bindTooltip(
                `<strong>${name}</strong>${scoreTag}`,
                { direction: "top", className: "iccc-map-tip", sticky: true, permanent: false, opacity: 1 },
              ).openTooltip();
            },
            mouseout: (e: any) => {
              const isSelected = name === (nameProp === "NAME_1" ? selectedState : selectedDistrict);
              const s = regionStyle(name, isSelected, false, accentColor, scoresRef.current);
              e.target.setStyle({ fillColor: s.fill, fillOpacity: s.fillOpacity, weight: s.weight, color: s.color });
            },
            click: () => {
              if (nameProp === "NAME_1") onSelRef.current(name);
              else onDistRef.current?.(name);
            },
          });
        },
      }).addTo(mapRef.current!);
      layerRef.current = geo;

      // Extract approximate centroids from each feature's bounding box
      const centroids: Record<string, [number, number]> = {};
      geo.eachLayer((l: any) => {
        const name = l.feature?.properties?.[nameProp];
        const b = l.getBounds?.();
        if (name && b && b.isValid()) {
          const c = b.getCenter();
          centroids[name] = [c.lat, c.lng];
        }
      });
      centroidsRef.current = centroids;

      const b = geo.getBounds();
      if (b.isValid()) mapRef.current!.fitBounds(b, { padding: [20,20], animate: true, duration: 0.5 });

      // Re-draw sub-nodal markers + lines now that centroids are fresh
      drawSubNodal();
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojsonUrl, nameProp, accentColor]);

  // Restyle when selection or scores change
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.eachLayer((l: any) => {
      const name = l.feature?.properties?.[nameProp];
      const isSelected = name === (nameProp === "NAME_1" ? selectedState : selectedDistrict);
      const s = regionStyle(name, isSelected, false, accentColor, scores);
      l.setStyle({ fillColor: s.fill, fillOpacity: s.fillOpacity, weight: s.weight, color: s.color });
    });
  }, [selectedState, selectedDistrict, nameProp, accentColor, scores]);

  // Nodal ICCC markers (state capitals)
  useEffect(() => {
    const grp = nodalRef.current;
    if (!grp) return;
    grp.clearLayers();
    Object.entries(STATE_CAPITALS).forEach(([state, [lat, lng]]) => {
      const marker = L.marker([lat, lng], { icon: makeNodalIcon(16, "iccc-nodal-dot"), zIndexOffset: 200 });
      marker.bindTooltip(`<span style="color:#EF4444;font-weight:700">⬡ Nodal ICCC</span><br>${state}`, { className: "iccc-map-tip", direction: "top" });
      marker.on("click", () => { if (onSelRef.current) onSelRef.current(state); });
      grp.addLayer(marker);
    });
  }, []);

  // Sub-nodal markers + dotted connection lines from Nodal ICCC to each district
  // Runs whenever showDistrictMarkers changes, or after centroids are computed (geojson reload)
  const drawSubNodal = () => {
    const markerGrp = subNodalRef.current;
    const lineGrp   = linesRef.current;
    if (!markerGrp || !lineGrp) return;
    markerGrp.clearLayers();
    lineGrp.clearLayers();
    if (!showDistrictMarkers) return;

    // Use centroidsRef (computed after GeoJSON loads) as the authoritative source
    const centroids = centroidsRef.current;
    if (!Object.keys(centroids).length) return;

    // Nodal (state capital) coordinates
    const nodalCoord = selectedState ? STATE_CAPITALS[selectedState] : null;

    Object.entries(centroids).forEach(([district, [lat, lng]]) => {
      // Sub-Nodal marker
      const marker = L.marker([lat, lng], { icon: makeNodalIcon(10, "iccc-sub-dot"), zIndexOffset: 100 });
      marker.bindTooltip(
        `<span style="color:#4A9EFF">◉ Sub-Nodal ICCC</span><br><strong>${district}</strong>`,
        { className: "iccc-map-tip", direction: "top" },
      );
      marker.on("click", () => onDistRef.current?.(district));
      markerGrp.addLayer(marker);

      // Dotted line from Nodal → Sub-Nodal
      if (nodalCoord) {
        const line = L.polyline([nodalCoord, [lat, lng]], {
          color: "rgba(239,68,68,0.50)",
          weight: 1.5,
          dashArray: "4 6",
          lineCap: "round",
          lineJoin: "round",
        });
        lineGrp.addLayer(line);
      }
    });
  };

  useEffect(() => {
    // Redraw after a small delay to let centroidsRef populate from the GeoJSON load
    const id = setTimeout(drawSubNodal, 120);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDistrictMarkers, selectedState]);

  // Fly to selected state (on state map) or selected district (on district map)
  const lastStateRef    = useRef<string | null | undefined>(undefined);
  const lastDistrictRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const m   = mapRef.current;
    const geo = layerRef.current;
    if (!m || !geo) return;

    // Fly to state (India view → state clicked)
    if (nameProp === "NAME_1" && lastStateRef.current !== selectedState) {
      lastStateRef.current = selectedState;
      if (!selectedState) return;
      geo.eachLayer((l: any) => {
        if (l.feature?.properties?.NAME_1 === selectedState) {
          const b = l.getBounds?.();
          if (b && b.isValid()) m.flyToBounds(b, { padding: [60, 60], duration: 0.7, maxZoom: 6 });
        }
      });
    }

    // Fly to district (state view → district clicked) — tighter zoom
    if (nameProp === "NAME_2" && lastDistrictRef.current !== selectedDistrict) {
      lastDistrictRef.current = selectedDistrict;
      if (!selectedDistrict) return;
      geo.eachLayer((l: any) => {
        if (l.feature?.properties?.NAME_2 === selectedDistrict) {
          const b = l.getBounds?.();
          if (b && b.isValid()) m.flyToBounds(b, { padding: [80, 80], duration: 0.75, maxZoom: 11 });
        }
      });
    }
  }, [selectedState, selectedDistrict, nameProp]);

  const onZoom = (d: number) => mapRef.current?.setZoom((mapRef.current?.getZoom() ?? 4) + d, { animate: true });
  const onReset = () => mapRef.current?.flyToBounds(INDIA_BOUNDS, { padding: [20,20], duration: 0.6 });

  return (
    <div className={fullscreen ? "fixed inset-0 z-[3000]" : "relative w-full h-full"}>
      <div ref={mapEl} className="absolute inset-0" />


      {/* Map controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[600] flex flex-col gap-0.5 rounded-xl overflow-hidden map-controls">
        {[
          { icon: <Plus size={14} />, fn: () => onZoom(1), title: "Zoom in" },
          { icon: <Minus size={14} />, fn: () => onZoom(-1), title: "Zoom out" },
          { icon: <RotateCcw size={13} />, fn: onReset, title: "Reset view" },
          { icon: fullscreen ? <Minimize2 size={13}/> : <Maximize2 size={13}/>, fn: () => setFullscreen(v => !v), title: "Fullscreen" },
        ].map(({ icon, fn, title }, i) => (
          <button key={i} onClick={fn} title={title}
            className="p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition">{icon}</button>
        ))}
      </div>

      {/* Score legend — shown only when a dept filter is active */}
      {scores && Object.keys(scores).length > 0 && (
        <div className="absolute bottom-4 left-4 z-[600] flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] map-controls">
          <span className="text-slate-500 font-semibold uppercase tracking-wider mr-1">Score</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ background: scoreToColor(0)   }} />
            <span className="text-slate-500">0</span>
          </span>
          <span className="w-16 h-2 rounded-full" style={{ background: "linear-gradient(90deg, rgb(185,28,36), rgb(217,119,6), rgb(15,118,110))" }} />
          <span className="flex items-center gap-1">
            <span className="text-slate-500">100</span>
            <span className="w-3 h-3 rounded-sm" style={{ background: scoreToColor(100) }} />
          </span>
        </div>
      )}

      {/* ICCC legend */}
      <div className={`absolute z-[600] flex items-center gap-4 px-3 py-2 rounded-lg text-[10px] font-mono map-controls ${scores && Object.keys(scores).length > 0 ? "bottom-4 left-56" : "bottom-4 left-4"}`}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: "#EF4444", border: "2px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          <span className="text-slate-600">Nodal ICCC</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: "#F87171", border: "1.5px solid white", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
          <span className="text-slate-600">Sub-Nodal ICCC</span>
        </span>
      </div>
    </div>
  );
}
