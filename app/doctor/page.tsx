import { redirect } from "next/navigation";
import { getDoctorPortalUserId } from "@/src/lib/auth/doctor-access";

export default async function DoctorIndexPage() {
  const id = await getDoctorPortalUserId();
  if (id) redirect("/doctor/patients");
  redirect("/doctor/login");
}
