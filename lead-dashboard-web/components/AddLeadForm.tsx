"use client";

import { useState, type FormEvent } from "react";
import {
  ASSIGNED_TO_OPTIONS,
  STATUS_BADGE,
  STATUS_OPTIONS,
  randomAssignee,
  type AssignedTo,
  type Status,
} from "@/lib/constants";
import Select from "@/components/Select";

export type NewLeadInput = {
  business_name: string;
  phone_number: string;
  contact_person: string;
  city_area: string;
  category: string;
  website: string;
  assigned_to: AssignedTo | "";
  status: Status;
  notes: string;
};

const EMPTY: NewLeadInput = {
  business_name: "",
  phone_number: "",
  contact_person: "",
  city_area: "",
  category: "",
  website: "",
  assigned_to: "",
  status: "New",
  notes: "",
};

export default function AddLeadForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (input: NewLeadInput) => Promise<string | null>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<NewLeadInput>(() => ({ ...EMPTY, assigned_to: randomAssignee() }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof NewLeadInput>(key: K, value: NewLeadInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const err = await onSubmit(form);
    setSaving(false);
    if (err) {
      setError(err);
    } else {
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center p-0 z-50 sm:items-center sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-lg p-5 sm:p-6 space-y-3.5 max-h-[92vh] overflow-y-auto"
      >
        <h2 className="text-lg font-semibold text-slate-900">Add Lead</h2>

        <Field label="Business Name *">
          <input
            required
            value={form.business_name}
            onChange={(e) => set("business_name", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Phone Number *">
          <input
            required
            value={form.phone_number}
            onChange={(e) => set("phone_number", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Contact Person">
          <input
            value={form.contact_person}
            onChange={(e) => set("contact_person", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="City/Area">
            <input
              value={form.city_area}
              onChange={(e) => set("city_area", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Category">
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Website">
          <input value={form.website} onChange={(e) => set("website", e.target.value)} className="input" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Assigned To (randomly picked, change if needed)">
            <Select value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value as AssignedTo | "")}>
              <option value="">Unassigned</option>
              {ASSIGNED_TO_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => set("status", e.target.value as Status)}
              colorClassName={STATUS_BADGE[form.status]}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="input"
            rows={2}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 sm:py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2.5 sm:py-2 text-sm rounded-lg bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : "Add Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-slate-500 space-y-1">
      {label}
      {children}
    </label>
  );
}
