'use client';
import { Line } from 'react-chartjs-2';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend as ChartLegend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, ChartLegend);

type DataPoint = { timestamp: number; latency: number };

type Props = {
  pair?: string;
  range?: string;
  onPairChange?: (p: string) => void;
  onRangeChange?: (r: string) => void;
  isMobile?: boolean;
  isDark?: boolean;
};

export default function LatencyChart({ pair: initialPair = 'Binance-OKX', range: initialRange = '1h', onPairChange, onRangeChange, isMobile = false, isDark = true }: Props) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [pair, setPair] = useState<string>(initialPair);
  const [range, setRange] = useState<string>(initialRange);
  const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });

  const pairs = ['Binance-OKX', 'Binance-Bybit', 'OKX-Deribit', 'Bybit-Deribit'];

  useEffect(() => setPair(initialPair), [initialPair]);
  useEffect(() => setRange(initialRange), [initialRange]);

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/history', { params: { pair, range } });
        if (!mounted) return;
        setData(res.data);
        if (res.data.length) {
          const latencies = res.data.map((d: any) => d.latency);
          const min = Math.min(...latencies);
          const max = Math.max(...latencies);
          const avg = latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length;
          setStats({ min, max, avg });
        } else setStats({ min: 0, max: 0, avg: 0 });
      } catch (e) { console.error(e); }
    };
    fetchHistory();
    const iv = setInterval(fetchHistory, 5000);
    return () => { mounted = false; clearInterval(iv); };
  }, [pair, range]);

  const chartData = useMemo(() => ({
    labels: data.map(d => new Date(d.timestamp).toLocaleString()),
    datasets: [{
      label: `${pair} latency (ms)`,
      data: data.map(d => d.latency),
      borderColor: isDark ? 'cyan' : '#0066cc',
      backgroundColor: isDark ? 'rgba(0,255,255,0.12)' : 'rgba(0,102,204,0.08)',
      tension: 0.25,
      pointRadius: 2,
      fill: true,
    }],
  }), [data, pair, isDark]);

  const downloadCSV = () => {
    const header = 'timestamp,latency\n';
    const rows = data.map(d => `${new Date(d.timestamp).toISOString()},${d.latency}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `latency-${pair}-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ width: '100%', height: '100%', padding: isMobile ? 8 : 16, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 8 : 12, marginBottom: isMobile ? 8 : 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <select style={{ flex: isMobile ? 1 : 'none' }} value={pair} onChange={(e) => { setPair(e.target.value); onPairChange?.(e.target.value); }}>
            {pairs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select style={{ flex: isMobile ? 1 : 'none' }} value={range} onChange={(e) => { setRange(e.target.value); onRangeChange?.(e.target.value); }}>
            <option value="1h">1 hour</option>
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
          </select>

          <button style={{ flex: isMobile ? 1 : 'none' }} onClick={downloadCSV}>Export CSV</button>
        </div>

        <div style={{ marginLeft: isMobile ? 0 : 'auto', color: '#fff', fontSize: isMobile ? '11px' : '13px', textAlign: isMobile ? 'center' : 'right' }}>
          Min: {stats.min} ms • Max: {stats.max} ms • Avg: {stats.avg.toFixed(2)} ms
        </div>
      </div>

      <div style={{ flex: 1, minHeight: isMobile ? 180 : 240 }}>
        <Line data={chartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { ticks: { color: isDark ? '#fff' : '#111' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: isDark ? '#fff' : '#111' }, grid: { color: 'rgba(255,255,255,0.04)' } }
          },
          plugins: { legend: { labels: { color: isDark ? '#fff' : '#111' } } }
        }} />
      </div>
    </div>
  );
}