"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { todayInputValue, toDateInputValue } from "@/lib/date";
import { createId } from "@/lib/id";
import type { Expense } from "@/lib/types";
import { CategoryForm } from "./CategoryForm";

interface AddExpenseModalProps {
  expense?: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddExpenseModal({ expense, isOpen, onClose }: AddExpenseModalProps) {
  const { state, dispatch } = useExpenses();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setAmount(expense ? String(expense.amount) : "");
    setDescription(expense?.description ?? "");
    setCategoryId(expense?.categoryId ?? state.categories[0]?.id ?? "");
    setDate(expense ? toDateInputValue(expense.date) : todayInputValue());
    setIsCreatingCategory(false);
  }, [expense, isOpen, state.categories]);

  if (!isOpen) {
    return null;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0 || !categoryId) {
      return;
    }

    const payload = {
      amount: parsedAmount,
      description: description.trim(),
      categoryId,
      date,
    };

    if (expense) {
      dispatch({ type: "UPDATE_EXPENSE", expense: { ...expense, ...payload } });
    } else {
      dispatch({ type: "ADD_EXPENSE", expense: payload });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#050508]/88 px-3 pb-3 backdrop-blur-md sm:items-center sm:p-6">
      <form
        className="w-full max-w-xl animate-slide-up rounded-lg border border-white/10 bg-[#14141e] p-5 shadow-2xl shadow-black/60 sm:p-6"
        onSubmit={submit}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-violet-200">
              {expense ? "Editar movimiento" : "Nuevo movimiento"}
            </p>
            <h2 className="font-display text-3xl text-white">
              {expense ? "Actualizar gasto" : "Agregar gasto"}
            </h2>
          </div>
          <button
            aria-label="Cerrar"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-1">
            <span className="label">Importe</span>
            <input
              autoFocus
              className="field"
              min="1"
              onChange={(event) => setAmount(event.target.value)}
              placeholder="12500"
              required
              type="number"
              value={amount}
            />
          </label>
          <label className="sm:col-span-1">
            <span className="label">Fecha</span>
            <input
              className="field"
              onChange={(event) => setDate(event.target.value)}
              required
              type="date"
              value={date}
            />
          </label>
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="label mb-0">Categoría</span>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-violet-100 transition hover:border-violet-300/40 hover:bg-violet-400/15"
                onClick={() => setIsCreatingCategory((value) => !value)}
                type="button"
              >
                <Plus className="size-3.5" />
                Crear categoría
              </button>
            </div>
            <div className="relative">
              <select
                className="field appearance-none pr-11"
                onChange={(event) => setCategoryId(event.target.value)}
                required
                value={categoryId}
              >
                {state.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          {isCreatingCategory ? (
            <div className="sm:col-span-2">
              <CategoryForm
                renderAsForm={false}
                onCancel={() => setIsCreatingCategory(false)}
                onSubmit={(category) => {
                  const nextId = createId();
                  dispatch({
                    type: "ADD_CATEGORY",
                    category: { ...category, id: nextId },
                  });
                  setCategoryId(nextId);
                  setIsCreatingCategory(false);
                }}
              />
            </div>
          ) : null}
          <label className="sm:col-span-2">
            <span className="label">Descripción</span>
            <input
              className="field"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Supermercado, alquiler, café..."
              type="text"
              value={description}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="button-secondary" onClick={onClose} type="button">
            Cancelar
          </button>
          <button className="button-primary" type="submit">
            {expense ? "Guardar" : "Agregar"}
          </button>
        </div>
      </form>
    </div>
  );
}
