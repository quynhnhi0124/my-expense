import { ParamMap } from '@angular/router';
import { FilterItem } from '@shared/interfaces/data.interface';
import { parseDates } from '@shared/utils';
import { ExpenseScope, ExpenseStatus, ExpenseStatusLabel } from '@features/expenses/models';

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
  categories: string[];
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
    categories: params.getAll('categories'),
    statuses: params
      .getAll('statuses')
      .filter((status): status is ExpenseStatus =>
        EXPENSE_STATUS_OPTIONS.some((item) => item.value === status),
      ),
  };
}