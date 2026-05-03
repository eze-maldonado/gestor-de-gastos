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

export interface MonthData {
  monthKey: string;
  salary: number;
  expenses: Expense[];
}

export interface AppState {
  categories: Category[];
  months: Record<string, MonthData>;
  currentMonthKey: string;
}
