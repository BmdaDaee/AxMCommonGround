import { ENV } from "./env";

function getMapsConfig() {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) throw new Error("Google Maps proxy credentials missing");
  return { baseUrl: ENV.forgeApiUrl.replace(/\/+$/, ""), apiKey: ENV.forgeApiKey };
}

export async function makeRequest<T = unknown>(
  endpoint: string,
  params: Record<string, unknown> = {},
  options: { method?: "GET" | "POST"; body?: Record<string, unknown> } = {}
): Promise<T> {
  const { baseUrl, apiKey } = getMapsConfig();
  const url = new URL(`${baseUrl}/v1/maps/proxy${endpoint}`);
  url.searchParams.append("key", apiKey);
  Object.entries(params).forEach(([k, v]) => { if (v != null) url.searchParams.append(k, String(v)); });

  const response = await fetch(url.toString(), {
    method: options.method || "GET",
    headers: { "Content-Type": "application/json" },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Maps API request failed (${response.status}): ${errorText}`);
  }
  return (await response.json()) as T;
}

export type TravelMode = "driving" | "walking" | "bicycling" | "transit";
export type LatLng = { lat: number; lng: number };
