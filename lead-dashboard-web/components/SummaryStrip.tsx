import { useMemo } from "react";
import { ASSIGNED_TO_OPTIONS, STATUS_OPTIONS, type Lead } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

export default function SummaryStrip({ leads }: { leads: Lead[] }) {
  const stats = useMemo(() => {
    const total = leads.length;
    const statusCounts: Record<string, number> = {};
    STATUS_OPTIONS.forEach((s) => (statusCounts[s] = 0));

    let closedWonDealValue = 0;
    const perPerson: Record<string, { deals: number; revenue: number }> = {};
    ASSIGNED_TO_OPTIONS.forEach((a) => (perPerson[a] = { deals: 0, revenue: 0 }));

    for (const lead of leads) {
      if (lead.status in statusCounts) statusCounts[lead.status] += 1;
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
    <section className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <SummaryCard label="Total Leads" value={stats.total} />
        {STATUS_OPTIONS.map((s) => (
          <SummaryCard key={s} label={s} value={stats.statusCounts[s]} />
        ))}
        <SummaryCard label="Conversion Rate" value={`${stats.conversionRate.toFixed(1)}%`} />
        <SummaryCard label="Deal Value (Closed-Won)" value={formatMoney(stats.closedWonDealValue)} />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
              <th className="px-4 py-2">Assigned To</th>
              <th className="px-4 py-2">Deals Closed</th>
              <th className="px-4 py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {ASSIGNED_TO_OPTIONS.map((person) => (
              <tr key={person} className="border-t border-slate-100 text-slate-800">
                <td className="px-4 py-2 font-medium text-slate-900">{person}</td>
                <td className="px-4 py-2">{stats.perPerson[person].deals}</td>
                <td className="px-4 py-2">{formatMoney(stats.perPerson[person].revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 min-w-[110px]">
      <div className="text-xl font-semibold text-slate-900">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}
