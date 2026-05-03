"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { formatCurrency } from "@/lib/money";
import { EmptyState } from "./EmptyState";

interface ChartDatum {
  id: string;
  name: string;
  value: number;
  color: string;
  icon: string;
}

export function PieChartCard() {
  const { currentMonth, getCategoryById } = useExpenses();
  const data = useMemo<ChartDatum[]>(() => {
    const grouped = new Map<string, number>();
    currentMonth.expenses.forEach((expense) => {
      grouped.set(expense.categoryId, (grouped.get(expense.categoryId) ?? 0) + expense.amount);
    });

    return [...grouped.entries()]
      .map(([categoryId, value]) => {
        const category = getCategoryById(categoryId);
        return {
          id: categoryId,
          name: category?.name ?? "Sin categoría",
          value,
          color: category?.color ?? "#7c6ff7",
          icon: category?.icon ?? "💸",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [currentMonth.expenses, getCategoryById]);
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-sm text-violet-200">Distribución mensual</p>
        <h2 className="font-display text-3xl text-white">Categorías</h2>
      </div>

      {data.length === 0 ? (
        <EmptyState
          title="Aún no hay gráfico"
          description="Cuando cargues gastos, el donut mostrará cómo se reparte tu mes."
        />
      ) : (
        <>
          <div className="relative h-72">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  animationDuration={650}
                  data={data}
                  dataKey="value"
                  innerRadius="62%"
                  outerRadius="86%"
                  paddingAngle={3}
                  stroke="rgba(15,15,20,0.9)"
                  strokeWidth={4}
                >
                  {data.map((entry) => (
                    <Cell fill={entry.color} key={entry.id} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1a1a24",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total</p>
                <p className="font-display text-3xl text-white">{formatCurrency(total)}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {data.map((item) => (
              <div className="flex items-center gap-3 text-sm" key={item.id}>
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="flex min-w-0 flex-1 items-center gap-2 text-slate-300">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="min-w-0 truncate">{item.name}</span>
                </span>
                <span className="font-semibold text-white">{formatCurrency(item.value)}</span>
                <span className="w-12 text-right text-slate-500">
                  {Math.round((item.value / total) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
