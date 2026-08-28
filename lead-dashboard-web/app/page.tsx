"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Lead } from "@/lib/constants";
import SummaryStrip from "@/components/SummaryStrip";
import FilterBar, { type Filters } from "@/components/FilterBar";
import LeadsTable, { type EditableFields } from "@/components/LeadsTable";
import AddLeadForm, { type NewLeadInput } from "@/components/AddLeadForm";

const EMPTY_FILTERS: Filters = { search: "", status: "", assignedTo: "", city: "" };

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load leads");
      setLeads(data);
      setStatusLine(`Loaded ${data.length} lead(s) — ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      await loadLeads();
      if (ignore) return;
    })();
    return () => {
      ignore = true;
    };
  }, [loadLeads]);

  const cities = useMemo(
    () => Array.from(new Set(leads.map((l) => l.city_area).filter((c): c is string => !!c))).sort(),
    [leads]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return leads.filter((l) => {
      if (filters.status && l.status !== filters.status) return false;
      if (filters.assignedTo && l.assigned_to !== filters.assignedTo) return false;
      if (filters.city && l.city_area !== filters.city) return false;
      if (q) {
        const name = (l.business_name || "").toLowerCase();
        const phone = (l.phone_number || "").toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });
  }, [leads, filters]);

  async function handleUpdate(id: number, fields: EditableFields): Promise<boolean> {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
      setStatusLine(`Saved ${data.business_name} — ${new Date().toLocaleTimeString()}`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      return false;
    }
  }

  async function handleAddLead(input: NewLeadInput): Promise<string | null> {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          assigned_to: input.assigned_to || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Could not add lead";
      setLeads((prev) => [data, ...prev]);
      setStatusLine(`Added ${data.business_name}`);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not add lead";
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 flex flex-col gap-3 px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
              <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">Lead Dashboard</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs text-slate-500 order-last basis-full sm:order-none sm:basis-auto">
            {loading ? "Loading…" : statusLine}
          </span>
          <button
            onClick={loadLeads}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-slate-800 px-2 py-1.5 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="px-4 py-5 space-y-5 sm:px-6 sm:py-6 sm:space-y-6 max-w-[1600px] mx-auto">
        <SummaryStrip leads={leads} />
        <FilterBar filters={filters} onChange={setFilters} cities={cities} onAddLeadClick={() => setShowAddForm(true)} />
        <LeadsTable leads={filtered} onUpdate={handleUpdate} />
      </main>

      {showAddForm && <AddLeadForm onSubmit={handleAddLead} onClose={() => setShowAddForm(false)} />}

      {error && (
        <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-5 bg-red-600 text-white text-sm rounded-lg px-4 py-3 shadow-lg sm:max-w-sm z-40">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
