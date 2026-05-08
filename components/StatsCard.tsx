"use client";

import { Landmark, ReceiptText, TrendingUp } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { formatCurrency } from "@/lib/money";

export function StatsCard() {
  const { currentMonth, getCategoryById } = useExpenses();
  const stats = useMemo(() => {
    const pesoExpenses = currentMonth.expenses.filter(
      (expense) => expense.currency === "ARS",
    );
    const total = pesoExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const byCategory = new Map<string, number>();
    pesoExpenses.forEach((expense) => {
      byCategory.set(expense.categoryId, (byCategory.get(expense.categoryId) ?? 0) + expense.amount);
    });
    const biggest = [...byCategory.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      count: currentMonth.expenses.length,
      average: pesoExpenses.length ? total / pesoExpenses.length : 0,
      biggestCategoryId: biggest?.[0],
      biggestValue: biggest?.[1] ?? 0,
    };
  }, [currentMonth.expenses]);

  const biggestCategory = stats.biggestCategoryId
    ? getCategoryById(stats.biggestCategoryId)
    : undefined;

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm text-violet-200">Resumen</p>
        <h2 className="font-display text-3xl text-white">Indicadores</h2>
      </div>
      <div className="grid gap-3">
        <StatRow
          icon={<Landmark className="size-5" />}
          label="Total gastado"
          value={formatCurrency(stats.total)}
        />
        <StatRow
          icon={<ReceiptText className="size-5" />}
          label="Transacciones"
          value={String(stats.count)}
        />
        <StatRow
          icon={<TrendingUp className="size-5" />}
          label="Mayor categoría"
          value={
            biggestCategory
              ? `${biggestCategory.icon} ${biggestCategory.name} · ${formatCurrency(stats.biggestValue)}`
              : "Sin datos"
          }
        />
        <StatRow
          icon={<ReceiptText className="size-5" />}
          label="Promedio"
          value={formatCurrency(stats.average)}
        />
      </div>
    </section>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-3">
      <span className="grid size-10 place-items-center rounded-lg bg-violet-400/15 text-violet-100">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-white sm:text-base">{value}</p>
      </div>
    </div>
  );
}
