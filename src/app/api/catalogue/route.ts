import { getCatalogue } from "@/lib/catalogue";
export async function GET() {
  try {
    return Response.json(await getCatalogue(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Catalogue unavailable" }, { status: 503 });
  }
}
