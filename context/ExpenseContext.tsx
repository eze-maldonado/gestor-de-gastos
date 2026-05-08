"use client";

import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { DEFAULT_CATEGORIES, STORAGE_KEY } from "@/lib/constants";
import { getMonthKey, monthKeyFromDateInput, shiftMonth } from "@/lib/date";
import { createId } from "@/lib/id";
import type { AppState, Category, CreditExpense, Expense, MonthData } from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "SET_MONTH"; monthKey: string }
  | { type: "SHIFT_MONTH"; amount: number }
  | { type: "SET_SALARY"; salary: number }
  | { type: "ADD_EXPENSE"; expense: Omit<Expense, "id" | "monthKey"> }
  | { type: "UPDATE_EXPENSE"; expense: Expense }
  | { type: "DELETE_EXPENSE"; id: string; monthKey: string }
  | {
      type: "ADD_CREDIT_EXPENSE";
      expense: Omit<
        CreditExpense,
        "id" | "monthKey" | "purchaseId" | "installmentNumber" | "remainingInstallments"
      >;
    }
  | { type: "DELETE_CREDIT_EXPENSE"; id: string; monthKey: string }
  | {
      type: "ADD_CATEGORY";
      category: Omit<Category, "id" | "isDefault"> & { id?: string };
    }
  | { type: "UPDATE_CATEGORY"; category: Category }
  | { type: "DELETE_CATEGORY"; id: string };

interface ExpenseContextValue {
  state: AppState;
  currentMonth: MonthData;
  currentExpenses: Expense[];
  currentCreditExpenses: CreditExpense[];
  dispatch: Dispatch<Action>;
  getCategoryById: (id: string) => Category | undefined;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(
  undefined,
);

function makeMonth(monthKey: string): MonthData {
  return { monthKey, salary: 0, expenses: [], creditExpenses: [] };
}

function shiftDateInput(value: string, amount: number): string {
  const [year, month, day] = value.split("-").map(Number);
  const targetMonth = month - 1 + amount;
  const lastDayOfTargetMonth = new Date(year, targetMonth + 1, 0).getDate();
  const date = new Date(year, targetMonth, Math.min(day || 1, lastDayOfTargetMonth));
  return date.toISOString().slice(0, 10);
}

function ensureMonth(state: AppState, monthKey = state.currentMonthKey) {
  if (state.months[monthKey]) {
    return state;
  }

  return {
    ...state,
    months: {
      ...state.months,
      [monthKey]: makeMonth(monthKey),
    },
  };
}

function makeInitialState(): AppState {
  const currentMonthKey = getMonthKey();
  const categories = DEFAULT_CATEGORIES.map((category) => ({
    ...category,
    id: createId(),
    isDefault: true,
  }));

  return {
    categories,
    currentMonthKey,
    months: {
      [currentMonthKey]: makeMonth(currentMonthKey),
    },
  };
}

function normalizeState(state: AppState): AppState {
  const currentMonthKey = state.currentMonthKey || getMonthKey();
  const nextState =
    state.currentMonthKey === currentMonthKey ? state : { ...state, currentMonthKey };
  const ensuredState = ensureMonth(nextState, currentMonthKey);
  const months = Object.fromEntries(
    Object.entries(ensuredState.months).map(([monthKey, month]) => [
      monthKey,
      {
        ...month,
        expenses: month.expenses.map((expense) => ({
          ...expense,
          currency: expense.currency ?? "ARS",
        })),
        creditExpenses: (month.creditExpenses ?? []).map((expense) => ({
          ...expense,
          currency: expense.currency ?? "ARS",
          purchaseId: expense.purchaseId ?? expense.id,
          installmentNumber: expense.installmentNumber ?? 1,
          remainingInstallments: expense.remainingInstallments ?? expense.installments,
        })),
      },
    ]),
  );

  return { ...ensuredState, months };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return normalizeState(action.state);
    case "SET_MONTH":
      return ensureMonth({ ...state, currentMonthKey: action.monthKey }, action.monthKey);
    case "SHIFT_MONTH": {
      const monthKey = shiftMonth(state.currentMonthKey, action.amount);
      return ensureMonth({ ...state, currentMonthKey: monthKey }, monthKey);
    }
    case "SET_SALARY": {
      const next = ensureMonth(state);
      const month = next.months[next.currentMonthKey];
      return {
        ...next,
        months: {
          ...next.months,
          [month.monthKey]: { ...month, salary: action.salary },
        },
      };
    }
    case "ADD_EXPENSE": {
      const monthKey = monthKeyFromDateInput(action.expense.date);
      const next = ensureMonth(state, monthKey);
      const month = next.months[monthKey];
      const expense: Expense = {
        ...action.expense,
        id: createId(),
        monthKey,
      };

      return {
        ...next,
        months: {
          ...next.months,
          [monthKey]: { ...month, expenses: [expense, ...month.expenses] },
        },
      };
    }
    case "UPDATE_EXPENSE": {
      const nextMonthKey = monthKeyFromDateInput(action.expense.date);
      const previousMonth = state.months[action.expense.monthKey];
      let next = ensureMonth(state, nextMonthKey);
      const movedExpense = { ...action.expense, monthKey: nextMonthKey };

      if (previousMonth && action.expense.monthKey !== nextMonthKey) {
        next = {
          ...next,
          months: {
            ...next.months,
            [previousMonth.monthKey]: {
              ...previousMonth,
              expenses: previousMonth.expenses.filter(
                (expense) => expense.id !== action.expense.id,
              ),
            },
          },
        };
      }

      const targetMonth = next.months[nextMonthKey];
      const existsInTarget = targetMonth.expenses.some(
        (expense) => expense.id === action.expense.id,
      );
      const targetExpenses = existsInTarget
        ? targetMonth.expenses.map((expense) =>
            expense.id === action.expense.id ? movedExpense : expense,
          )
        : [movedExpense, ...targetMonth.expenses];

      return {
        ...next,
        months: {
          ...next.months,
          [nextMonthKey]: { ...targetMonth, expenses: targetExpenses },
        },
      };
    }
    case "DELETE_EXPENSE": {
      const month = state.months[action.monthKey];
      if (!month) {
        return state;
      }

      return {
        ...state,
        months: {
          ...state.months,
          [action.monthKey]: {
            ...month,
            expenses: month.expenses.filter((expense) => expense.id !== action.id),
          },
        },
      };
    }
    case "ADD_CREDIT_EXPENSE": {
      const monthKey = monthKeyFromDateInput(action.expense.date);
      const purchaseId = createId();
      const installments = Math.max(action.expense.installments, 1);
      let next = ensureMonth(state, monthKey);

      for (let index = 0; index < installments; index += 1) {
        const installmentMonthKey = shiftMonth(monthKey, index);
        next = ensureMonth(next, installmentMonthKey);
        const month = next.months[installmentMonthKey];
        const expense: CreditExpense = {
          ...action.expense,
          id: createId(),
          purchaseId,
          installments,
          installmentNumber: index + 1,
          remainingInstallments: installments - index,
          date: shiftDateInput(action.expense.date, index),
          monthKey: installmentMonthKey,
        };

        next = {
          ...next,
          months: {
            ...next.months,
            [installmentMonthKey]: {
              ...month,
              creditExpenses: [expense, ...(month.creditExpenses ?? [])],
            },
          },
        };
      }

      return next;
    }
    case "DELETE_CREDIT_EXPENSE": {
      const month = state.months[action.monthKey];
      if (!month) {
        return state;
      }
      const targetExpense = (month.creditExpenses ?? []).find(
        (expense) => expense.id === action.id,
      );
      const targetPurchaseId = targetExpense?.purchaseId ?? action.id;
      const months = Object.fromEntries(
        Object.entries(state.months).map(([monthKey, monthData]) => [
          monthKey,
          {
            ...monthData,
            creditExpenses: (monthData.creditExpenses ?? []).filter(
              (expense) =>
                expense.id !== action.id && expense.purchaseId !== targetPurchaseId,
            ),
          },
        ]),
      );

      return {
        ...state,
        months,
      };
    }
    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [
          ...state.categories,
          { ...action.category, id: action.category.id ?? createId(), isDefault: false },
        ],
      };
    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.category.id ? action.category : category,
        ),
      };
    case "DELETE_CATEGORY": {
      const category = state.categories.find((item) => item.id === action.id);
      if (!category || category.isDefault) {
        return state;
      }

      return {
        ...state,
        categories: state.categories.filter((item) => item.id !== action.id),
      };
    }
    default:
      return state;
  }
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const initialState = useMemo(() => makeInitialState(), []);
  const [storedState, setStoredState, isHydrated] = useLocalStorage<AppState>(
    STORAGE_KEY,
    initialState,
  );
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const [state, dispatchBase] = useReducer(
    reducer,
    normalizeState(storedState),
  );

  const dispatch: Dispatch<Action> = (action) => {
    dispatchBase(action);
  };

  const normalizedState = useMemo(() => normalizeState(state), [state]);

  useEffect(() => {
    if (isHydrated && !hasLoadedStoredState) {
      dispatchBase({ type: "HYDRATE", state: storedState });
      setHasLoadedStoredState(true);
    }
  }, [hasLoadedStoredState, isHydrated, storedState]);

  useEffect(() => {
    if (hasLoadedStoredState) {
      setStoredState(normalizedState);
    }
  }, [hasLoadedStoredState, normalizedState, setStoredState]);

  const currentMonth = normalizedState.months[normalizedState.currentMonthKey];
  const currentExpenses = [...currentMonth.expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const currentCreditExpenses = [...currentMonth.creditExpenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const value = useMemo<ExpenseContextValue>(
    () => ({
      state: normalizedState,
      currentMonth,
      currentExpenses,
      currentCreditExpenses,
      dispatch,
      getCategoryById: (id) =>
        normalizedState.categories.find((category) => category.id === id),
    }),
    [currentCreditExpenses, currentExpenses, currentMonth, normalizedState],
  );

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within ExpenseProvider");
  }

  return context;
}
