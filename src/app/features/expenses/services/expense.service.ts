import { Injectable, inject } from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';
import { ApiGetListResponse } from '@shared/interfaces';
import { delay, Observable, of, throwError } from 'rxjs';
import { Role } from '../../users/models/user.enum';
import {
  CreateExpenseInput,
  Expense,
  ExpenseMock,
  ExpenseQuery,
  ExpenseStatus,
  toExpense,
} from '@features/expenses/models';
import { MOCK_EXPENSE } from '../data/expense-mock.data';
import { MOCK_EXPENSE_CATEGORIES } from '@features/expense-categories/data/expense-categories.data';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _authService = inject(AuthService);

  getExpenses(params: ExpenseQuery): Observable<ApiGetListResponse<Expense>> {
    const currentUser = this._authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('You must be signed in to view expenses.'));
    }

    const canViewAll = currentUser?.role === Role.ADMIN && params.scope === 'all';
    const activeCategoryIds = new Set(
      MOCK_EXPENSE_CATEGORIES.filter((category) => category.isActive).map((category) => category.id),
    );
    const eligibleExpenses = MOCK_EXPENSE.filter(
      (expense) =>
        activeCategoryIds.has(expense.category.id) && (!canViewAll || expense.user.isActive),
    );
    const expenses = canViewAll
      ? eligibleExpenses
      : eligibleExpenses.filter((expense) => expense.userId === currentUser.id);
    return of(this.handleExpenseData(expenses.map(toExpense), canViewAll, params)).pipe(
      delay(1000),
    );
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
        MOCK_EXPENSE_CATEGORIES.find((category) => category.id === expense.category)?.name ?? '',
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

  updateExpenseStatus(id: string, status: ExpenseStatus): Observable<Expense> {
    if (this._authService.getCurrentUser()?.role !== Role.ADMIN) {
      return throwError(() => new Error('Only administrators can update expense status.'));
    }

    const expense = MOCK_EXPENSE.find((item) => item.id === id);
    if (!expense) {
      return throwError(() => new Error('Expense was not found.'));
    }

    expense.status = status;
    expense.updatedAt = new Date();
    return of(toExpense(expense)).pipe(delay(1000));
  }

  createExpense(input: CreateExpenseInput): Observable<Expense> {
    const user = this._authService.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('You must be signed in to create an expense.'));
    }

    const category = MOCK_EXPENSE_CATEGORIES.find(
      (item) => item.id === input.category && item.isActive,
    );
    if (!category) {
      return throwError(() => new Error('An active expense category is required.'));
    }

    const now = new Date();
    const expense: ExpenseMock = {
      id: String(Math.max(0, ...MOCK_EXPENSE.map((item) => Number(item.id) || 0)) + 1),
      userId: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || undefined,
      amount: input.amount,
      currency: input.currency,
      category: {
        id: category.id,
        name: category.name,
        isActive: category.isActive,
      },
      expenseDate: input.expenseDate,
      status: ExpenseStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
      user: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
      },
    };

    MOCK_EXPENSE.unshift(expense);
    return of(toExpense(expense)).pipe(delay(1000));
  }

  private toDateKey(date: Date): string {
    const selectedDate = new Date(date);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
