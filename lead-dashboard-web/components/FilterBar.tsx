import { ASSIGNED_TO_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";

export type Filters = {
  search: string;
  status: string;
  assignedTo: string;
  city: string;
};

const selectClass =
  "w-full border border-slate-300 rounded-lg px-2.5 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

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
    <section className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 flex-1 sm:min-w-[220px]">
          Search
          <input
            type="search"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Business name or phone…"
            className={selectClass}
          />
        </label>

        <div className="grid grid-cols-3 gap-2 sm:contents">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 sm:w-40">
            Status
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value })}
              className={selectClass}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 sm:w-36">
            Assigned To
            <select
              value={filters.assignedTo}
              onChange={(e) => onChange({ ...filters, assignedTo: e.target.value })}
              className={selectClass}
            >
              <option value="">All</option>
              {ASSIGNED_TO_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 sm:w-44">
            City/Area
            <select
              value={filters.city}
              onChange={(e) => onChange({ ...filters, city: e.target.value })}
              className={selectClass}
            >
              <option value="">All</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={onAddLeadClick}
          className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2.5 sm:py-2 text-sm font-semibold shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
          </svg>
          Add Lead
        </button>
      </div>
    </section>
  );
}
