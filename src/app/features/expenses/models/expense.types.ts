import { SearchParams } from "@shared/interfaces";

export enum ExpenseStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export const ExpenseStatusLabel = {
  [ExpenseStatus.DRAFT]: "Draft",
  [ExpenseStatus.PENDING]: "Pending",
  [ExpenseStatus.APPROVED]: "Approved",
  [ExpenseStatus.REJECTED]: "Rejected"
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  currency: 'USD' | 'VND';
  category: string;
  expenseDate: Date;
  status: ExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    email: string
  }
}

export interface ExpenseMock {
  id: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  currency: 'USD' | 'VND';
  category: {
    id: string,
    name: string,
    isActive: boolean,
  };
  expenseDate: Date;
  status: ExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string,
    email: string,
    isActive: boolean
  }
}

export function toExpense(expense: ExpenseMock): Expense {
  const { category, user, ...details } = expense;
  return {
    ...details,
    category: category.id,
    user: { email: user.email },
  };
}

export type ExpenseStatusChangeHandler = (expenseId: string, status: ExpenseStatus) => void;

export type ExpenseScope = 'mine' | 'all';

export interface ExpenseQuery extends SearchParams {
  expenseDates?: Date[];
  statuses?: ExpenseStatus[];
  categories?: string[];
  scope?: ExpenseScope;
}

export interface CreateExpenseInput {
  title: string;
  description?: string;
  amount: number;
  currency: Expense['currency'];
  category: string;
  expenseDate: Date;
}

export interface CreateExpensePayload {
  title: string;
  description: string;
  amount: string;
  currency: Expense['currency'];
  category: string;
  expenseDate: string;
  status: ExpenseStatus.DRAFT;
  createdAt: string;
  updatedAt: string;
  user: { email: string };
  userId: string;
}