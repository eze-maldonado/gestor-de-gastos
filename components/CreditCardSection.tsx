"use client";

import { CreditCard, ReceiptText, Trash2, WalletCards } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useExpenses } from "@/context/ExpenseContext";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/money";
import { EmptyState } from "./EmptyState";

interface ChartDatum {
  id: string;
  name: string;
  value: number;
  color: string;
  icon: string;
}

export function CreditCardSection() {
  const { currentCreditExpenses, dispatch, getCategoryById } = useExpenses();
  const chartData = useMemo<ChartDatum[]>(() => {
    const grouped = new Map<string, number>();
    currentCreditExpenses.forEach((expense) => {
      grouped.set(
        expense.categoryId,
        (grouped.get(expense.categoryId) ?? 0) + expense.installmentAmount,
      );
    });

    return [...grouped.entries()]
      .map(([categoryId, value]) => {
        const category = getCategoryById(categoryId);
        return {
          id: categoryId,
          name: category?.name ?? "Sin categoría",
          value,
          color: category?.color ?? "#7c6ff7",
          icon: category?.icon ?? "💳",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [currentCreditExpenses, getCategoryById]);

  const pendingBalance = currentCreditExpenses.reduce(
    (sum, expense) => sum + expense.installmentAmount * expense.remainingInstallments,
    0,
  );
  const monthlyInstallments = currentCreditExpenses.reduce(
    (sum, expense) => sum + expense.installmentAmount,
    0,
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="glass-card p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-violet-200">Crédito</p>
            <h2 className="font-display text-3xl text-white">Tarjetas</h2>
          </div>
          <span className="grid size-11 place-items-center rounded-lg bg-violet-400/15 text-violet-100">
            <CreditCard className="size-6" />
          </span>
        </div>

        {currentCreditExpenses.length === 0 ? (
          <EmptyState
            title="Sin compras en cuotas"
            description="Agrega un gasto y elegí tarjeta de crédito para verlo separado del balance mensual."
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <CreditMetric
                icon={<WalletCards className="size-5" />}
                label="Saldo pendiente"
                value={formatCurrency(pendingBalance)}
              />
              <CreditMetric
                icon={<ReceiptText className="size-5" />}
                label="Cuotas del mes"
                value={formatCurrency(monthlyInstallments)}
              />
              <CreditMetric
                icon={<CreditCard className="size-5" />}
                label="Compras"
                value={String(currentCreditExpenses.length)}
              />
            </div>

            <div className="relative mt-5 h-72">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    animationDuration={650}
                    data={chartData}
                    dataKey="value"
                    innerRadius="62%"
                    outerRadius="86%"
                    paddingAngle={3}
                    stroke="rgba(15,15,20,0.9)"
                    strokeWidth={4}
                  >
                    {chartData.map((entry) => (
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
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Este mes
                  </p>
                  <p className="font-display text-3xl text-white">
                    {formatCurrency(monthlyInstallments)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {chartData.map((item) => (
                <div className="flex items-center gap-3 text-sm" key={item.id}>
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="flex min-w-0 flex-1 items-center gap-2 text-slate-300">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="min-w-0 truncate">{item.name}</span>
                  </span>
                  <span className="font-semibold text-white">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="glass-card p-5 sm:p-6">
        <div className="mb-5">
          <p className="text-sm text-violet-200">Compras financiadas</p>
          <h2 className="font-display text-3xl text-white">Cuotas activas</h2>
        </div>

        {currentCreditExpenses.length === 0 ? (
          <EmptyState
            title="Todavía no hay cuotas"
            description="Las compras con tarjeta quedan acá para que no mezclen tu gasto diario."
          />
        ) : (
          <div className="max-h-[44rem] space-y-3 overflow-y-auto pr-1">
            {currentCreditExpenses.map((expense) => {
              const category = getCategoryById(expense.categoryId);

              return (
                <article
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-white/[0.06] sm:grid-cols-[minmax(0,1fr)_minmax(10rem,auto)_5rem]"
                  key={expense.id}
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className="grid size-9 place-items-center rounded-lg text-lg"
                        style={{
                          backgroundColor: `${category?.color ?? "#7c6ff7"}22`,
                          color: category?.color ?? "#7c6ff7",
                        }}
                      >
                        {category?.icon ?? "💳"}
                      </span>
                      <span className="rounded-full bg-white/8 px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
                        {expense.cardName === "visa" ? "Visa" : "Master"}
                      </span>
                      <span className="rounded-full bg-violet-400/15 px-2 py-1 text-xs font-semibold text-violet-100">
                        {expense.installments} cuotas
                      </span>
                      <span className="rounded-full bg-white/8 px-2 py-1 text-xs font-semibold text-slate-300">
                        {expense.remainingInstallments} restantes
                      </span>
                    </div>
                    <h3 className="truncate font-semibold text-white">
                      {expense.description || category?.name || "Compra"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {category?.name ?? "Sin categoría"} · Cuota{" "}
                      {expense.installmentNumber} de {expense.installments} ·{" "}
                      {formatDate(expense.date)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-400">Por cuota</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(expense.installmentAmount)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Pendiente{" "}
                      {formatCurrency(
                        expense.installmentAmount * expense.remainingInstallments,
                      )}
                    </p>
                  </div>

                  <div className="col-span-2 flex justify-end sm:col-auto">
                    <button
                      aria-label="Eliminar compra en cuotas"
                      className="icon-button text-red-200 hover:border-red-300/30 hover:bg-red-500/15"
                      onClick={() =>
                        dispatch({
                          type: "DELETE_CREDIT_EXPENSE",
                          id: expense.id,
                          monthKey: expense.monthKey,
                        })
                      }
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CreditMetric({
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
