
import { NextResponse } from 'next/server';
import { exchanges } from './exchanges';
import { simulateHistory, simulateLatency } from './latencySimulator';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pair = url.searchParams.get("pair") ?? "Binance-OKX";
  const range = url.searchParams.get("range") ?? "1h";

  let points = 60;
  let intervalMs = 60 * 1000;
  if (range === "24h") { points = 1440; intervalMs = 60 * 1000; }
  if (range === "7d") { points = 168; intervalMs = 60 * 60 * 1000; }
  if (range === "30d") { points = 720; intervalMs = 60 * 60 * 1000; }

  const parts = pair.split('-');
  const a = parts[0] ?? 'Binance';
  const b = parts[1] ?? 'OKX';
  const data = simulateHistory(a, b, Math.min(1000, points), intervalMs);
  return NextResponse.json(data);
}