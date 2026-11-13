import { API_URL } from "../config/env";

export async function checkBackendHealth(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${API_URL}/health`, { signal: controller.signal });
    if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("status" in data) || data.status !== "ok") {
      throw new Error("Unexpected health response");
    }
  } finally {
    clearTimeout(timeout);
  }
}
