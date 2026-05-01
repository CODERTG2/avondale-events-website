export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Forward-geocode a free-text place (Nominatim). Use sparingly; results are cached by caller.
 */
export async function geocodeWithNominatim(
  query: string,
  signal?: AbortSignal,
): Promise<{ lat: number; lng: number } | null> {
  const q = query.trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { lat?: string; lon?: string }[];
  const first = data[0];
  if (!first?.lat || !first?.lon) return null;
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
