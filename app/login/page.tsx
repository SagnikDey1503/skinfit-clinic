"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left Side - Brand (hidden on mobile) */}
      <div className="hidden min-h-screen flex-1 flex-col justify-center bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 px-12 lg:flex">
        <div className="mx-auto max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">
              SkinFit
            </span>
          </div>
          <p className="text-lg leading-relaxed text-teal-50">
            Welcome back to your personalized skincare journey.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex min-h-screen flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              Patient Login
            </h1>
            <p className="mt-2 text-slate-600">
              Enter your details to access your dashboard.
            </p>
          </div>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="••••••••"
              />
            </div>

            <Link
              href="/dashboard"
              className="flex w-full items-center justify-center rounded-full bg-teal-600 px-5 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Sign In
            </Link>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/contact" className="font-medium text-teal-600 hover:text-teal-700">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
