"use client";

import { ChevronDown, CreditCard, Landmark, Plus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { todayInputValue, toDateInputValue } from "@/lib/date";
import { createId } from "@/lib/id";
import {
  CURRENCY_OPTIONS,
  formatAmountInput,
  formatCurrency,
  parseAmountInput,
} from "@/lib/money";
import type { CreditCardName, CurrencyCode, Expense } from "@/lib/types";
import { CategoryForm } from "./CategoryForm";

interface AddExpenseModalProps {
  expense?: Expense | null;
  isOpen: boolean;
  onClose: () => void;
}

type PaymentMethod = "debit" | "credit";

export function AddExpenseModal({ expense, isOpen, onClose }: AddExpenseModalProps) {
  const { state, dispatch } = useExpenses();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("debit");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("ARS");
  const [installments, setInstallments] = useState("3");
  const [cardName, setCardName] = useState<CreditCardName>("visa");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const parsedAmount = parseAmountInput(amount);
  const parsedInstallments = Math.max(Number(installments) || 0, 0);
  const installmentAmount =
    paymentMethod === "credit" && parsedAmount > 0 && parsedInstallments > 0
      ? parsedAmount / parsedInstallments
      : 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setPaymentMethod("debit");
    setAmount(expense ? formatAmountInput(String(expense.amount)) : "");
    setCurrency(expense?.currency ?? "ARS");
    setInstallments("3");
    setCardName("visa");
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
    if (!parsedAmount || parsedAmount <= 0 || !categoryId) {
      return;
    }

    if (paymentMethod === "credit" && (!parsedInstallments || parsedInstallments <= 0)) {
      return;
    }

    const payload = {
      amount: parsedAmount,
      currency,
      description: description.trim(),
      categoryId,
      date,
    };

    if (expense) {
      dispatch({ type: "UPDATE_EXPENSE", expense: { ...expense, ...payload } });
    } else if (paymentMethod === "credit") {
      dispatch({
        type: "ADD_CREDIT_EXPENSE",
        expense: {
          totalAmount: parsedAmount,
          currency,
          installments: parsedInstallments,
          installmentAmount,
          description: description.trim(),
          categoryId,
          cardName,
          date,
        },
      });
    } else {
      dispatch({ type: "ADD_EXPENSE", expense: payload });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#050508]/88 px-3 pb-3 backdrop-blur-md sm:items-center sm:p-6">
      <form
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-2xl animate-slide-up overflow-y-auto rounded-lg border border-white/10 bg-[#14141e] p-5 shadow-2xl shadow-black/60 sm:max-h-[calc(100vh-3rem)] sm:p-6"
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

        {!expense ? (
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <button
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                paymentMethod === "debit"
                  ? "border-violet-300/45 bg-violet-400/15 text-white"
                  : "border-white/8 bg-white/[0.035] text-slate-300 hover:border-white/16 hover:bg-white/[0.055]"
              }`}
              onClick={() => setPaymentMethod("debit")}
              type="button"
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                  paymentMethod === "debit" ? "border-violet-200" : "border-slate-500"
                }`}
              >
                {paymentMethod === "debit" ? (
                  <span className="size-2.5 rounded-full bg-violet-200" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold">
                  <Landmark className="size-4" />
                  Débito
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  Impacta en el balance mensual
                </span>
              </span>
            </button>
            <button
              className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                paymentMethod === "credit"
                  ? "border-violet-300/45 bg-violet-400/15 text-white"
                  : "border-white/8 bg-white/[0.035] text-slate-300 hover:border-white/16 hover:bg-white/[0.055]"
              }`}
              onClick={() => setPaymentMethod("credit")}
              type="button"
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                  paymentMethod === "credit" ? "border-violet-200" : "border-slate-500"
                }`}
              >
                {paymentMethod === "credit" ? (
                  <span className="size-2.5 rounded-full bg-violet-200" />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-semibold">
                  <CreditCard className="size-4" />
                  Tarjeta de crédito
                </span>
                <span className="mt-0.5 block text-xs text-slate-400">
                  Se guarda separado del sueldo
                </span>
              </span>
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">
              {paymentMethod === "credit" && !expense ? "Precio total" : "Importe"}
            </span>
            <div className="grid grid-cols-[minmax(0,1fr)_5.25rem] gap-2">
              <input
                autoFocus
                className="field"
                inputMode="decimal"
                onChange={(event) => setAmount(formatAmountInput(event.target.value))}
                pattern="[0-9.,]*"
                placeholder="12.500"
                required
                type="text"
                value={amount}
              />
              <div className="relative">
                <select
                  aria-label="Moneda"
                  className="field appearance-none px-2 pr-7 text-sm font-bold"
                  onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                  value={currency}
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
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

          {paymentMethod === "credit" && !expense ? (
            <>
              <label>
                <span className="label">Tarjeta</span>
                <div className="grid grid-cols-2 gap-2">
                  {(["visa", "master"] as CreditCardName[]).map((card) => (
                    <button
                      className={`rounded-lg border px-3 py-3 text-sm font-bold uppercase tracking-[0.12em] transition ${
                        cardName === card
                          ? "border-violet-300/45 bg-violet-400/15 text-white"
                          : "border-white/8 bg-white/[0.035] text-slate-400 hover:border-white/16 hover:text-white"
                      }`}
                      key={card}
                      onClick={() => setCardName(card)}
                      type="button"
                    >
                      {card === "visa" ? "Visa" : "Master"}
                    </button>
                  ))}
                </div>
              </label>
              <label>
                <span className="label">Cuotas</span>
                <input
                  className="field"
                  min="1"
                  onChange={(event) => setInstallments(event.target.value)}
                  required
                  type="number"
                  value={installments}
                />
              </label>
              <div className="sm:col-span-2 rounded-lg border border-violet-300/20 bg-violet-400/10 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-200">
                  Valor por cuota
                </p>
                <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <p className="font-display text-3xl text-white">
                    {formatCurrency(installmentAmount, currency)}
                  </p>
                  <p className="text-sm text-slate-300">
                    {parsedInstallments || 0} cuotas de{" "}
                    {formatCurrency(installmentAmount, currency)}
                  </p>
                </div>
              </div>
            </>
          ) : null}

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
