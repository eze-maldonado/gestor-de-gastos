"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth, getMonthKey } from "@/lib/date";
import { useExpenses } from "@/context/ExpenseContext";

export function MonthNavigator() {
  const { state, dispatch } = useExpenses();
  const isCurrentMonth = state.currentMonthKey === getMonthKey();

  return (
    <div className="mx-auto grid w-full max-w-[25rem] grid-cols-[2.75rem_minmax(12rem,1fr)_2.75rem] items-center gap-3 sm:max-w-[30rem] sm:grid-cols-[3rem_minmax(15rem,1fr)_3rem] sm:gap-4">
      <button
        aria-label="Mes anterior"
        className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/15 sm:size-12"
        onClick={() => dispatch({ type: "SHIFT_MONTH", amount: -1 })}
        type="button"
      >
        <ChevronLeft className="size-5" />
      </button>
      <div className="min-w-0 text-center">
        <p className="font-display text-3xl capitalize leading-tight text-white sm:text-4xl">
          {formatMonth(state.currentMonthKey)}
        </p>
        <button
          className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200 transition hover:text-white disabled:cursor-default disabled:text-slate-500"
          disabled={isCurrentMonth}
          onClick={() => dispatch({ type: "SET_MONTH", monthKey: getMonthKey() })}
          type="button"
        >
          Mes actual
        </button>
      </div>
      <button
        aria-label="Mes siguiente"
        className="grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-violet-300/40 hover:bg-violet-400/15 sm:size-12"
        onClick={() => dispatch({ type: "SHIFT_MONTH", amount: 1 })}
        type="button"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
