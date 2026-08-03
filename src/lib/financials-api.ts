import { api } from "@/lib/api";
import type {
  CreateExpensePayload,
  Expense,
  ExpenseCategory,
  FinancialSummary,
} from "@/types/financials";

export async function fetchExpenseCategories() {
  const { data } = await api.get<ExpenseCategory[]>("/expenses/categories");
  return data;
}

export async function fetchExpenses(params?: {
  branchId?: string;
  from?: string;
  to?: string;
}) {
  const { data } = await api.get<Expense[]>("/expenses", { params });
  return data;
}

export async function createExpense(payload: CreateExpensePayload) {
  const { data } = await api.post<Expense>("/expenses", payload);
  return data;
}

export async function fetchFinancialSummary(params?: {
  from?: string;
  to?: string;
  branchId?: string;
}) {
  const { data } = await api.get<FinancialSummary>(
    "/analytics/financial-summary",
    { params },
  );
  return data;
}
