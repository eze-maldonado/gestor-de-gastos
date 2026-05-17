"use client";

import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_CATEGORIES, STORAGE_KEY } from "@/lib/constants";
import { getMonthKey, monthKeyFromDateInput, shiftMonth } from "@/lib/date";
import { db } from "@/lib/firebase";
import { createId } from "@/lib/id";
import type {
  AppState,
  Category,
  CreditExpense,
  CurrencyCode,
  Expense,
  FixedExpenseItem,
  MonthData,
  MonthlyBudgetControl,
  SavingsGoal,
} from "@/lib/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "SET_MONTH"; monthKey: string }
  | { type: "SHIFT_MONTH"; amount: number }
  | { type: "SET_SALARY"; salary: number; currency: CurrencyCode }
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
  | { type: "DELETE_CATEGORY"; id: string }
  | { type: "ADD_SAVINGS_GOAL"; goal: Omit<SavingsGoal, "id" | "createdAt"> }
  | { type: "UPDATE_SAVINGS_GOAL"; goal: SavingsGoal }
  | { type: "DELETE_SAVINGS_GOAL"; id: string }
  | {
      type: "SET_BUDGET_CONTROL_FIELD";
      monthKey: string;
      field: "montoDisponible" | "adelantosSueldo" | "tarjetaPersonalTotal";
      value: number;
    }
  | {
      type: "ADD_FIXED_EXPENSE_ITEM";
      monthKey: string;
      item: Omit<FixedExpenseItem, "id">;
    }
  | { type: "UPDATE_FIXED_EXPENSE_ITEM"; monthKey: string; item: FixedExpenseItem }
  | { type: "TOGGLE_FIXED_EXPENSE_STATUS"; monthKey: string; id: string }
  | { type: "DELETE_FIXED_EXPENSE_ITEM"; monthKey: string; id: string };

interface ExpenseContextValue {
  state: AppState;
  currentMonth: MonthData;
  currentExpenses: Expense[];
  currentCreditExpenses: CreditExpense[];
  dispatch: Dispatch<Action>;
  getCategoryById: (id: string) => Category | undefined;
  getSavingsCategory: () => Category | undefined;
}

const ExpenseContext = createContext<ExpenseContextValue | undefined>(
  undefined,
);

function makeBudgetControl(monthKey: string): MonthlyBudgetControl {
  return {
    monthKey,
    montoDisponible: 0,
    adelantosSueldo: 0,
    items: [],
  };
}

function makeMonth(monthKey: string): MonthData {
  return {
    monthKey,
    salary: 0,
    salaryCurrency: "ARS",
    expenses: [],
    creditExpenses: [],
    budgetControl: makeBudgetControl(monthKey),
  };
}

function isSavingsCategory(category: Pick<Category, "name">) {
  return category.name.trim().toLocaleLowerCase("es-AR") === "ahorro";
}

function ensureSavingsCategory(categories: Category[]): Category[] {
  if (categories.some(isSavingsCategory)) {
    return categories;
  }

  const savingsCategory = DEFAULT_CATEGORIES.find(isSavingsCategory);
  if (!savingsCategory) {
    return categories;
  }

  return [
    ...categories,
    {
      ...savingsCategory,
      id: createId(),
      isDefault: true,
    },
  ];
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

function normalizeBudgetControl(
  monthKey: string,
  budgetControl?: Partial<MonthlyBudgetControl>,
): MonthlyBudgetControl {
  return {
    monthKey,
    montoDisponible: budgetControl?.montoDisponible ?? 0,
    adelantosSueldo: budgetControl?.adelantosSueldo ?? 0,
    tarjetaPersonalTotal: budgetControl?.tarjetaPersonalTotal,
    items: (budgetControl?.items ?? []).map((item) => ({
      ...item,
      estado: item.estado ?? "FALTA_PAGAR",
      categoria: item.categoria ?? "FIJO",
      observaciones: item.observaciones ?? "",
    })),
  };
}

function updateBudgetControl(
  state: AppState,
  monthKey: string,
  updater: (budgetControl: MonthlyBudgetControl) => MonthlyBudgetControl,
) {
  const next = ensureMonth(state, monthKey);
  const month = next.months[monthKey];

  return {
    ...next,
    months: {
      ...next.months,
      [monthKey]: {
        ...month,
        budgetControl: updater(month.budgetControl),
      },
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
    savingsGoals: [],
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
        salaryCurrency: month.salaryCurrency ?? "ARS",
        budgetControl: normalizeBudgetControl(monthKey, month.budgetControl),
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

  return {
    ...ensuredState,
    categories: ensureSavingsCategory(ensuredState.categories ?? []),
    months,
    savingsGoals: (ensuredState.savingsGoals ?? []).map((goal) => ({
      ...goal,
      currency: goal.currency ?? "ARS",
    })),
  };
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
          [month.monthKey]: {
            ...month,
            salary: action.salary,
            salaryCurrency: action.currency,
          },
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
    case "ADD_SAVINGS_GOAL":
      return {
        ...state,
        savingsGoals: [
          {
            ...action.goal,
            id: createId(),
            createdAt: new Date().toISOString(),
          },
          ...(state.savingsGoals ?? []),
        ],
      };
    case "UPDATE_SAVINGS_GOAL":
      return {
        ...state,
        savingsGoals: (state.savingsGoals ?? []).map((goal) =>
          goal.id === action.goal.id ? action.goal : goal,
        ),
      };
    case "DELETE_SAVINGS_GOAL":
      return {
        ...state,
        savingsGoals: (state.savingsGoals ?? []).filter((goal) => goal.id !== action.id),
        months: Object.fromEntries(
          Object.entries(state.months).map(([monthKey, month]) => [
            monthKey,
            {
              ...month,
              expenses: month.expenses.map((expense) =>
                expense.savingsGoalId === action.id
                  ? { ...expense, savingsGoalId: undefined }
                  : expense,
              ),
            },
          ]),
        ),
      };
    case "SET_BUDGET_CONTROL_FIELD":
      return updateBudgetControl(state, action.monthKey, (budgetControl) => ({
        ...budgetControl,
        [action.field]: action.value,
      }));
    case "ADD_FIXED_EXPENSE_ITEM":
      return updateBudgetControl(state, action.monthKey, (budgetControl) => ({
        ...budgetControl,
        items: [
          ...budgetControl.items,
          {
            ...action.item,
            id: createId(),
            observaciones: action.item.observaciones ?? "",
          },
        ],
      }));
    case "UPDATE_FIXED_EXPENSE_ITEM":
      return updateBudgetControl(state, action.monthKey, (budgetControl) => ({
        ...budgetControl,
        items: budgetControl.items.map((item) =>
          item.id === action.item.id ? action.item : item,
        ),
      }));
    case "TOGGLE_FIXED_EXPENSE_STATUS":
      return updateBudgetControl(state, action.monthKey, (budgetControl) => ({
        ...budgetControl,
        items: budgetControl.items.map((item) =>
          item.id === action.id
            ? {
                ...item,
                estado: item.estado === "PAGADO" ? "FALTA_PAGAR" : "PAGADO",
              }
            : item,
        ),
      }));
    case "DELETE_FIXED_EXPENSE_ITEM":
      return updateBudgetControl(state, action.monthKey, (budgetControl) => ({
        ...budgetControl,
        items: budgetControl.items.filter((item) => item.id !== action.id),
      }));
    default:
      return state;
  }
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const initialState = useMemo(() => makeInitialState(), []);
  const [storedState, setStoredState, isHydrated] = useLocalStorage<AppState>(
    STORAGE_KEY,
    initialState,
  );
  const [hasLoadedStoredState, setHasLoadedStoredState] = useState(false);
  const [hasLoadedCloudState, setHasLoadedCloudState] = useState(false);
  const skipNextCloudWriteRef = useRef(false);
  const latestStateRef = useRef(normalizeState(storedState));
  const [state, dispatchBase] = useReducer(
    reducer,
    normalizeState(storedState),
  );

  const dispatch: Dispatch<Action> = (action) => {
    dispatchBase(action);
  };

  const normalizedState = useMemo(() => normalizeState(state), [state]);

  useEffect(() => {
    latestStateRef.current = normalizedState;
  }, [normalizedState]);

  useEffect(() => {
    setHasLoadedCloudState(false);
    skipNextCloudWriteRef.current = false;
  }, [user?.uid]);

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

  useEffect(() => {
    if (!user || !hasLoadedStoredState) {
      return;
    }

    const stateRef = doc(db, "users", user.uid, "appState", "main");
    const unsubscribe = onSnapshot(stateRef, (snapshot) => {
      const data = snapshot.data() as { state?: AppState } | undefined;

      if (!snapshot.exists() || !data?.state) {
        void setDoc(
          stateRef,
          {
            state: latestStateRef.current,
            updatedAt: serverTimestamp(),
            userId: user.uid,
          },
          { merge: true },
        );
        setHasLoadedCloudState(true);
        return;
      }

      skipNextCloudWriteRef.current = true;
      dispatchBase({ type: "HYDRATE", state: data.state });
      setHasLoadedCloudState(true);
    });

    return unsubscribe;
  }, [hasLoadedStoredState, user]);

  useEffect(() => {
    if (!user || !hasLoadedStoredState || !hasLoadedCloudState) {
      return;
    }

    if (skipNextCloudWriteRef.current) {
      skipNextCloudWriteRef.current = false;
      return;
    }

    const stateRef = doc(db, "users", user.uid, "appState", "main");
    void setDoc(
      stateRef,
      {
        state: normalizedState,
        updatedAt: serverTimestamp(),
        userId: user.uid,
      },
      { merge: true },
    );
  }, [hasLoadedCloudState, hasLoadedStoredState, normalizedState, user]);

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
      getSavingsCategory: () => normalizedState.categories.find(isSavingsCategory),
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
