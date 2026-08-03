export type ExpensePaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD";

export interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  tenantId: string;
  branchId: string | null;
  categoryId: string;
  amount: string | number;
  description: string | null;
  date: string;
  paymentMethod: ExpensePaymentMethod;
  createdAt: string;
  category: { id: string; name: string };
  branch?: { id: string; name: string; code: string } | null;
}

export interface MonthlyTrendPoint {
  month: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
}

export interface FinancialSummary {
  from: string;
  to: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  monthlyTrend: MonthlyTrendPoint[];
  meta: {
    completedOrders: number;
    expenseCount: number;
    currency: string;
  };
}

export interface CreateExpensePayload {
  categoryId: string;
  amount: number;
  description?: string;
  date: string;
  paymentMethod: ExpensePaymentMethod;
  branchId?: string;
}
