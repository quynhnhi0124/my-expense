import { Injectable, inject } from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';
import { ApiGetListResponse, SearchParams } from '@shared/interfaces';
import { Observable, of, throwError } from 'rxjs';
import { Role } from '../../users/models/user.enum';
import { Expense, ExpenseCategoryType, ExpenseStatus } from '../models/expense.interface';
import { MOCK_EXPENSES } from '../data/expense.data';
import { MOCK_USERS } from '../../users/data/users.data';

export type ExpenseScope = 'mine' | 'all';

export interface ExpenseQuery extends SearchParams {
  expenseDates?: Date[];
  statuses?: ExpenseStatus[];
  categories?: ExpenseCategoryType[];
  scope?: ExpenseScope;
}

export interface CreateExpenseInput {
  title: string;
  description?: string;
  amount: number;
  currency: Expense['currency'];
  category: ExpenseCategoryType;
  expenseDate: Date;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _authService = inject(AuthService);

  getExpenses({
    search = '',
    page = '1',
    limit = '30',
    expenseDates = [],
    statuses = [],
    categories = [],
    scope = 'mine',
  }: ExpenseQuery): Observable<ApiGetListResponse<Expense>> {
    const currentUser = this._authService.getCurrentUser();
    const normalizedSearch = search.trim().toLowerCase();
    const canViewAll = currentUser?.role === Role.ADMIN && scope === 'all';
    const accessibleExpenses = currentUser
      ? MOCK_EXPENSES.filter((expense) => canViewAll || expense.userId === currentUser.id)
      : [];
    const selectedDateKeys = new Set(expenseDates.map((date) => this.toDateKey(date)));
    const expenses = accessibleExpenses.filter((expense) => {
      const searchableValues = [
          expense.title,
          expense.description ?? '',
          expense.userName,
          expense.category,
          expense.status,
          ...(canViewAll ? [this.getUserEmail(expense.userId)] : []),
        ];
      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesDate =
        selectedDateKeys.size === 0 || selectedDateKeys.has(this.toDateKey(expense.expenseDate));
      const matchesStatus = statuses.length === 0 || statuses.includes(expense.status);
      const matchesCategory = categories.length === 0 || categories.includes(expense.category);

      return matchesSearch && matchesDate && matchesStatus && matchesCategory;
    });

    return of({
      data: expenses,
      rowCount: expenses.length,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    });
  }

  updateExpenseStatus(id: number, status: ExpenseStatus): Observable<Expense> {
    if (this._authService.getCurrentUser()?.role !== Role.ADMIN) {
      return throwError(() => new Error('Only administrators can update expense status.'));
    }

    const expense = MOCK_EXPENSES.find((item) => item.id === id);
    if (!expense) {
      return throwError(() => new Error('Expense was not found.'));
    }

    expense.status = status;
    expense.updatedAt = new Date();
    return of(expense);
  }

  createExpense(input: CreateExpenseInput): Observable<Expense> {
    const user = this._authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('You must be signed in to create an expense.'));
    }

    const now = new Date();
    const expense: Expense = {
      id: Math.max(0, ...MOCK_EXPENSES.map((item) => item.id)) + 1,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      amount: input.amount,
      currency: input.currency,
      category: input.category,
      expenseDate: input.expenseDate,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    MOCK_EXPENSES.unshift(expense);
    return of(expense);
  }

  private getUserEmail(userId: string): string {
    return MOCK_USERS.find((user) => user.id === userId)?.email.toLowerCase() ?? '';
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}