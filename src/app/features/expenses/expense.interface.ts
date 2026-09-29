export type ExpenseStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected';

export type ExpenseCategory =
  | 'food'
  | 'transportation'
  | 'accommodation'
  | 'entertainment'
  | 'office'
  | 'other';

export interface Expense {
  id: number;

  userId: number;
  userName: string;

  title: string;
  description?: string;

  amount: number;
  currency: 'USD' | 'VND';

  category: ExpenseCategory;
  expenseDate: Date;

  status: ExpenseStatus;

  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}