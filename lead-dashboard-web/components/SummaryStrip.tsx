import { useMemo } from "react";
import { ASSIGNED_TO_OPTIONS, STATUS_OPTIONS, type Status, type Lead } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

const STATUS_ACCENT: Record<Status, string> = {
  New: "border-t-slate-400",
  Contacted: "border-t-blue-400",
  "Follow-up": "border-t-amber-400",
  Interested: "border-t-sky-400",
  "Not Interested": "border-t-slate-300",
  "Closed-Won": "border-t-emerald-500",
  "Closed-Lost": "border-t-red-400",
};

export default function SummaryStrip({ leads }: { leads: Lead[] }) {
  const stats = useMemo(() => {
    const total = leads.length;
    const statusCounts: Record<string, number> = {};
    STATUS_OPTIONS.forEach((s) => (statusCounts[s] = 0));

    let closedWonDealValue = 0;
    const perPerson: Record<string, { totalLeads: number; deals: number; revenue: number }> = {};
    ASSIGNED_TO_OPTIONS.forEach((a) => (perPerson[a] = { totalLeads: 0, deals: 0, revenue: 0 }));

    for (const lead of leads) {
      if (lead.status in statusCounts) statusCounts[lead.status] += 1;
      if (lead.assigned_to && lead.assigned_to in perPerson) {
        perPerson[lead.assigned_to].totalLeads += 1;
      }
      if (lead.status === "Closed-Won") {
        closedWonDealValue += lead.deal_value ?? 0;
        if (lead.assigned_to && lead.assigned_to in perPerson) {
          perPerson[lead.assigned_to].deals += 1;
          perPerson[lead.assigned_to].revenue += lead.deal_value ?? 0;
        }
      }
    }

    const closedWon = statusCounts["Closed-Won"] ?? 0;
    const conversionRate = total ? (closedWon / total) * 100 : 0;

    return { total, statusCounts, conversionRate, closedWonDealValue, perPerson };
  }, [leads]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3">
        <SummaryCard label="Total Leads" value={stats.total} accent="border-t-indigo-500" />
        {STATUS_OPTIONS.map((s) => (
          <SummaryCard key={s} label={s} value={stats.statusCounts[s]} accent={STATUS_ACCENT[s]} />
        ))}
        <SummaryCard label="Conversion" value={`${stats.conversionRate.toFixed(1)}%`} accent="border-t-indigo-500" />
        <SummaryCard label="Revenue (Won)" value={formatMoney(stats.closedWonDealValue)} accent="border-t-emerald-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ASSIGNED_TO_OPTIONS.map((person) => {
          const p = stats.perPerson[person];
          return (
            <div key={person} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
                  {person.charAt(0)}
                </div>
                <span className="font-semibold text-slate-900">{person}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Leads" value={p.totalLeads} />
                <Stat label="Closed" value={p.deals} valueClassName="text-emerald-700" />
                <Stat label="Revenue" value={formatMoney(p.revenue)} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  valueClassName = "text-slate-900",
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div>
      <div className={`text-base font-semibold sm:text-lg ${valueClassName}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px]">{label}</div>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className={`bg-white border border-slate-200 border-t-2 ${accent} rounded-lg px-3 py-2.5 sm:px-4`}>
      <div className="text-lg font-semibold text-slate-900 sm:text-xl">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px] truncate">{label}</div>
    </div>
  );
}
