"use client"
import { useState, useEffect } from 'react';
import WorldGlobe from './components/Globe';
import LatencyChart from './components/LatencyChart';
import Legend from './components/Legend';
import Controls from './components/Controls';

export default function Home() {
  const [providerFilter, setProviderFilter] = useState<Record<string, boolean>>({ AWS: true, Azure: true, GCP: true });
  const [showRegions, setShowRegions] = useState(true);
  const [showRealtime, setShowRealtime] = useState(true);
  const [selectedPair, setSelectedPair] = useState<string>('Binance-OKX');
  const [selectedRange, setSelectedRange] = useState<string>('1h');
  const [isMobile, setIsMobile] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') document.body.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const exportGlobeImage = () => {
    try {
      const container = document.getElementById('globe-container');
      const canvas = container?.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) return alert('Globe canvas not found');
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `globe-snapshot-${Date.now()}.png`;
      a.click();
    } catch (e) { console.error(e); }
  };

  const exportLatencyJSON = async () => {
    try {
      const res = await fetch('/api/latency');
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `latency-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
  };

  return (
    <main style={{
      textAlign: 'center',
      background: '#0b0f1a',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <header style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#01020f',
        color: '#00e6ff',
        fontWeight: 'bold',
        letterSpacing: 0.5,
      }}>
        🌐 Latency Topology Visualizer
      </header>

      <div style={{
        display: 'flex',
        flex: 1,
        flexDirection: isMobile ? 'column' : 'row',
        backgroundColor: '#000010',
        overflow: 'auto',
      }}>
        <div style={{
          flex: isMobile ? 'none' : 1,
          height: isMobile ? '50vh' : 'auto',
          padding: isMobile ? '10px' : '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <WorldGlobe
            id="globe-container"
            providerFilter={providerFilter}
            showRegions={showRegions}
            showRealtime={showRealtime}
            highlightedPair={selectedPair}
            isMobile={isMobile}
            isDark={isDark}
          />
          <Legend isMobile={isMobile} />
          <Controls
            providerFilter={providerFilter}
            setProviderFilter={setProviderFilter}
            showRegions={showRegions}
            setShowRegions={setShowRegions}
            showRealtime={showRealtime}
            setShowRealtime={setShowRealtime}
            isMobile={isMobile}
            isDark={isDark}
            setIsDark={setIsDark}
            onExportGlobe={exportGlobeImage}
            onExportLatency={exportLatencyJSON}
          />
        </div>

        <div style={{
          flex: isMobile ? 'none' : 1,
          height: isMobile ? '50vh' : 'auto',
          padding: isMobile ? '10px' : '20px',
          backgroundColor: isMobile ? '#000012' : '#050510',
          borderLeft: isMobile ? 'none' : '1px solid #00e6ff',
          borderTop: isMobile ? '1px solid #00e6ff' : 'none',
          boxShadow: isMobile ? '0 -2px 20px rgba(0,230,255,0.12)' : '-2px 0 20px rgba(0,230,255,0.12)',
        }}>
          <LatencyChart
            pair={selectedPair}
            range={selectedRange}
            onPairChange={(p) => setSelectedPair(p)}
            onRangeChange={(r) => setSelectedRange(r)}
            isMobile={isMobile}
            isDark={isDark}
          />
        </div>
      </div>

      <footer style={{ height: isMobile ? 30 : 40, backgroundColor: '#000010' }} />
    </main>
  );
}