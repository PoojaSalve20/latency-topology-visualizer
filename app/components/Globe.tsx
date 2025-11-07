'use client';
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { exchanges } from '../data/exchanges';

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function circlePolygon(lat: number, lng: number, radiusKm: number, segments = 48) {
  const coords: { lat: number; lng: number }[] = [];
  const seg = Math.max(3, segments);
  for (let i = 0; i < seg; i++) {
    const theta = (i / seg) * 2 * Math.PI;
    const dy = (radiusKm / 111.32) * Math.cos(theta);
    const dx = (radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))) * Math.sin(theta);
    coords.push({ lat: lat + dy, lng: lng + dx });
  }
  // ensure ring closed
  if (coords.length > 0) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first.lat !== last.lat || first.lng !== last.lng) coords.push({ lat: first.lat, lng: first.lng });
  }
  while (coords.length < 4) coords.push({ ...coords[coords.length - 1] });
  return coords;
}

type Props = {
  id?: string;
  providerFilter?: Record<string, boolean>;
  showRegions?: boolean;
  showRealtime?: boolean;
  highlightedPair?: string | null;
  isMobile?: boolean;
  isDark?: boolean;
};

export default function WorldGlobe({
  id,
  providerFilter = { AWS: true, Azure: true, GCP: true },
  showRegions = true,
  showRealtime = true,
  highlightedPair = null,
  isMobile = false,
  isDark = true,
}: Props) {
  const globeRef = useRef<any>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [arcs, setArcs] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [polygons, setPolygons] = useState<any[]>([]);
  const [heatPolygons, setHeatPolygons] = useState<any[]>([]);

  const providerColors: Record<string, string> = {
    AWS: '#ff9900',
    Azure: '#008ad7',
    GCP: '#4285f4',
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => {
      const width = isMobile ? window.innerWidth - 20 : Math.floor(window.innerWidth / 2);
      const height = isMobile ? Math.min(420, window.innerHeight / 2) : window.innerHeight - 140;
      setSize({ width: Math.max(300, width), height: Math.max(300, height) });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [isMobile]);

  useEffect(() => {
    const basePoints = exchanges.map((e) => ({
      ...e,
      color: providerColors[e.provider] ?? '#fff',
      size: 0.4,
      altitude: 0.02,
    }));
    setPoints(basePoints);

    const regs = exchanges.map((e, i) => ({
      id: `region-${i}`,
      provider: e.provider,
      polygon: circlePolygon(e.lat, e.lng, 150, 64),
      color: providerColors[e.provider] ?? '#ffffff',
      label: `${e.provider} region near ${e.name}`,
    }));
    setPolygons(regs);
  }, []);

  useEffect(() => {
    if (!showRealtime) return;
    let mounted = true;
    const fetchLatency = async () => {
      try {
        const res = await fetch('/api/latency');
        const json = await res.json();
        if (!mounted) return;
        const newArcs: any[] = [];
        const perPointAgg: Record<string, { sum: number; count: number }> = {};
        for (const item of json) {
          const a = exchanges.find((x) => x.name === item.from);
          const b = exchanges.find((x) => x.name === item.to);
          if (!a || !b) continue;
          const latency = item.latency;
          let color = '#00ff00';
          if (latency >= 150) color = '#ff0000';
          else if (latency >= 60) color = '#ffff00';
          const distanceKm = haversineDistanceKm(a.lat, a.lng, b.lat, b.lng);
          newArcs.push({
            startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng,
            color, stroke: Math.min(6, 1 + latency / 60),
            altitude: Math.min(0.6, 0.02 + distanceKm / 20000),
            label: `${a.name} → ${b.name}: ${latency}ms`, latency,
            from: a.name, to: b.name,
            arcDashLength: 0.6, arcDashGap: 0.8,
            arcDashInitialGap: Math.random() * 1.0,
            arcDashAnimateTime: 2000 + Math.round(Math.random() * 2000),
          });
          const sKey = `${a.lat},${a.lng}`; const eKey = `${b.lat},${b.lng}`;
          perPointAgg[sKey] ??= { sum: 0, count: 0 }; perPointAgg[sKey].sum += latency; perPointAgg[sKey].count++;
          perPointAgg[eKey] ??= { sum: 0, count: 0 }; perPointAgg[eKey].sum += latency; perPointAgg[eKey].count++;
        }
        setArcs(newArcs);

        const heat = exchanges.map((e) => {
          const key = `${e.lat},${e.lng}`;
          const agg = perPointAgg[key];
          const avg = agg ? agg.sum / agg.count : 0;
          let color = 'rgba(0,255,0,0.18)';
          if (avg >= 150) color = 'rgba(255,0,0,0.18)';
          else if (avg >= 60) color = 'rgba(255,255,0,0.16)';
          return {
            id: `heat-${e.name}`,
            provider: e.provider,
            polygon: circlePolygon(e.lat, e.lng, 350, 48),
            color, value: avg, label: `${e.name} heat: ${Math.round(avg)}ms`,
          };
        });
        setHeatPolygons(heat);

        setPoints((prev) => prev.map((p) => {
          const key = `${p.lat},${p.lng}`;
          const a = perPointAgg[key]; const avg = a ? a.sum / a.count : 0;
          return { ...p, size: 0.25 + Math.min(1.4, avg / 200), altitude: 0.01 + Math.min(0.25, avg / 400) };
        }));
      } catch (e) { console.error('latency fetch error', e); }
    };
    fetchLatency();
    const iv = setInterval(fetchLatency, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, [showRealtime]);

  const polygonsData = polygons.map((p) => ({
    type: 'Feature', properties: { provider: p.provider, color: p.color, label: p.label },
    geometry: { type: 'Polygon', coordinates: [p.polygon.map((pt: any) => [pt.lng, pt.lat])] },
  }));

  const heatPolygonsData = heatPolygons.map((p) => ({
    type: 'Feature', properties: { provider: p.provider, color: p.color, label: p.label, value: p.value },
    geometry: { type: 'Polygon', coordinates: [p.polygon.map((pt: any) => [pt.lng, pt.lat])] },
  }));

  const visiblePoints = points.filter((p) => providerFilter[p.provider] !== false);
  const visiblePolygons = polygonsData.filter((pg: any) => providerFilter[pg.properties.provider] !== false);
  const visibleHeat = heatPolygonsData.filter((hp: any) => providerFilter[hp.properties.provider] !== false);

  const globeImg = isDark ? '/earth-dark.jpg' : '/earth-light.webp';

  return (
    <div id={id ?? 'globe-container'} style={{ width: size.width, height: size.height }}>
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        globeImageUrl={globeImg}
        backgroundImageUrl=""
        pointsData={visiblePoints}
        pointLat={(d: any) => d.lat}
        pointLng={(d: any) => d.lng}
        pointColor={(d: any) => d.color}
        pointAltitude={(d: any) => d.altitude ?? 0.02}
        pointRadius={(d: any) => d.size}
        pointLabel={(d: any) => `<div style="color:#fff"><strong>${d.name}</strong><br/>${d.provider}<br/>${d.lat.toFixed(3)}, ${d.lng.toFixed(3)}</div>`}
        arcsData={arcs.filter((a) => {
          if (highlightedPair) {
            const p = highlightedPair.split('-').map(s => s.trim());
            return (a.from === p[0] && a.to === p[1]) || (a.from === p[1] && a.to === p[0]);
          }
          return true;
        })}
        arcStartLat={(d: any) => d.startLat}
        arcStartLng={(d: any) => d.startLng}
        arcEndLat={(d: any) => d.endLat}
        arcEndLng={(d: any) => d.endLng}
        arcStroke={(d: any) => d.stroke}
        arcColor={(d: any) => d.color}
        arcAltitude={(d: any) => d.altitude}
        arcLabel={(d: any) => d.label}
        arcDashLength={() => 0.6}
        arcDashGap={() => 0.6}
        arcDashInitialGap={(d: any) => d.arcDashInitialGap ?? 0}
        arcDashAnimateTime={(d: any) => d.arcDashAnimateTime ?? 2000}
        arcsTransitionDuration={1600}
        polygonsData={showRegions ? visiblePolygons.concat(visibleHeat) : visibleHeat}
        polygonCapColor={(d: any) => d.properties.color}
        polygonSideColor={() => 'rgba(0,0,0,0.0)'}
        polygonStrokeColor={() => 'rgba(255,255,255,0.04)'}
        polygonLabel={(d: any) => `<div style="color:#fff">${d.properties.label ?? d.properties.value}</div>`}
        enablePointerInteraction={true}
        showAtmosphere={true}
        animateIn={true}
        onGlobeReady={() => {
          try {
            const controls = globeRef.current.controls();
            controls.enableDamping = true;
            controls.dampingFactor = 0.08;
            controls.rotateSpeed = isMobile ? 0.25 : 0.4;
            controls.panSpeed = 0.5;
            controls.zoomSpeed = isMobile ? 0.9 : 0.8;
            controls.screenSpacePanning = true;
          } catch (e) { /* ignore */ }
        }}
      />
    </div>
  );
}