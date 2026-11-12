import { db, requireAdmin, reply, failure } from "@/lib/admin/server";
export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await db().rpc("maison_overview");
    if (error) throw error;
    return reply(data);
  } catch (e) {
    return failure(e);
  }
}
