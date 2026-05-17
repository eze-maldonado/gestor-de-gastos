"use client";

import {
  CalendarClock,
  ChevronDown,
  PiggyBank,
  Plus,
  Target,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import { formatDate, todayInputValue } from "@/lib/date";
import {
  CURRENCY_OPTIONS,
  formatAmountInput,
  formatCurrency,
  parseAmountInput,
} from "@/lib/money";
import type { CurrencyCode, Expense, SavingsGoal } from "@/lib/types";
import { EmptyState } from "./EmptyState";

const currencyOrder: CurrencyCode[] = ["ARS", "USD", "EUR"];

function formatCurrencyTotals(totals: Partial<Record<CurrencyCode, number>>) {
  const value = currencyOrder
    .filter((currency) => totals[currency])
    .map((currency) => formatCurrency(totals[currency] ?? 0, currency))
    .join(" · ");

  return value || "Sin aportes";
}

function monthsUntil(targetDate?: string) {
  if (!targetDate) {
    return null;
  }

  const today = new Date();
  const target = new Date(`${targetDate}T12:00:00`);
  const millisecondsPerAverageMonth = 1000 * 60 * 60 * 24 * 30.44;
  const rawMonths = Math.ceil(
    (target.getTime() - today.getTime()) / millisecondsPerAverageMonth,
  );

  return Math.max(rawMonths, 1);
}

export function SavingsDashboard() {
  const { currentMonth, dispatch, getSavingsCategory, state } = useExpenses();
  const savingsCategory = getSavingsCategory();
  const [savingAmount, setSavingAmount] = useState("");
  const [savingCurrency, setSavingCurrency] = useState<CurrencyCode>(
    currentMonth.salaryCurrency,
  );
  const [savingDescription, setSavingDescription] = useState("");
  const [savingDate, setSavingDate] = useState(todayInputValue());
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalCurrency, setGoalCurrency] = useState<CurrencyCode>(
    currentMonth.salaryCurrency,
  );
  const [goalDate, setGoalDate] = useState("");

  useEffect(() => {
    setSavingCurrency(currentMonth.salaryCurrency);
    setGoalCurrency(currentMonth.salaryCurrency);
  }, [currentMonth.monthKey, currentMonth.salaryCurrency]);

  const allSavings = useMemo<Expense[]>(() => {
    if (!savingsCategory) {
      return [];
    }

    return Object.values(state.months)
      .flatMap((month) => month.expenses)
      .filter((expense) => expense.categoryId === savingsCategory.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [savingsCategory, state.months]);

  const currentSavings = useMemo(
    () =>
      allSavings.filter((expense) => expense.monthKey === currentMonth.monthKey),
    [allSavings, currentMonth.monthKey],
  );

  const totals = useMemo(
    () =>
      allSavings.reduce<Partial<Record<CurrencyCode, number>>>((acc, expense) => {
        acc[expense.currency] = (acc[expense.currency] ?? 0) + expense.amount;
        return acc;
      }, {}),
    [allSavings],
  );

  const monthlyTotals = useMemo(
    () =>
      currentSavings.reduce<Partial<Record<CurrencyCode, number>>>(
        (acc, expense) => {
          acc[expense.currency] = (acc[expense.currency] ?? 0) + expense.amount;
          return acc;
        },
        {},
      ),
    [currentSavings],
  );

  const addSaving = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = parseAmountInput(savingAmount);
    if (!amount || !savingsCategory) {
      return;
    }

    dispatch({
      type: "ADD_EXPENSE",
      expense: {
        amount,
        currency: savingCurrency,
        description: savingDescription.trim() || "Ahorro",
        categoryId: savingsCategory.id,
        savingsGoalId: selectedGoalId || undefined,
        date: savingDate,
      },
    });
    setSavingAmount("");
    setSavingDescription("");
    setSavingDate(todayInputValue());
    setSelectedGoalId("");
  };

  const addGoal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetAmount = parseAmountInput(goalAmount);
    if (!goalName.trim() || !targetAmount) {
      return;
    }

    dispatch({
      type: "ADD_SAVINGS_GOAL",
      goal: {
        name: goalName.trim(),
        targetAmount,
        currency: goalCurrency,
        targetDate: goalDate || undefined,
      },
    });
    setGoalName("");
    setGoalAmount("");
    setGoalDate("");
  };

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="glass-card min-w-0 overflow-hidden p-4 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-violet-200">Ahorros</p>
            <h2 className="font-display text-3xl text-white">Reserva mensual</h2>
          </div>
          <span className="grid size-11 place-items-center rounded-lg bg-emerald-400/15 text-emerald-100">
            <PiggyBank className="size-6" />
          </span>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <SavingMetric label="Total ahorrado" value={formatCurrencyTotals(totals)} />
          <SavingMetric
            label="Este mes"
            value={formatCurrencyTotals(monthlyTotals)}
          />
        </div>

        <form
          className="rounded-lg border border-white/10 bg-black/20 p-4"
          onSubmit={addSaving}
        >
          <div className="mb-4 flex items-center gap-2 text-white">
            <Plus className="size-4 text-emerald-200" />
            <h3 className="font-semibold">Nuevo ahorro</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="label">Importe</span>
              <div className="grid grid-cols-[minmax(0,1fr)_5.25rem] gap-2">
                <input
                  className="field"
                  inputMode="decimal"
                  onChange={(event) =>
                    setSavingAmount(formatAmountInput(event.target.value))
                  }
                  pattern="[0-9.,]*"
                  placeholder="50.000"
                  required
                  type="text"
                  value={savingAmount}
                />
                <CurrencySelect
                  onChange={setSavingCurrency}
                  value={savingCurrency}
                />
              </div>
            </label>
            <label>
              <span className="label">Fecha</span>
              <input
                className="field"
                onChange={(event) => setSavingDate(event.target.value)}
                required
                type="date"
                value={savingDate}
              />
            </label>
            <label className="sm:col-span-2">
              <span className="label">Meta asociada</span>
              <div className="relative">
                <select
                  className="field appearance-none pr-11"
                  onChange={(event) => {
                    const goalId = event.target.value;
                    const goal = state.savingsGoals.find((item) => item.id === goalId);
                    setSelectedGoalId(goalId);
                    if (goal) {
                      setSavingCurrency(goal.currency);
                    }
                  }}
                  value={selectedGoalId}
                >
                  <option value="">Sin meta, ahorro normal</option>
                  {state.savingsGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name} · {goal.currency}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              </div>
            </label>
            <label className="sm:col-span-2">
              <span className="label">Nombre</span>
              <input
                className="field"
                onChange={(event) => setSavingDescription(event.target.value)}
                placeholder="Fondo de emergencia, viaje, inversión..."
                type="text"
                value={savingDescription}
              />
            </label>
          </div>
          <button className="button-primary mt-4 justify-center" type="submit">
            <Plus className="size-4" />
            Agregar ahorro
          </button>
        </form>

        <div className="mt-5">
          <h3 className="mb-3 font-semibold text-white">Aportes recientes</h3>
          {currentSavings.length === 0 ? (
            <EmptyState
              title="Sin ahorros este mes"
              description="Crea un aporte acá o usa la categoría Ahorro al cargar un gasto."
            />
          ) : (
            <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {currentSavings.map((saving) => (
                <article
                  className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-white/8 bg-white/[0.035] p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                  key={saving.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">
                      {saving.description || "Ahorro"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {formatDate(saving.date)}
                      {saving.savingsGoalId
                        ? ` · ${
                            state.savingsGoals.find(
                              (goal) => goal.id === saving.savingsGoalId,
                            )?.name ?? "Meta eliminada"
                          }`
                        : ""}
                    </p>
                  </div>
                  <p className="col-span-2 min-w-0 break-words font-bold text-white sm:col-auto sm:text-right">
                    {formatCurrency(saving.amount, saving.currency)}
                  </p>
                  <button
                    aria-label="Eliminar ahorro"
                    className="icon-button text-red-200 hover:border-red-300/30 hover:bg-red-500/15"
                    onClick={() =>
                      dispatch({
                        type: "DELETE_EXPENSE",
                        id: saving.id,
                        monthKey: saving.monthKey,
                      })
                    }
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="glass-card min-w-0 overflow-hidden p-4 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-violet-200">Metas</p>
            <h2 className="font-display text-3xl text-white">Objetivos de ahorro</h2>
          </div>
          <span className="grid size-11 place-items-center rounded-lg bg-violet-400/15 text-violet-100">
            <Target className="size-6" />
          </span>
        </div>

        <form
          className="mb-5 rounded-lg border border-white/10 bg-black/20 p-4"
          onSubmit={addGoal}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="label">Meta</span>
              <input
                className="field"
                onChange={(event) => setGoalName(event.target.value)}
                placeholder="Viaje, auto, reserva..."
                required
                type="text"
                value={goalName}
              />
            </label>
            <label>
              <span className="label">Objetivo</span>
              <div className="grid grid-cols-[minmax(0,1fr)_5.25rem] gap-2">
                <input
                  className="field"
                  inputMode="decimal"
                  onChange={(event) =>
                    setGoalAmount(formatAmountInput(event.target.value))
                  }
                  pattern="[0-9.,]*"
                  placeholder="1.500"
                  required
                  type="text"
                  value={goalAmount}
                />
                <CurrencySelect onChange={setGoalCurrency} value={goalCurrency} />
              </div>
            </label>
            <label className="sm:col-span-2">
              <span className="label">Fecha objetivo</span>
              <input
                className="field"
                onChange={(event) => setGoalDate(event.target.value)}
                type="date"
                value={goalDate}
              />
            </label>
          </div>
          <button className="button-primary mt-4 justify-center" type="submit">
            <Target className="size-4" />
            Crear meta
          </button>
        </form>

        {state.savingsGoals.length === 0 ? (
          <EmptyState
            title="Todavía no hay metas"
            description="Define un objetivo y la app calculará el aporte mensual necesario."
          />
        ) : (
          <div className="space-y-3">
            {state.savingsGoals.map((goal) => (
              <GoalCard
                goal={goal}
                key={goal.id}
                savedAmount={allSavings
                  .filter(
                    (saving) =>
                      saving.savingsGoalId === goal.id &&
                      saving.currency === goal.currency,
                  )
                  .reduce((sum, saving) => sum + saving.amount, 0)}
                onDelete={() =>
                  dispatch({ type: "DELETE_SAVINGS_GOAL", id: goal.id })
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CurrencySelect({
  onChange,
  value,
}: {
  onChange: (value: CurrencyCode) => void;
  value: CurrencyCode;
}) {
  return (
    <div className="relative min-w-0">
      <select
        aria-label="Moneda"
        className="field appearance-none px-2 pr-7 text-sm font-bold"
        onChange={(event) => onChange(event.target.value as CurrencyCode)}
        value={value}
      >
        {CURRENCY_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function SavingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/8 bg-white/[0.035] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 break-words text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function GoalCard({
  goal,
  onDelete,
  savedAmount,
}: {
  goal: SavingsGoal;
  onDelete: () => void;
  savedAmount: number;
}) {
  const progress = goal.targetAmount > 0 ? (savedAmount / goal.targetAmount) * 100 : 0;
  const boundedProgress = Math.min(progress, 100);
  const remaining = Math.max(goal.targetAmount - savedAmount, 0);
  const monthCount = monthsUntil(goal.targetDate);
  const monthlyNeed = monthCount ? remaining / monthCount : null;

  return (
    <article className="min-w-0 rounded-lg border border-white/8 bg-white/[0.035] p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-white">{goal.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
            <CalendarClock className="size-3.5" />
            {goal.targetDate ? formatDate(goal.targetDate) : "Sin fecha definida"}
          </p>
        </div>
        <button
          aria-label="Eliminar meta"
          className="icon-button text-red-200 hover:border-red-300/30 hover:bg-red-500/15"
          onClick={onDelete}
          type="button"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Progreso
          </p>
          <p className="font-display text-3xl text-white">
            {Math.round(progress)}%
          </p>
        </div>
        <p className="break-words text-sm text-slate-300 sm:text-right">
          {formatCurrency(savedAmount, goal.currency)} de{" "}
          {formatCurrency(goal.targetAmount, goal.currency)}
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-emerald-400 transition-all duration-700"
          style={{ width: `${boundedProgress}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-white/8 bg-black/15 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Falta
          </p>
          <p className="mt-1 font-semibold text-white">
            {formatCurrency(remaining, goal.currency)}
          </p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/15 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Aporte mensual para llegar al objetivo
          </p>
          <p className="mt-1 font-semibold text-white">
            {monthlyNeed === null
              ? "Indeterminado"
              : formatCurrency(monthlyNeed, goal.currency)}
          </p>
        </div>
      </div>
    </article>
  );
}
