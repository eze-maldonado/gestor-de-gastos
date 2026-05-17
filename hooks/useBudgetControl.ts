"use client";

import { useMemo } from "react";
import { useExpenses } from "@/context/ExpenseContext";
import type {
  FixedExpenseCategory,
  FixedExpenseItem,
  MonthlyBudgetControl,
} from "@/lib/types";

export interface BudgetControlSummary {
  fixedItems: FixedExpenseItem[];
  variableItems: FixedExpenseItem[];
  fixedTotal: number;
  variableTotal: number;
  totalMonth: number;
  realRemaining: number;
  cardTotal: number;
}

function calculateTotal(items: FixedExpenseItem[]) {
  return items.reduce((sum, item) => sum + item.monto, 0);
}

export function useBudgetControl() {
  const { currentMonth, dispatch } = useExpenses();
  const budgetControl = currentMonth.budgetControl;

  const summary = useMemo<BudgetControlSummary>(() => {
    const fixedItems = budgetControl.items.filter((item) => item.categoria === "FIJO");
    const variableItems = budgetControl.items.filter(
      (item) => item.categoria === "MOVIL_EXTRA",
    );
    const fixedTotal = calculateTotal(fixedItems);
    const variableTotal = calculateTotal(variableItems);
    const totalMonth = fixedTotal + variableTotal;
    const realRemaining = budgetControl.montoDisponible - totalMonth;
    const cardTotal = variableItems
      .filter((item) => item.concepto.toLocaleLowerCase("es-AR").includes("tarjeta"))
      .reduce((sum, item) => sum + item.monto, 0);

    return {
      fixedItems,
      variableItems,
      fixedTotal,
      variableTotal,
      totalMonth,
      realRemaining,
      cardTotal,
    };
  }, [budgetControl]);

  const setBudgetField = (field: "montoDisponible", value: number) => {
    dispatch({
      type: "SET_BUDGET_CONTROL_FIELD",
      monthKey: currentMonth.monthKey,
      field,
      value,
    });
  };

  const addItem = (
    categoria: FixedExpenseCategory,
    item: Pick<FixedExpenseItem, "concepto" | "monto" | "observaciones">,
  ) => {
    dispatch({
      type: "ADD_FIXED_EXPENSE_ITEM",
      monthKey: currentMonth.monthKey,
      item: {
        ...item,
        categoria,
        estado: "FALTA_PAGAR",
      },
    });
  };

  const updateItem = (item: FixedExpenseItem) => {
    dispatch({
      type: "UPDATE_FIXED_EXPENSE_ITEM",
      monthKey: currentMonth.monthKey,
      item,
    });
  };

  const toggleItemStatus = (id: string) => {
    dispatch({
      type: "TOGGLE_FIXED_EXPENSE_STATUS",
      monthKey: currentMonth.monthKey,
      id,
    });
  };

  const deleteItem = (id: string) => {
    dispatch({
      type: "DELETE_FIXED_EXPENSE_ITEM",
      monthKey: currentMonth.monthKey,
      id,
    });
  };

  return {
    budgetControl: budgetControl as MonthlyBudgetControl,
    currentMonth,
    summary,
    setBudgetField,
    addItem,
    updateItem,
    toggleItemStatus,
    deleteItem,
  };
}
