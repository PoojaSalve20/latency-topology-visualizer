import { NextResponse } from 'next/server';

export async function GET() {
  const history = Array.from({ length: 10 }).map((_, i) => ({
    timestamp: Date.now() - i * 60000,
    latency: Math.floor(Math.random() * 200)
  }));
  return NextResponse.json(history);
}
