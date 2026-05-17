"use client";

import {
  AlertTriangle,
  BadgeDollarSign,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { CURRENCY_OPTIONS, formatCurrency } from "@/lib/money";
import type { CurrencyCode } from "@/lib/types";

export function SalaryCard() {
  const { currentMonth, dispatch } = useExpenses();
  const [salary, setSalary] = useState(String(currentMonth.salary || ""));
  const [salaryCurrency, setSalaryCurrency] = useState<CurrencyCode>(
    currentMonth.salaryCurrency,
  );
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const total = useMemo(
    () =>
      currentMonth.expenses
        .filter((expense) => expense.currency === currentMonth.salaryCurrency)
        .reduce((sum, expense) => sum + expense.amount, 0),
    [currentMonth.expenses, currentMonth.salaryCurrency],
  );
  const remaining = currentMonth.salary - total;
  const spentPercent =
    currentMonth.salary > 0 ? Math.min((total / currentMonth.salary) * 100, 130) : 0;
  const isOverBudget = currentMonth.salary > 0 && total > currentMonth.salary;
  const hiddenAmount = `${currentMonth.salaryCurrency} •••••`;
  const visibleBalance = isBalanceHidden
    ? hiddenAmount
    : formatCurrency(remaining, currentMonth.salaryCurrency);
  const visibleSalary = isBalanceHidden
    ? hiddenAmount
    : formatCurrency(currentMonth.salary, currentMonth.salaryCurrency);
  const visibleTotal = isBalanceHidden
    ? hiddenAmount
    : formatCurrency(total, currentMonth.salaryCurrency);

  useEffect(() => {
    setSalary(String(currentMonth.salary || ""));
    setSalaryCurrency(currentMonth.salaryCurrency);
  }, [currentMonth.monthKey, currentMonth.salary, currentMonth.salaryCurrency]);

  return (
    <section className="glass-card overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-3 text-violet-100">
            <span className="grid size-11 place-items-center rounded-lg bg-violet-400/15">
              <BadgeDollarSign className="size-6" />
            </span>
            <div>
              <p className="text-sm text-slate-400">Balance disponible</p>
              <h2
                className={`font-display text-4xl leading-tight sm:text-5xl ${
                  isOverBudget ? "text-coral" : "text-white"
                }`}
              >
                {visibleBalance}
              </h2>
            </div>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            Gastaste {visibleTotal} de {visibleSalary} este mes.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 lg:w-auto lg:min-w-[21rem]">
          <button
            className="button-secondary justify-center whitespace-nowrap"
            onClick={() => setIsBalanceHidden((value) => !value)}
            type="button"
          >
            {isBalanceHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            {isBalanceHidden ? "Mostrar saldo" : "Ocultar saldo"}
          </button>
          <button
            className="button-secondary justify-center whitespace-nowrap"
            onClick={() => setIsEditingSalary((value) => !value)}
            type="button"
          >
            <Pencil className="size-4" />
            {currentMonth.salary > 0 ? "Editar ingreso" : "Cargar ingreso"}
          </button>
        </div>
      </div>

      {isEditingSalary ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-end">
            <label>
              <span className="label">Monto del mes</span>
              <input
                className="field"
                min="0"
                onChange={(event) => setSalary(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    dispatch({
                      type: "SET_SALARY",
                      salary: Number(salary) || 0,
                      currency: salaryCurrency,
                    });
                    setIsEditingSalary(false);
                  }
                }}
                placeholder="0"
                type="number"
                value={salary}
              />
            </label>
            <label>
              <span className="label">Moneda por defecto</span>
              <div className="relative">
                <select
                  className="field appearance-none pr-11"
                  onChange={(event) =>
                    setSalaryCurrency(event.target.value as CurrencyCode)
                  }
                  value={salaryCurrency}
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>
            <button
              className="button-primary justify-center"
              onClick={() => {
                dispatch({
                  type: "SET_SALARY",
                  salary: Number(salary) || 0,
                  currency: salaryCurrency,
                });
                setIsEditingSalary(false);
              }}
              type="button"
            >
              Guardar
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          <span>Uso del salario</span>
          <span>{Math.round(spentPercent)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/8">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOverBudget ? "bg-coral" : "bg-violet-400"
            }`}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>
      </div>

      {isOverBudget ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <AlertTriangle className="size-4 shrink-0" />
          Tus gastos superan el ingreso mensual por{" "}
          {isBalanceHidden
            ? hiddenAmount
            : formatCurrency(Math.abs(remaining), currentMonth.salaryCurrency)}
          .
        </div>
      ) : null}
    </section>
  );
}
