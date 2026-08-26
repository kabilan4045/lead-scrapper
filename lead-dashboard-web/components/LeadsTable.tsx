"use client";

import { useMemo, useState } from "react";
import { ASSIGNED_TO_OPTIONS, STATUS_OPTIONS, type AssignedTo, type Lead, type Status } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

type SortField =
  | "business_name"
  | "phone_number"
  | "city_area"
  | "category"
  | "assigned_to"
  | "status"
  | "follow_up_date"
  | "deal_value"
  | "website"
  | "notes";

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "business_name", label: "Business Name" },
  { field: "phone_number", label: "Phone Number" },
  { field: "city_area", label: "City/Area" },
  { field: "category", label: "Category" },
  { field: "assigned_to", label: "Assigned To" },
  { field: "status", label: "Status" },
  { field: "follow_up_date", label: "Follow-up Date" },
  { field: "deal_value", label: "Deal Value" },
  { field: "website", label: "Website" },
  { field: "notes", label: "Notes" },
];

const STATUS_STYLES: Record<Status, string> = {
  New: "text-slate-700",
  Contacted: "text-slate-700",
  "Follow-up": "text-amber-700",
  Interested: "text-blue-700",
  "Not Interested": "text-slate-400",
  "Closed-Won": "text-emerald-700 font-semibold",
  "Closed-Lost": "text-red-700 font-semibold",
};

export type EditableFields = {
  status?: Status;
  assigned_to?: AssignedTo | "";
  follow_up_date?: string;
  notes?: string;
};

export default function LeadsTable({
  leads,
  onUpdate,
}: {
  leads: Lead[];
  onUpdate: (id: number, fields: EditableFields) => Promise<boolean>;
}) {
  const [sortField, setSortField] = useState<SortField>("business_name");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [savingId, setSavingId] = useState<number | null>(null);

  const sorted = useMemo(() => {
    const copy = [...leads];
    copy.sort((a, b) => {
      if (sortField === "deal_value") {
        const av = a.deal_value ?? -Infinity;
        const bv = b.deal_value ?? -Infinity;
        return (av - bv) * sortDir;
      }
      const av = (a[sortField] ?? "").toString().toLowerCase();
      const bv = (b[sortField] ?? "").toString().toLowerCase();
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
    return copy;
  }, [leads, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortField(field);
      setSortDir(1);
    }
  }

  async function handleEdit(id: number, fields: EditableFields) {
    setSavingId(id);
    await onUpdate(id, fields);
    setSavingId(null);
  }

  if (leads.length === 0) {
    return <p className="text-sm text-slate-500 px-1">No leads match the current filters.</p>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
            {COLUMNS.map((col) => (
              <th
                key={col.field}
                onClick={() => toggleSort(col.field)}
                className="px-3 py-2 cursor-pointer select-none hover:text-slate-800 whitespace-nowrap"
              >
                {col.label}
                {sortField === col.field ? (sortDir === 1 ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((lead) => (
            <tr key={lead.id} className="border-t border-slate-100 hover:bg-slate-50 align-top">
              <td className="px-3 py-2 whitespace-nowrap">{lead.business_name}</td>
              <td className="px-3 py-2 whitespace-nowrap">{lead.phone_number}</td>
              <td className="px-3 py-2 whitespace-nowrap">{lead.city_area || ""}</td>
              <td className="px-3 py-2 whitespace-nowrap">{lead.category || ""}</td>
              <td className="px-3 py-2">
                <select
                  value={lead.assigned_to ?? ""}
                  disabled={savingId === lead.id}
                  onChange={(e) => handleEdit(lead.id, { assigned_to: e.target.value as AssignedTo | "" })}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm w-full"
                >
                  <option value="">Unassigned</option>
                  {ASSIGNED_TO_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <select
                  value={lead.status}
                  disabled={savingId === lead.id}
                  onChange={(e) => handleEdit(lead.id, { status: e.target.value as Status })}
                  className={`border border-slate-300 rounded-md px-2 py-1 text-sm w-full bg-white ${STATUS_STYLES[lead.status]}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2">
                <input
                  key={`follow-up-${lead.id}-${lead.follow_up_date ?? ""}`}
                  type="date"
                  defaultValue={lead.follow_up_date ?? ""}
                  disabled={savingId === lead.id}
                  onBlur={(e) => {
                    if (e.target.value !== (lead.follow_up_date ?? "")) {
                      handleEdit(lead.id, { follow_up_date: e.target.value });
                    }
                  }}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm w-full"
                />
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {typeof lead.deal_value === "number" ? formatMoney(lead.deal_value) : "—"}
              </td>
              <td className="px-3 py-2 min-w-[140px]">
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {lead.website.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="inline-block text-[11px] font-semibold text-red-600 bg-red-50 rounded px-1.5 py-0.5">
                    No website
                  </span>
                )}
              </td>
              <td className="px-3 py-2 min-w-[180px]">
                <input
                  key={`notes-${lead.id}-${lead.notes ?? ""}`}
                  type="text"
                  defaultValue={lead.notes ?? ""}
                  disabled={savingId === lead.id}
                  onBlur={(e) => {
                    if (e.target.value !== (lead.notes ?? "")) {
                      handleEdit(lead.id, { notes: e.target.value });
                    }
                  }}
                  className="border border-slate-300 rounded-md px-2 py-1 text-sm w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
