/**
 * TourismLandmarkOverlay — floating image card shown on the map when
 * the Tourism tab is active and a district is selected.
 */
import { useState } from "react";
import { X, MapPin, Camera } from "lucide-react";
import type { Landmark } from "@/lib/tourismLandmarks";

interface Props {
  landmark: Landmark;
  districtName: string;
  isMobile?: boolean;
  onClose: () => void;
}

export function TourismLandmarkOverlay({ landmark, districtName, isMobile, onClose }: Props) {
  const [imgError, setImgError] = useState(false);

  const positionClass = isMobile
    ? "fixed bottom-[76px] left-2 z-[800] w-60 rounded-2xl overflow-hidden shadow-2xl"
    : "absolute top-16 left-4 z-[800] w-72 rounded-2xl overflow-hidden shadow-2xl";

  return (
    <div
      className={positionClass}
      style={{ animation: "fadeUp 280ms ease-out" }}
    >
      {/* Image */}
      <div className={`relative ${isMobile ? "h-36" : "h-44"} bg-slate-100 overflow-hidden`}>
        {!imgError ? (
          <img
            src={landmark.imageUrl}
            alt={landmark.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-100">
            <Camera size={40} className="text-slate-300" />
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Type badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/20 backdrop-blur text-white border border-white/30">
            {landmark.type}
          </span>
        </div>
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white hover:bg-black/50 transition">
          <X size={14} />
        </button>
        {/* District name over image bottom */}
        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
          <MapPin size={12} className="text-white/80" />
          <span className="text-[11px] text-white font-semibold">{districtName}</span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white px-4 py-3">
        <div className="text-[15px] font-black text-slate-900 leading-tight mb-1">
          {landmark.name}
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {landmark.description}
        </p>
      </div>
    </div>
  );
}

