"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { publicEnv } from "@/lib/env";
import { ReportItem, STATUS_BADGE_MAP } from "@/lib/reportTypes";

const EMPTY_REPORTS: ReportItem[] = [];

interface BogorMapProps {
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
 * Komponen Peta Interaktif Kota Bogor (MapLibre GL JS + OpenStreetMap / OpenFreeMap)
 * Menampilkan marker laporan dengan warna semantik status serta popup detail.
 */
export function BogorMap({
  centerLat = publicEnv.defaultMapLat,
  centerLng = publicEnv.defaultMapLng,
  zoom = publicEnv.defaultMapZoom,
  className = "w-full h-[380px] rounded-xl border border-slate-200 shadow-sm overflow-hidden",
  showHotspotZones = false,
  reports = EMPTY_REPORTS,
  selectedReportId,
  onSelectReport,
  resetViewKey = 0,
  onLocationChange,
}: BogorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const selectionCallbackRef = useRef(onSelectReport);
  selectionCallbackRef.current = onSelectReport;
  const selectedReportRef = useRef(selectedReportId);
  selectedReportRef.current = selectedReportId;
  const locationCallbackRef = useRef(onLocationChange);
  locationCallbackRef.current = onLocationChange;
  const locationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const initialView = useRef({ centerLat, centerLng, zoom });
  const pickingLocation = Boolean(onLocationChange);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: publicEnv.mapStyleUrl,
      center: [initialView.current.centerLng, initialView.current.centerLat],
      zoom: initialView.current.zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    if (pickingLocation) {
      const marker = new maplibregl.Marker({ draggable: true })
        .setLngLat([initialView.current.centerLng, initialView.current.centerLat]).addTo(map);
      locationMarkerRef.current = marker;
      const commit = (point: maplibregl.LngLat) => {
        marker.setLngLat(point);
        locationCallbackRef.current?.(Number(point.lat.toFixed(6)), Number(point.wrap().lng.toFixed(6)));
      };
      map.on("click", (event) => commit(event.lngLat));
      marker.on("dragend", () => commit(marker.getLngLat()));
      const element = marker.getElement();
      element.setAttribute("tabindex", "0");
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", "Lokasi kerusakan. Geser pin atau gunakan tombol panah untuk memindahkan titik.");
      element.addEventListener("keydown", (event) => {
        const directions: Record<string, [number, number]> = { ArrowUp: [0, -10], ArrowDown: [0, 10], ArrowLeft: [-10, 0], ArrowRight: [10, 0] };
        const delta = directions[event.key];
        if (!delta) return;
        event.preventDefault();
        event.stopPropagation();
        const pixel = map.project(marker.getLngLat());
        commit(map.unproject([pixel.x + delta[0], pixel.y + delta[1]]));
      });
      map.getCanvas().style.cursor = "crosshair";
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      locationMarkerRef.current = null;
    };
  }, [showHotspotZones, pickingLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    locationMarkerRef.current?.setLngLat([centerLng, centerLat]);
    if (pickingLocation) {
      if (!map.getBounds().contains([centerLng, centerLat])) map.jumpTo({ center: [centerLng, centerLat] });
    } else if (!onSelectReport) map.jumpTo({ center: [centerLng, centerLat], zoom });
  }, [centerLat, centerLng, zoom, pickingLocation, onSelectReport]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    reports.forEach((rep) => {
      const badge = STATUS_BADGE_MAP[rep.status] || STATUS_BADGE_MAP.TERVERIFIKASI;
      // Text nodes keep report content out of HTML parsing.
      const popupContent = document.createElement("div");
      popupContent.className = "sijago-map-popup";
      const heading = document.createElement("strong");
      heading.textContent = rep.title;
      const location = document.createElement("p");
      location.textContent = `${rep.ticketCode}, ${rep.districtName}`;
      const support = document.createElement("p");
      support.textContent = `${rep.upvotes} dukungan`;
      const link = document.createElement("a");
      link.href = `/laporan/${encodeURIComponent(rep.id)}`;
      link.textContent = "Buka detail laporan";
      popupContent.append(heading, location);
      popupContent.append(support, link);

      const marker = new maplibregl.Marker({ color: badge.dotColor })
        .setLngLat([rep.lng, rep.lat])
        .setPopup(new maplibregl.Popup({ offset: 25, focusAfterOpen: false }).setDOMContent(popupContent))
        .addTo(map);
      const markerElement = marker.getElement();
      markerElement.setAttribute("role", "button");
      markerElement.setAttribute("tabindex", "0");
      markerElement.setAttribute("aria-label", `Lihat lokasi ${rep.ticketCode}: ${rep.title}`);
      markerElement.addEventListener("click", () => selectionCallbackRef.current?.(rep.id));
      markerElement.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          marker.togglePopup();
          selectionCallbackRef.current?.(rep.id);
        }
      });
      markersRef.current.push(marker);
    });
  }, [reports]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !onSelectReport) return;
    const fitReports = () => {
      map.resize();
      const bounds = new maplibregl.LngLatBounds();
      reports.forEach((report) => bounds.extend([report.lng, report.lat]));
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: { top: 100, bottom: 90, left: 55, right: 55 }, maxZoom: 14, duration: 0 });
    };
    markersRef.current.forEach((marker) => marker.getPopup().remove());
    fitReports();
    if (!map.loaded()) map.once("load", fitReports);
    const observer = new ResizeObserver(() => {
      const selected = reports.find((report) => report.id === selectedReportRef.current);
      map.resize();
      if (selected) map.jumpTo({ center: [selected.lng, selected.lat], zoom: 15 });
      else fitReports();
    });
    if (mapContainerRef.current) observer.observe(mapContainerRef.current);
    return () => { observer.disconnect(); map.off("load", fitReports); };
  }, [reports, resetViewKey, onSelectReport]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!selectedReportId) {
      if (onSelectReport) markersRef.current.forEach((marker) => marker.getPopup().remove());
      return;
    }
    const index = reports.findIndex((report) => report.id === selectedReportId);
    if (index === -1) return;
    const report = reports[index];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo({ center: [report.lng, report.lat], zoom: 15, duration: reduceMotion ? 0 : 500 });
    markersRef.current.forEach((marker, markerIndex) => {
      const popup = marker.getPopup();
      if (markerIndex === index && !popup.isOpen()) marker.togglePopup();
      else if (markerIndex !== index && popup.isOpen()) marker.togglePopup();
    });
  }, [selectedReportId, reports, onSelectReport]);

  return <div ref={mapContainerRef} className={className} />;
}
