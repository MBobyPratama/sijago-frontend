"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { publicEnv } from "@/lib/env";

interface BogorMapProps {
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  className?: string;
}

/**
 * Komponen Peta Interaktif Dasar Kota Bogor (MapLibre GL JS + OpenStreetMap / OpenFreeMap)
 * 100% Gratis tanpa API Key (FR-4.1 & OQ-28).
 */
export function BogorMap({
  centerLat = publicEnv.defaultMapLat,
  centerLng = publicEnv.defaultMapLng,
  zoom = publicEnv.defaultMapZoom,
  className = "w-full h-[420px] rounded-xl border border-slate-200 shadow-sm overflow-hidden",
}: BogorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: publicEnv.mapStyleUrl,
      center: [centerLng, centerLat],
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // Marker sampel pusat Kota Bogor (Kebun Raya Bogor)
    new maplibregl.Marker({ color: "#1E40AF" })
      .setLngLat([centerLng, centerLat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          `<strong>Pusat Pemantauan SIJAGO</strong><br/>Kota Bogor, Jawa Barat`
        )
      )
      .addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [centerLat, centerLng, zoom]);

  return <div ref={mapContainerRef} className={className} />;
}
