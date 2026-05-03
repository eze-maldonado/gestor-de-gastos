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
import type { AppState, Category, Expense, MonthData } from "@/lib/types";
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
      type: "ADD_CATEGORY";
      category: Omit<Category, "id" | "isDefault"> & { id?: string };
    }
  | { type: "UPDATE_CATEGORY"; category: Category }
  | { type: "DELETE_CATEGORY"; id: string };

interface ExpenseContextValue {
  state: AppState;
  currentMonth: MonthData;
  currentExpenses: Expense[];
  dispatch: Dispatch<Action>;
  getCategoryById: (id: string) => Category | undefined;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(
  undefined,
);

function makeMonth(monthKey: string): MonthData {
  return { monthKey, salary: 0, expenses: [] };
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
  return ensureMonth(nextState, currentMonthKey);
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

  const value = useMemo<ExpenseContextValue>(
    () => ({
      state: normalizedState,
      currentMonth,
      currentExpenses,
      dispatch,
      getCategoryById: (id) =>
        normalizedState.categories.find((category) => category.id === id),
    }),
    [currentExpenses, currentMonth, normalizedState],
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
