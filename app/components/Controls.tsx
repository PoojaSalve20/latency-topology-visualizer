'use client';
import React from 'react';

type Props = {
  providerFilter: Record<string, boolean>;
  setProviderFilter: (p: Record<string, boolean>) => void;
  showRegions: boolean;
  setShowRegions: (v: boolean) => void;
  showRealtime: boolean;
  setShowRealtime: (v: boolean) => void;
  isMobile?: boolean;
  isDark?: boolean;
  setIsDark?: (v: boolean) => void;
  onExportGlobe?: () => void;
  onExportLatency?: () => void;
};

export default function Controls({
  providerFilter, setProviderFilter, showRegions, setShowRegions, showRealtime, setShowRealtime,
  isMobile = false, isDark = true, setIsDark, onExportGlobe, onExportLatency,
}: Props) {
  const toggleProvider = (provider: string) => setProviderFilter({ ...providerFilter, [provider]: !providerFilter[provider] });

  return (
    <div style={{
      position: 'absolute',
      top: isMobile ? 'auto' : 80,
      bottom: isMobile ? 10 : 'auto',
      right: isMobile ? 10 : 20,
      background: 'rgba(0,0,0,0.8)',
      padding: isMobile ? 8 : 12,
      borderRadius: 8,
      border: '1px solid rgba(0,230,255,0.15)',
      color: '#fff',
      zIndex: 50,
      width: isMobile ? 150 : 200,
      fontSize: isMobile ? '12px' : '14px',
    }}>
      <div style={{ color: '#00e6ff', fontWeight: 700, marginBottom: 8 }}>Controls</div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 13, marginBottom: 6 }}>Cloud Providers</div>
        {['AWS', 'Azure', 'GCP'].map((p) => (
          <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <input type="checkbox" checked={!!providerFilter[p]} onChange={() => toggleProvider(p)} />
            <span style={{ fontSize: 13 }}>{p}</span>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <div>Regions</div>
        <input type="checkbox" checked={showRegions} onChange={(e) => setShowRegions(e.target.checked)} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>Realtime</div>
        <input type="checkbox" checked={showRealtime} onChange={(e) => setShowRealtime(e.target.checked)} />
      </div>

      <div style={{ display: 'flex', gap: 8, flexDirection: 'column', marginTop: 8 }}>
        {typeof setIsDark === 'function' && <button onClick={() => setIsDark(!isDark)}>{isDark ? 'Light theme' : 'Dark theme'}</button>}
        {onExportGlobe && <button onClick={() => onExportGlobe()}>Export Globe PNG</button>}
        {onExportLatency && <button onClick={() => onExportLatency()}>Export Latency JSON</button>}
      </div>
    </div>
  );
}