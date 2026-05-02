import { eq } from "drizzle-orm";
import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { getSessionUserId } from "@/src/lib/auth/get-session";

/** Staff who may use `/doctor` portal: any doctor or admin. */
export async function getDoctorPortalUserId(): Promise<string | null> {
  const id = await getSessionUserId();
  if (!id) return null;
  const row = await db.query.users.findFirst({
    where: eq(users.id, id),
    columns: { role: true },
  });
  if (!row) return null;
  if (row.role === "doctor" || row.role === "admin") return id;
  return null;
}
