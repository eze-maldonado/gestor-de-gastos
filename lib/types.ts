export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  currency: CurrencyCode;
  description: string;
  categoryId: string;
  savingsGoalId?: string;
  date: string;
  monthKey: string;
}

export type CurrencyCode = "ARS" | "USD" | "EUR";

export type CreditCardName = "visa" | "master";

export interface CreditExpense {
  id: string;
  purchaseId: string;
  totalAmount: number;
  currency: CurrencyCode;
  installments: number;
  installmentNumber: number;
  remainingInstallments: number;
  installmentAmount: number;
  description: string;
  categoryId: string;
  cardName: CreditCardName;
  date: string;
  monthKey: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currency: CurrencyCode;
  targetDate?: string;
  createdAt: string;
}

export type FixedExpenseStatus = "PAGADO" | "FALTA_PAGAR";

export type FixedExpenseCategory = "FIJO" | "MOVIL_EXTRA";

export interface FixedExpenseItem {
  id: string;
  concepto: string;
  monto: number;
  estado: FixedExpenseStatus;
  categoria: FixedExpenseCategory;
  observaciones?: string;
}

export interface MonthlyBudgetControl {
  monthKey: string;
  montoDisponible: number;
  adelantosSueldo: number;
  tarjetaPersonalTotal?: number;
  items: FixedExpenseItem[];
}

export interface MonthData {
  monthKey: string;
  salary: number;
  salaryCurrency: CurrencyCode;
  expenses: Expense[];
  creditExpenses: CreditExpense[];
  budgetControl: MonthlyBudgetControl;
}

export interface AppState {
  categories: Category[];
  months: Record<string, MonthData>;
  currentMonthKey: string;
  savingsGoals: SavingsGoal[];
}
