"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export function DoctorLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = useCallback(async () => {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/doctor/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => void logout()}
      disabled={busy}
      className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
    >
      {busy ? "…" : "Log out"}
    </button>
  );
}
