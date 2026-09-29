import { Injectable, inject } from '@angular/core';
import { AuthService } from '@core/auth/services/auth.service';
import { ApiGetListResponse, SearchParams } from '@shared/interfaces';
import { Observable, of } from 'rxjs';
import { Role } from '../users/user.enum';
import { Expense, ExpenseStatus } from './expense.interface';
import { MOCK_EXPENSES } from './data/expense.data';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _authService = inject(AuthService);

  getExpenses({
    search = '',
    page = '1',
    limit = '30',
    expenseDates = [],
    statuses = [],
  }: SearchParams & { expenseDates?: Date[]; statuses?: ExpenseStatus[] }): Observable<ApiGetListResponse<Expense>> {
    const currentUser = this._authService.getCurrentUser();
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const accessibleExpenses = MOCK_EXPENSES.filter(
      (expense) => currentUser?.role === Role.ADMIN || expense.userId === currentUser?.id,
    );
    const selectedDateKeys = new Set(expenseDates.map((date) => this.toDateKey(date)));
    const expenses = accessibleExpenses.filter((expense) => {
      const matchesSearch = !normalizedSearch ||
        [
          expense.title,
          expense.description ?? '',
          expense.userName,
          expense.category,
          expense.status,
        ].some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
      const matchesDate =
        selectedDateKeys.size === 0 || selectedDateKeys.has(this.toDateKey(expense.expenseDate));
      const matchesStatus = statuses.length === 0 || statuses.includes(expense.status);

      return matchesSearch && matchesDate && matchesStatus;
    });

    return of({
      data: expenses,
      rowCount: expenses.length,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    });
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}