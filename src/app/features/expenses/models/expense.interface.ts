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

export type ExpenseCategoryType =
  | 'food'
  | 'transportation'
  | 'accommodation'
  | 'entertainment'
  | 'office'
  | 'other';

export interface Expense {
  id: number;
  userId: string;
  userName: string;
  title: string;
  description?: string;
  amount: number;
  currency: 'USD' | 'VND';
  category: ExpenseCategoryType;
  expenseDate: Date;
  status: ExpenseStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    email: string
  }
}

export type ExpenseStatusChangeHandler = (expenseId: number, status: ExpenseStatus) => void;