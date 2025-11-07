export async function GET() {
  // Temporary mock data (you can replace it with real API data later)
  const latencyData = [
    {
      from: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      to: { lat: 40.7128, lng: -74.0060 }, // New York
      latency: 45
    },
    {
      from: { lat: 51.5074, lng: -0.1278 }, // London
      to: { lat: 35.6895, lng: 139.6917 }, // Tokyo
      latency: 180
    }
  ];

  return new Response(JSON.stringify(latencyData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
