import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  /** Extra classes for the chip look, e.g. "bg-emerald-50 text-emerald-700" */
  colorClassName?: string;
};

export default function Select({
  className = "",
  colorClassName = "bg-white text-slate-900",
  children,
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`appearance-none w-full border border-slate-300 rounded-lg pl-2.5 pr-8 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:opacity-50 ${colorClassName} ${className}`}
      >
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
      >
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
