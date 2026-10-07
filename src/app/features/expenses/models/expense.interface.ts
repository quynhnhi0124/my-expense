export type ExpenseStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected';

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
}