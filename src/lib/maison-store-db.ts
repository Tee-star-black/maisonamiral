/**
 * Server-only Supabase REST bridge. The service-role key must never be exposed
 * in NEXT_PUBLIC variables or imported from client components.
 */
export async function storeDb<T = unknown>(
  table: "maison_orders" | "maison_subscribers",
  method: "GET" | "POST" | "PATCH",
  options: { query?: Record<string, string>; body?: unknown; prefer?: string } = {},
): Promise<T> {
  const rawUrl = process.env.MAISON_SUPABASE_URL;
  const key = process.env.MAISON_SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !key) throw new Error("Store persistence not configured");

  const base = new URL(rawUrl);
  if (base.protocol !== "https:" && base.hostname !== "localhost")
    throw new Error("Store database URL must be HTTPS");
  const url = new URL("/rest/v1/" + table, base);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: options.prefer ?? "return=representation",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) throw new Error("Store database request failed: " + response.status);
  const text = await response.text();
  return (text ? JSON.parse(text) : []) as T;
}
