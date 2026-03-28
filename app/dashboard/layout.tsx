import React from "react";
import Link from "next/link";
import { Sparkles, User, LogOut } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      {/* Premium Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">
              SkinFit
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-2 text-sm font-medium text-teal-600 bg-teal-50"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/history"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-teal-600"
            >
              Treatment History
            </Link>
            <Link
              href="/dashboard/scan"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-teal-600"
            >
              AI Scan
            </Link>
            <Link
              href="/dashboard/schedules"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-teal-600"
            >
              Schedules
            </Link>
            <Link
              href="/dashboard/wellness"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-teal-600"
            >
              Overall Wellness
            </Link>
            <Link
              href="/dashboard/chat"
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-teal-600"
            >
              Chat With Us
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-teal-50 text-teal-600 transition-colors hover:bg-teal-100"
              title="Profile"
            >
              <User className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-600"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-lg px-4 py-6 pb-12 sm:max-w-xl md:max-w-2xl">
        {children}
      </main>
    </div>
  );
}
