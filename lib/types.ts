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
  description: string;
  categoryId: string;
  date: string;
  monthKey: string;
}

export type CreditCardName = "visa" | "master";

export interface CreditExpense {
  id: string;
  purchaseId: string;
  totalAmount: number;
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

export interface MonthData {
  monthKey: string;
  salary: number;
  expenses: Expense[];
  creditExpenses: CreditExpense[];
}

export interface AppState {
  categories: Category[];
  months: Record<string, MonthData>;
  currentMonthKey: string;
}
