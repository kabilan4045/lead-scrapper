"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        router.replace(params.get("next") || "/");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Incorrect passcode.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl shadow-slate-200/60 border border-slate-200 rounded-2xl p-8 sm:p-9 w-full max-w-sm"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
            <path
              d="M4 6h16M4 12h16M4 18h10"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 text-center mb-1">Lead Dashboard</h1>
        <p className="text-sm text-slate-500 text-center mb-6">Enter the shared passcode to continue.</p>
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3.5 py-3 mb-3 text-base text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="Passcode"
          autoFocus
          inputMode="numeric"
        />
        {error && (
          <p className="text-sm text-red-600 mb-3 flex items-center gap-1.5" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !passcode}
          className="w-full bg-indigo-600 text-white rounded-lg px-3 py-3 text-sm font-semibold shadow-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
        >
          {loading ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
