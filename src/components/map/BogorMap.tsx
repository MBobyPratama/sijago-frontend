"use client";

import React, { useEffect, useRef, useState } from "react";
import type { ReportItem } from "@/lib/reportTypes";

export interface BogorMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  className?: string;
  showHotspotZones?: boolean;
  reports?: ReportItem[];
  selectedReportId?: string | null;
  onSelectReport?: (id: string) => void;
  resetViewKey?: number;
  onLocationChange?: (lat: number, lng: number) => void;
}

/**
 * Wrapper Peta Interaktif Kota Bogor yang memuat bundle MapLibre GL JS (~800 KB)
 * secara dinamis hanya saat kontainer peta mendekati area pandang (IntersectionObserver)
 * atau saat pengguna berinteraksi dengan laporan/lokasi, tanpa menimbulkan Layout Shift (CLS).
 */
export function BogorMap(props: BogorMapProps) {
  const {
    className = "w-full h-[380px] rounded-xl border border-slate-200 shadow-sm overflow-hidden",
    selectedReportId,
    onLocationChange,
  } = props;
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(Boolean(onLocationChange || selectedReportId));
  const [CanvasComponent, setCanvasComponent] = useState<React.ComponentType<BogorMapProps> | null>(null);

  useEffect(() => {
    if (shouldLoad) return;
    if (selectedReportId || onLocationChange) {
      setShouldLoad(true);
      return;
    }
    const element = placeholderRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "40px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [shouldLoad, selectedReportId, onLocationChange]);

  useEffect(() => {
    if (!shouldLoad || CanvasComponent) return;
    let active = true;
    import("./BogorMapCanvas").then((mod) => {
      if (active) setCanvasComponent(() => mod.default);
    });
    return () => {
      active = false;
    };
  }, [shouldLoad, CanvasComponent]);

  if (!CanvasComponent) {
    return <div ref={placeholderRef} className={className} />;
  }

  return <CanvasComponent {...props} className={className} />;
}
