"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/money";
import type { Expense } from "@/lib/types";
import { AddExpenseModal } from "./AddExpenseModal";
import { EmptyState } from "./EmptyState";

export function ExpenseList() {
  const { currentExpenses, dispatch, getCategoryById } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openCreate = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-violet-200">Movimientos</p>
          <h2 className="font-display text-3xl text-white">Gastos del mes</h2>
        </div>
        <button className="button-primary" onClick={openCreate} type="button">
          <Plus className="size-4" />
          Agregar
        </button>
      </div>

      {currentExpenses.length === 0 ? (
        <EmptyState
          title="Sin gastos todavía"
          description="Agrega tu primer movimiento para ver el balance y los gráficos del mes."
        />
      ) : (
        <div className="space-y-3">
          {currentExpenses.map((expense) => {
            const category = getCategoryById(expense.categoryId);
            return (
              <article
                className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-3 transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-white/[0.06] sm:grid-cols-[3rem_minmax(0,1fr)_minmax(8.5rem,auto)_5rem]"
                key={expense.id}
              >
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-lg text-xl"
                  style={{
                    backgroundColor: `${category?.color ?? "#7c6ff7"}22`,
                    color: category?.color ?? "#7c6ff7",
                  }}
                >
                  {category?.icon ?? "💸"}
                </span>
                <div className="min-w-0">
                  <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-2">
                    <p className="min-w-0 truncate font-semibold text-white">
                      {expense.description || category?.name || "Gasto"}
                    </p>
                    <span className="max-w-full truncate rounded-full bg-white/8 px-2 py-1 text-xs text-slate-300 sm:max-w-36">
                      {category?.name ?? "Sin categoría"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{formatDate(expense.date)}</p>
                </div>
                <p className="col-start-3 row-start-1 text-right text-base font-bold text-white sm:col-auto sm:row-auto sm:text-lg">
                  {formatCurrency(expense.amount)}
                </p>
                <div className="col-span-3 flex justify-end gap-1 sm:col-auto">
                  <button
                    aria-label="Editar gasto"
                    className="icon-button"
                    onClick={() => {
                      setEditingExpense(expense);
                      setIsModalOpen(true);
                    }}
                    type="button"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label="Eliminar gasto"
                    className="icon-button text-red-200 hover:border-red-300/30 hover:bg-red-500/15"
                    onClick={() =>
                      dispatch({
                        type: "DELETE_EXPENSE",
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

      <AddExpenseModal
        expense={editingExpense}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
