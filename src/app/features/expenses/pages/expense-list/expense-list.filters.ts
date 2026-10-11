import { ParamMap } from '@angular/router';
import { FilterItem } from '@shared/interfaces/data.interface';
import { parseDates } from '@shared/utils';
import {
  ExpenseCategoryType,
  ExpenseStatus,
  ExpenseStatusLabel,
} from '../../models/expense.interface';
import { ExpenseScope } from '../../services/expense.service';

export const EXPENSE_CATEGORIES: ExpenseCategoryType[] = [
  'food',
  'transportation',
  'accommodation',
  'entertainment',
  'office',
  'other',
];

export const EXPENSE_STATUS_OPTIONS: FilterItem<ExpenseStatus>[] = Object.values(ExpenseStatus).map(
  (status) => ({
    id: status,
    label: ExpenseStatusLabel[status],
    value: status,
  }),
);

export interface ExpenseListRouteFilters {
  view: ExpenseScope;
  search: string;
  expenseDates: Date[];
  categories: ExpenseCategoryType[];
  statuses: ExpenseStatus[];
}

export function parseExpenseListRouteFilters(
  params: ParamMap,
  isAdmin: boolean,
): ExpenseListRouteFilters {
  return {
    view: isAdmin && params.get('view') === 'all' ? 'all' : 'mine',
    search: params.get('search') ?? '',
    expenseDates: parseDates(params.getAll('expenseDates')),
    categories: params
      .getAll('categories')
      .filter((category): category is ExpenseCategoryType =>
        EXPENSE_CATEGORIES.includes(category as ExpenseCategoryType),
      ),
    statuses: params
      .getAll('statuses')
      .filter((status): status is ExpenseStatus =>
        EXPENSE_STATUS_OPTIONS.some((item) => item.value === status),
      ),
  };
}