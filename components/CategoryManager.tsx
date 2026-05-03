"use client";

import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import type { Category } from "@/lib/types";
import { CategoryForm } from "./CategoryForm";

export function CategoryManager() {
  const { state, dispatch } = useExpenses();
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const expenseCounts = useMemo(() => {
    const counts = new Map<string, number>();
    Object.values(state.months).forEach((month) => {
      month.expenses.forEach((expense) => {
        counts.set(expense.categoryId, (counts.get(expense.categoryId) ?? 0) + 1);
      });
    });
    return counts;
  }, [state.months]);

  const closeForm = () => {
    setIsCreating(false);
    setEditing(null);
  };

  const deleteCategory = (category: Category) => {
    if (category.isDefault) {
      return;
    }

    const count = expenseCounts.get(category.id) ?? 0;
    if (
      count > 0 &&
      !window.confirm(
        `La categoría "${category.name}" tiene ${count} gasto(s). Si la eliminas, esos gastos quedarán sin categoría visible.`,
      )
    ) {
      return;
    }

    dispatch({ type: "DELETE_CATEGORY", id: category.id });
  };

  return (
    <section className="glass-card p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-violet-200">Personalización</p>
          <h2 className="font-display text-3xl text-white">Categorías</h2>
        </div>
        <button
          className="button-primary"
          onClick={() => {
            setEditing(null);
            setIsCreating(true);
          }}
          type="button"
        >
          <Plus className="size-4" />
          Nueva
        </button>
      </div>

      {isCreating || editing ? (
        <div className="mb-5">
          <CategoryForm
            category={editing}
            onCancel={closeForm}
            onSubmit={(category) => {
              if ("id" in category) {
                dispatch({ type: "UPDATE_CATEGORY", category });
              } else {
                dispatch({ type: "ADD_CATEGORY", category });
              }
              closeForm();
            }}
          />
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {state.categories.map((category) => (
          <article
            className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-3 transition hover:border-violet-300/30 hover:bg-white/[0.06]"
            key={category.id}
          >
            <span
              className="grid size-11 shrink-0 place-items-center rounded-lg text-xl"
              style={{ backgroundColor: `${category.color}22`, color: category.color }}
            >
              {category.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-white">{category.name}</p>
              <p className="text-xs text-slate-400">
                {expenseCounts.get(category.id) ?? 0} gastos
              </p>
            </div>
            {category.isDefault ? (
              <span className="grid size-9 place-items-center rounded-lg bg-white/5 text-slate-400">
                <Lock className="size-4" />
              </span>
            ) : (
              <div className="flex gap-1">
                <button
                  aria-label="Editar categoría"
                  className="icon-button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditing(category);
                  }}
                  type="button"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  aria-label="Eliminar categoría"
                  className="icon-button text-red-200 hover:border-red-300/30 hover:bg-red-500/15"
                  onClick={() => deleteCategory(category)}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
