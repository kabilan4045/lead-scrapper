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
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold text-slate-900">Lead Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">{loading ? "Loading…" : statusLine}</span>
          <button onClick={loadLeads} className="text-sm border border-slate-300 rounded-md px-3 py-1.5">
            Refresh
          </button>
          <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-800">
            Log out
          </button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        <SummaryStrip leads={leads} />
        <FilterBar filters={filters} onChange={setFilters} cities={cities} onAddLeadClick={() => setShowAddForm(true)} />
        <LeadsTable leads={filtered} onUpdate={handleUpdate} />
      </main>

      {showAddForm && <AddLeadForm onSubmit={handleAddLead} onClose={() => setShowAddForm(false)} />}

      {error && (
        <div className="fixed bottom-5 right-5 bg-red-600 text-white text-sm rounded-md px-4 py-2 shadow-lg max-w-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
