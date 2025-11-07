// ...existing code...
export const simulateLatency = (a: string, b: string) => {
  const seed = Array.from(a + b).reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const base = (seed % 120) + 10;
  const jitter = Math.floor(Math.random() * 80);
  return Math.max(5, Math.min(400, base + jitter));
};

export const simulateHistory = (a: string, b: string, points = 60, intervalMs = 60000) => {
  const now = Date.now();
  const arr = new Array(points).fill(0).map((_, i) => {
    const ts = now - (points - 1 - i) * intervalMs;
    const base = simulateLatency(a, b);
    const jitter = Math.round(30 * Math.sin(i / 7) + (Math.random() * 40 - 20));
    return { timestamp: ts, latency: Math.max(1, base + jitter) };
  });
  return arr;
};