import { ASSIGNED_TO_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";

export type Filters = {
  search: string;
  status: string;
  assignedTo: string;
  city: string;
};

export default function FilterBar({
  filters,
  onChange,
  cities,
  onAddLeadClick,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  cities: string[];
  onAddLeadClick: () => void;
}) {
  return (
    <section className="flex flex-wrap items-end gap-3 sm:gap-4">
      <label className="flex flex-col gap-1 text-xs text-slate-500 flex-1 min-w-[180px] sm:flex-none">
        Search
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Business name or phone…"
          className="w-full sm:min-w-[220px] border border-slate-300 rounded-md px-3 py-1.5 text-sm text-slate-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Status
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value })}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900"
        >
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        Assigned To
        <select
          value={filters.assignedTo}
          onChange={(e) => onChange({ ...filters, assignedTo: e.target.value })}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900"
        >
          <option value="">All</option>
          {ASSIGNED_TO_OPTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-slate-500">
        City/Area
        <select
          value={filters.city}
          onChange={(e) => onChange({ ...filters, city: e.target.value })}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-900"
        >
          <option value="">All</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onAddLeadClick}
        className="w-full sm:w-auto sm:ml-auto bg-slate-900 text-white rounded-md px-4 py-2 sm:py-1.5 text-sm font-medium hover:bg-slate-800"
      >
        + Add Lead
      </button>
    </section>
  );
}
