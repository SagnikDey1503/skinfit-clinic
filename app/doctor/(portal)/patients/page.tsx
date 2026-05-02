import { DoctorPatientsClient } from "@/components/doctor/DoctorPatientsClient";

export default async function DoctorPatientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ sos?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const initialSosOnly = sp.sos === "1" || sp.sos === "true";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <p className="text-sm text-slate-600">
          Filter by search, concern, or recent SOS alerts. SOS patients are highlighted in red;
          use{" "}
          <strong className="font-semibold text-slate-800">Alerts</strong> in the header for the
          latest SOS list (push is also sent to the doctor app when a patient sends SOS).
        </p>
      </div>
      <DoctorPatientsClient initialSosOnly={initialSosOnly} />
    </div>
  );
}
