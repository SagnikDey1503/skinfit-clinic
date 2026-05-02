import { DoctorPatientDetailClient } from "@/components/doctor/DoctorPatientDetailClient";

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  return <DoctorPatientDetailClient patientId={patientId} />;
}
