"use client";

import { useMemo, useState } from "react";
import {
  ASSIGNED_TO_OPTIONS,
  STATUS_BADGE,
  STATUS_OPTIONS,
  type AssignedTo,
  type Lead,
  type Status,
} from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import Select from "@/components/Select";

type SortField =
  | "business_name"
  | "phone_number"
  | "city_area"
  | "category"
  | "assigned_to"
  | "status"
  | "payment_received"
  | "follow_up_date"
  | "deal_value"
  | "website"
  | "address"
  | "reviews_count"
  | "notes";

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "business_name", label: "Business Name" },
  { field: "phone_number", label: "Phone Number" },
  { field: "city_area", label: "City/Area" },
  { field: "category", label: "Category" },
  { field: "assigned_to", label: "Assigned To" },
  { field: "status", label: "Status" },
  { field: "payment_received", label: "Payment Received" },
  { field: "follow_up_date", label: "Follow-up Date" },
  { field: "deal_value", label: "Deal Value" },
  { field: "website", label: "Website" },
  { field: "address", label: "Address" },
  { field: "reviews_count", label: "Reviews" },
  { field: "notes", label: "Notes" },
];

export type EditableFields = {
  status?: Status;
  assigned_to?: AssignedTo | "";
  follow_up_date?: string;
  notes?: string;
  payment_received?: boolean;
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
  const [confirmLead, setConfirmLead] = useState<Lead | null>(null);

  const sorted = useMemo(() => {
    const copy = [...leads];
    copy.sort((a, b) => {
      if (sortField === "deal_value" || sortField === "reviews_count") {
        const av = a[sortField] ?? -Infinity;
        const bv = b[sortField] ?? -Infinity;
        return (av - bv) * sortDir;
      }
      if (sortField === "payment_received") {
        return (Number(a.payment_received) - Number(b.payment_received)) * sortDir;
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

  function handlePaymentToggle(lead: Lead, checked: boolean) {
    if (checked) {
      // Marking payment received is the "deal is actually closed" moment —
      // gate it behind an explicit confirm instead of a plain checkbox click.
      setConfirmLead(lead);
    } else {
      handleEdit(lead.id, { payment_received: false });
    }
  }

  async function confirmPaymentReceived() {
    if (!confirmLead) return;
    const lead = confirmLead;
    setConfirmLead(null);
    await handleEdit(lead.id, { payment_received: true });
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
        <p className="text-sm text-slate-500">No leads match the current filters.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet: full table */}
      <div className="hidden sm:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
              {COLUMNS.map((col) => (
                <th
                  key={col.field}
                  onClick={() => toggleSort(col.field)}
                  className="px-3 py-2.5 cursor-pointer select-none hover:text-slate-800 whitespace-nowrap"
                >
                  {col.label}
                  {sortField === col.field ? (sortDir === 1 ? " ▲" : " ▼") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-100 hover:bg-slate-50/70 align-top text-slate-800">
                <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-900">{lead.business_name}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  <a href={`tel:${lead.phone_number}`} className="text-indigo-600 hover:underline">
                    {lead.phone_number}
                  </a>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">{lead.city_area || ""}</td>
                <td className="px-3 py-2.5 whitespace-nowrap">{lead.category || ""}</td>
                <td className="px-3 py-2.5">
                  <Select
                    value={lead.assigned_to ?? ""}
                    disabled={savingId === lead.id}
                    onChange={(e) => handleEdit(lead.id, { assigned_to: e.target.value as AssignedTo | "" })}
                  >
                    <option value="">Unassigned</option>
                    {ASSIGNED_TO_OPTIONS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-2.5">
                  <Select
                    value={lead.status}
                    disabled={savingId === lead.id}
                    onChange={(e) => handleEdit(lead.id, { status: e.target.value as Status })}
                    colorClassName={STATUS_BADGE[lead.status]}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={lead.payment_received}
                    disabled={savingId === lead.id}
                    onChange={(e) => handlePaymentToggle(lead, e.target.checked)}
                    className="h-4 w-4 accent-emerald-600 disabled:opacity-50"
                    aria-label={`Payment received for ${lead.business_name}`}
                  />
                </td>
                <td className="px-3 py-2.5">
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
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-full bg-white text-slate-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {typeof lead.deal_value === "number" ? formatMoney(lead.deal_value) : "—"}
                </td>
                <td className="px-3 py-2.5 min-w-[140px]">
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
                <td className="px-3 py-2.5 min-w-[180px] max-w-[220px] text-xs text-slate-600">
                  {lead.address || ""}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {lead.reviews_count != null
                    ? `${lead.reviews_count}${lead.rating != null ? ` (${lead.rating}★)` : ""}`
                    : ""}
                </td>
                <td className="px-3 py-2.5 min-w-[180px]">
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
                    className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm w-full bg-white text-slate-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list, built for calling on the go */}
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {sorted.map((lead) => (
          <div key={lead.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 leading-snug">{lead.business_name}</div>
                <div className="text-xs text-slate-500 mt-0.5 truncate">
                  {[lead.category, lead.city_area].filter(Boolean).join(" · ")}
                </div>
              </div>
              <span
                className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full ${STATUS_BADGE[lead.status]}`}
              >
                {lead.status}
              </span>
            </div>

            <a
              href={`tel:${lead.phone_number}`}
              className="flex items-center gap-2 text-indigo-600 font-medium text-base bg-indigo-50 rounded-lg px-3 py-2.5"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5 shrink-0">
                <path
                  d="M3 5c0-1 1-2 2-2h2l2 5-2 1c1 3 3 5 6 6l1-2 5 2v2c0 1-1 2-2 2C10 19 3 12 3 5Z"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
              </svg>
              {lead.phone_number}
            </a>

            {(lead.address || lead.opening_hours || lead.reviews_count != null) && (
              <div className="text-xs text-slate-500 space-y-1 border-t border-slate-100 pt-2.5">
                {lead.address && <div>{lead.address}</div>}
                {lead.opening_hours && <div className="line-clamp-2">{lead.opening_hours}</div>}
                {lead.reviews_count != null && (
                  <div>
                    {lead.rating != null ? `${lead.rating}★` : ""} ({lead.reviews_count} reviews)
                  </div>
                )}
              </div>
            )}

            {lead.website ? (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-xs text-blue-600 hover:underline break-all"
              >
                {lead.website.replace(/^https?:\/\//, "")}
              </a>
            ) : (
              <span className="inline-block text-[11px] font-semibold text-red-600 bg-red-50 rounded px-1.5 py-0.5">
                No website
              </span>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Select
                value={lead.assigned_to ?? ""}
                disabled={savingId === lead.id}
                onChange={(e) => handleEdit(lead.id, { assigned_to: e.target.value as AssignedTo | "" })}
              >
                <option value="">Unassigned</option>
                {ASSIGNED_TO_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
              <Select
                value={lead.status}
                disabled={savingId === lead.id}
                onChange={(e) => handleEdit(lead.id, { status: e.target.value as Status })}
                colorClassName={STATUS_BADGE[lead.status]}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={lead.payment_received}
                  disabled={savingId === lead.id}
                  onChange={(e) => handlePaymentToggle(lead, e.target.checked)}
                  className="h-4 w-4 accent-emerald-600 disabled:opacity-50"
                />
                Payment received
              </label>
              {typeof lead.deal_value === "number" && (
                <span className="text-sm font-medium text-slate-900">{formatMoney(lead.deal_value)}</span>
              )}
            </div>

            <input
              key={`follow-up-m-${lead.id}-${lead.follow_up_date ?? ""}`}
              type="date"
              defaultValue={lead.follow_up_date ?? ""}
              disabled={savingId === lead.id}
              onBlur={(e) => {
                if (e.target.value !== (lead.follow_up_date ?? "")) {
                  handleEdit(lead.id, { follow_up_date: e.target.value });
                }
              }}
              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white text-slate-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              key={`notes-m-${lead.id}-${lead.notes ?? ""}`}
              type="text"
              defaultValue={lead.notes ?? ""}
              placeholder="Notes…"
              disabled={savingId === lead.id}
              onBlur={(e) => {
                if (e.target.value !== (lead.notes ?? "")) {
                  handleEdit(lead.id, { notes: e.target.value });
                }
              }}
              className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm bg-white text-slate-900 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
      </div>

      {confirmLead && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Confirm payment received</h2>
            <p className="text-sm text-slate-600">
              Mark <span className="font-medium text-slate-900">{confirmLead.business_name}</span> as{" "}
              <span className="font-medium text-emerald-700">Closed-Won</span> with payment received? This updates
              both the status and payment fields together.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmLead(null)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPaymentReceived}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
