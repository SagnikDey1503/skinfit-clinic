import { DoctorPatientsClient } from "@/components/doctor/DoctorPatientsClient";

export default function DoctorPatientsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
        <p className="text-sm text-slate-600">
          Filter by search, concern, or recent SOS alerts. Open a patient to view reports and send a voice note.
        </p>
      </div>
      <DoctorPatientsClient />
    </div>
  );
}
