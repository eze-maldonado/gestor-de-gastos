"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/money";
import type { Category, Expense } from "@/lib/types";
import { AddExpenseModal } from "./AddExpenseModal";
import { EmptyState } from "./EmptyState";

const PREVIEW_EXPENSES_PER_CATEGORY = 2;

interface ExpenseGroup {
  category: Pick<Category, "id" | "name" | "icon" | "color">;
  expenses: Expense[];
  total: number;
}

export function ExpenseList() {
  const { currentExpenses, dispatch, getCategoryById } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    () => new Set(),
  );

  const expenseGroups = useMemo<ExpenseGroup[]>(() => {
    const grouped = new Map<string, ExpenseGroup>();

    currentExpenses.forEach((expense) => {
      const category = getCategoryById(expense.categoryId);
      const categoryId = category?.id ?? expense.categoryId;
      const group = grouped.get(categoryId);

      if (group) {
        group.expenses.push(expense);
        group.total += expense.amount;
        return;
      }

      grouped.set(categoryId, {
        category: {
          id: categoryId,
          name: category?.name ?? "Sin categoría",
          icon: category?.icon ?? "💸",
          color: category?.color ?? "#7c6ff7",
        },
        expenses: [expense],
        total: expense.amount,
      });
    });

    return [...grouped.values()].sort((a, b) => b.total - a.total);
  }, [currentExpenses, getCategoryById]);

  const openCreate = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
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
        <div className="max-h-[44rem] space-y-4 overflow-y-auto pr-1">
          {expenseGroups.map((group) => {
            const isExpanded = expandedCategoryIds.has(group.category.id);
            const isCollapsible = group.expenses.length > 1;
            const visibleExpenses = isExpanded || !isCollapsible
              ? group.expenses
              : group.expenses.slice(0, PREVIEW_EXPENSES_PER_CATEGORY);

            return (
              <div
                aria-expanded={isCollapsible ? isExpanded : undefined}
                className={`rounded-lg border border-white/8 bg-white/[0.025] p-3 transition ${
                  isCollapsible
                    ? "cursor-pointer hover:border-violet-300/30 hover:bg-white/[0.04]"
                    : ""
                }`}
                key={group.category.id}
                onClick={() => {
                  if (isCollapsible) {
                    toggleCategory(group.category.id);
                  }
                }}
                onKeyDown={(event) => {
                  if (!isCollapsible) {
                    return;
                  }

                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleCategory(group.category.id);
                  }
                }}
                role={isCollapsible ? "button" : undefined}
                tabIndex={isCollapsible ? 0 : undefined}
              >
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="grid size-12 shrink-0 place-items-center rounded-lg text-xl"
                    style={{
                      backgroundColor: `${group.category.color}22`,
                      color: group.category.color,
                    }}
                  >
                    {group.category.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <h3 className="min-w-0 truncate font-semibold text-white">
                        {group.category.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-white/8 px-2 py-1 text-xs text-slate-300">
                        {group.expenses.length}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">
                      {formatCurrency(group.total)}
                    </p>
                  </div>
                  {isCollapsible ? (
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/[0.035] text-slate-300">
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </span>
                  ) : null}
                </div>

                <div
                  className={`relative space-y-2 overflow-hidden transition-[max-height] duration-300 ${
                    isCollapsible && !isExpanded
                      ? "max-h-[10.5rem] sm:max-h-[6.75rem]"
                      : "max-h-[60rem]"
                  }`}
                >
                  {visibleExpenses.map((expense) => (
                    <article
                      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-3 transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-white/[0.06] sm:grid-cols-[minmax(0,1fr)_minmax(8.5rem,auto)_5rem]"
                      key={expense.id}
                    >
                      <div className="min-w-0">
                        <p className="min-w-0 truncate font-semibold text-white">
                          {expense.description || group.category.name || "Gasto"}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {formatDate(expense.date)}
                        </p>
                      </div>
                      <p className="text-right text-base font-bold text-white sm:text-lg">
                        {formatCurrency(expense.amount)}
                      </p>
                      <div className="col-span-2 flex justify-end gap-1 sm:col-auto">
                        <button
                          aria-label="Editar gasto"
                          className="icon-button"
                          onClick={(event) => {
                            event.stopPropagation();
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
                          onClick={(event) => {
                            event.stopPropagation();
                            dispatch({
                              type: "DELETE_EXPENSE",
                              id: expense.id,
                              monthKey: expense.monthKey,
                            });
                          }}
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </article>
                  ))}
                  {isCollapsible && !isExpanded ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#191923] to-transparent" />
                  ) : null}
                </div>
              </div>
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
