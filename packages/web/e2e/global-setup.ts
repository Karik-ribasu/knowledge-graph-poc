const apiURL = process.env["PLAYWRIGHT_API_URL"] ?? "http://localhost:3001/api/v1";

export default async function globalSetup(): Promise<void> {
  try {
    const res = await fetch(`${apiURL}/health`);
    if (!res.ok) {
      console.warn(`[e2e] API health check failed: ${res.status}`);
    }
  } catch {
    console.warn("[e2e] API not reachable — some tests may skip graph interactions");
  }
}
