import { Injectable, inject } from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';
import { ApiGetListResponse, SearchParams } from '@shared/interfaces';
import { map, Observable, of, throwError } from 'rxjs';
import { Role } from '../../users/models/user.enum';
import {
  Expense,
  ExpenseCategoryType,
  ExpenseStatus,
} from '../models/expense.interface';
import { MOCK_EXPENSES } from '../data/expense.data';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environment';

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

interface CreateExpensePayload {
  title: string;
  description: string;
  amount: string;
  currency: Expense['currency'];
  category: ExpenseCategoryType;
  expenseDate: string;
  status: ExpenseStatus.DRAFT;
  createdAt: string;
  updatedAt: string;
  user: { email: string };
  userId: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _authService = inject(AuthService);
  private readonly _http = inject(HttpClient);

  getExpenses(params: ExpenseQuery): Observable<ApiGetListResponse<Expense>> {
    const currentUser = this._authService.getCurrentUser();
    const canViewAll = currentUser?.role === Role.ADMIN && params.scope === 'all';
    const url = canViewAll
      ? `${environment.baseURL}/expenses`
      : `${environment.baseURL}/users/${currentUser?.id}/expenses`;
    return this._http
      .get<Expense[]>(url)
      .pipe(map((expenses) => this.handleExpenseData(expenses, canViewAll, params)));
  }

  handleExpenseData(
    data: Expense[],
    canViewAll: boolean,
    {
      search = '',
      page = '1',
      limit = '30',
      expenseDates = [],
      statuses = [],
      categories = [],
    }: ExpenseQuery,
  ): ApiGetListResponse<Expense> {
    const normalizedSearch = search.trim().toLowerCase();
    const selectedDateKeys = new Set(expenseDates.map((date) => this.toDateKey(date)));
    const expenses = data.filter((expense) => {
      const searchableValues = [
        expense.title,
        expense.description ?? '',
        expense.category,
        expense.status,
        ...(canViewAll ? [expense.user.email] : []),
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

    return {
      data: expenses,
      rowCount: expenses.length,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    };
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

    const now = new Date().toISOString();
    const payload: CreateExpensePayload = {
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      amount: input.amount.toFixed(2),
      currency: input.currency,
      category: input.category,
      expenseDate: input.expenseDate.toISOString(),
      status: ExpenseStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
      user: { email: user.email },
      userId: user.id,
    };

    return this._http.post<Expense>(`${environment.baseURL}/expenses`, payload);
  }

  private toDateKey(date: Date): string {
    const selectedDate = new Date(date);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
