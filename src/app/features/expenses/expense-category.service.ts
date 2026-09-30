import { Injectable } from '@angular/core';
import { ApiGetListResponse, SearchParams } from '@shared/interfaces';
import { Observable, of, throwError } from 'rxjs';
import { ExpenseCategory } from './expense-category.interface';
import { MOCK_EXPENSE_CATEGORIES } from './data/expense-categories.data';

@Injectable({ providedIn: 'root' })
export class ExpenseCategoryService {
  getCategories({
    search = '',
    page = '1',
    limit = '30',
    statuses = [],
  }: SearchParams & { statuses?: Array<'active' | 'inactive'> }): Observable<ApiGetListResponse<ExpenseCategory>> {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const categories = MOCK_EXPENSE_CATEGORIES.filter((category) => {
      const matchesSearch =
        !normalizedSearch ||
        [category.name, category.description ?? ''].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearch),
        );

      const status = category.isActive ? 'active' : 'inactive';
      const matchesStatus = statuses.length === 0 || statuses.includes(status);

      return matchesSearch && matchesStatus;
    });

    return of({
      data: categories,
      rowCount: categories.length,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    });
  }

  updateCategoryStatus(id: number, isActive: boolean): Observable<ExpenseCategory> {
    const category = MOCK_EXPENSE_CATEGORIES.find((item) => item.id === id);
    if (!category) {
      return throwError(() => new Error('Expense category was not found.'));
    }

    category.isActive = isActive;
    category.updatedAt = new Date();
    return of(category);
  }

  createCategory(input: Pick<ExpenseCategory, 'name' | 'description' | 'isActive'>): Observable<ExpenseCategory> {
    const now = new Date();
    const category: ExpenseCategory = {
      id: Math.max(0, ...MOCK_EXPENSE_CATEGORIES.map((item) => item.id)) + 1,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now,
    };

    MOCK_EXPENSE_CATEGORIES.unshift(category);
    return of(category);
  }
}