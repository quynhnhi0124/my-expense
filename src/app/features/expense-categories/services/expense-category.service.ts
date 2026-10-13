import { Injectable } from '@angular/core';
import { ApiGetListResponse } from '@shared/interfaces';
import { delay, Observable, of, throwError } from 'rxjs';
import {
  CategoryStatus,
  ExpenseCategory,
  ExpenseCategoryParams,
} from '../data/expense-category.types';
import { MOCK_EXPENSE_CATEGORIES } from '../data/expense-categories.data';

@Injectable({ providedIn: 'root' })
export class ExpenseCategoryService {
  getCategories(
    params?: ExpenseCategoryParams,
  ): Observable<ApiGetListResponse<ExpenseCategory>> {
    return of(this.handleCategoryData(MOCK_EXPENSE_CATEGORIES, params)).pipe(delay(1000));
  }

  private handleCategoryData(
    data: ExpenseCategory[],
    params?: ExpenseCategoryParams,
  ): ApiGetListResponse<ExpenseCategory> {
    const { search = '', page = '1', limit = '30', statuses = [] } = params ?? {};
    const normalizedSearch = search.trim().toLowerCase();
    const categories = data.filter((category) => {
      const matchesSearch =
        !normalizedSearch ||
        [category.name, category.description ?? ''].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        statuses.length === 0 ||
        statuses.includes(category.isActive ? CategoryStatus.ACTIVE : CategoryStatus.INACTIVE);

      return matchesSearch && matchesStatus;
    });
    return {
      data: categories,
      rowCount: categories.length,
      skip: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
    };
  }

  updateCategoryStatus(id: string, isActive: boolean): Observable<ExpenseCategory> {
    const category = MOCK_EXPENSE_CATEGORIES.find((item) => item.id === id);
    if (!category) {
      return throwError(() => new Error('Expense category was not found.'));
    }

    category.isActive = isActive;
    category.updatedAt = new Date();
    return of(category).pipe(delay(1000));
  }

  createCategory(
    input: Pick<ExpenseCategory, 'name' | 'description' | 'isActive'>,
  ): Observable<ExpenseCategory> {
    const now = new Date();
    const category: ExpenseCategory = {
      id: String(Math.max(0, ...MOCK_EXPENSE_CATEGORIES.map((item) => Number(item.id) || 0)) + 1),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      isActive: input.isActive,
      createdAt: now,
      updatedAt: now,
    };

    MOCK_EXPENSE_CATEGORIES.unshift(category);
    return of(category).pipe(delay(1000));
  }
}
