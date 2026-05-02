"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Loader2, Menu, X } from "lucide-react";
import clsx from "clsx";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/history", label: "Treatment History" },
  { href: "/dashboard/scan", label: "AI Scan" },
  { href: "/dashboard/schedules", label: "Schedules" },
  { href: "/dashboard/wellness", label: "Overall Wellness" },
  { href: "/dashboard/chat", label: "Chat With Us" },
  { href: "/dashboard/profile", label: "Profile" },
] as const;

function isActive(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/dashboard") {
    const isRoot =
      pathname === "/dashboard" || pathname === "/dashboard/";
    if (!isRoot) return false;
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkBase =
  "rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sosBusy, setSosBusy] = useState(false);
  const [sosHint, setSosHint] = useState<string | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  useEffect(() => {
    if (!sosHint) return;
    const t = window.setTimeout(() => setSosHint(null), 3200);
    return () => window.clearTimeout(t);
  }, [sosHint]);

  const triggerSos = useCallback(async () => {
    if (sosBusy) return;
    const detail = window.prompt(
      "SOS alert: describe symptoms briefly (redness, swelling, pain, etc).",
      ""
    );
    if (detail === null) return;
    const text = detail.trim()
      ? `SOS: ${detail.trim()}`
      : "SOS: Adverse reaction after treatment. Need urgent doctor help.";

    setSosHint(null);
    setSosBusy(true);
    try {
      const res = await fetch("/api/chat/plain/message", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantId: "doctor",
          isUrgent: true,
          text,
        }),
      });
      const j = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !j.success) {
        setSosHint(j.error ?? "Could not send SOS alert.");
        return;
      }
      setSosHint("SOS sent to doctor. Opened doctor chat.");
      setOpen(false);
      router.push("/dashboard/chat?assistant=doctor");
    } catch {
      setSosHint("Network error. Please try SOS again.");
    } finally {
      setSosBusy(false);
    }
  }, [router, sosBusy]);

  return (
    <div className="flex min-w-0 flex-1 items-center justify-end md:justify-center">
      <nav
        className="hidden flex-wrap items-center justify-center gap-1 md:flex"
        aria-label="Dashboard"
      >
        <button
          type="button"
          onClick={() => void triggerSos()}
          disabled={sosBusy}
          className="mr-1 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 lg:px-4"
          title="Urgent: notify doctor immediately"
        >
          {sosBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          Urgent
        </button>
        {links.map(({ href, label }) => {
          const active = isActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                linkBase,
                "px-3 py-2 lg:px-4",
                active
                  ? "bg-[#E0F0ED] text-teal-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-teal-600"
              )}
              aria-current={active ? "page" : undefined}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 md:hidden"
        aria-expanded={open}
        aria-controls="dashboard-mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-[100] bg-slate-900/40 md:hidden"
            aria-hidden
            onClick={close}
          />
          <div
            id="dashboard-mobile-nav"
            className="fixed inset-y-0 right-0 z-[101] flex w-[min(20rem,calc(100vw-2.5rem))] max-w-full flex-col border-l border-slate-200 bg-white shadow-xl md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="font-semibold text-slate-900">Menu</span>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Close menu"
                onClick={close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav
              className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pb-8"
              aria-label="Dashboard pages"
            >
              <button
                type="button"
                onClick={() => void triggerSos()}
                disabled={sosBusy}
                className="mb-2 inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                title="Urgent: notify doctor immediately"
              >
                {sosBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                Urgent SOS
              </button>
              {links.map(({ href, label }) => {
                const active = isActive(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={close}
                    className={clsx(
                      linkBase,
                      "px-4 py-3.5",
                      active
                        ? "bg-[#E0F0ED] text-teal-800"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      ) : null}
      {sosHint ? (
        <p className="fixed bottom-3 left-1/2 z-[110] -translate-x-1/2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm">
          {sosHint}
        </p>
      ) : null}
    </div>
  );
}
