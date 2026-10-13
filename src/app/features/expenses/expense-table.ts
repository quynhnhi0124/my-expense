import {
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  flexRenderComponent,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
} from '@tanstack/angular-table';
import {
  StatusBadge,
  StatusBadgeProps,
} from '@shared/components/status-badge/status-badge.component';
import { Expense, ExpenseStatus, ExpenseStatusLabel } from './models/expense.types';

export const expenseTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    text: sortFn_text,
    alphanumeric: sortFn_alphanumeric,
  },
});

const { createAppColumnHelper } = createTableHook({ features: expenseTableFeatures });
export const expenseColumnHelper = createAppColumnHelper<Expense>();

export const expenseStatusBadges: Record<ExpenseStatus, StatusBadgeProps> = {
  [ExpenseStatus.APPROVED]: {
    label: ExpenseStatusLabel[ExpenseStatus.APPROVED],
    styles: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  [ExpenseStatus.DRAFT]: {
    label: ExpenseStatusLabel[ExpenseStatus.DRAFT],
    styles: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  [ExpenseStatus.PENDING]: {
    label: ExpenseStatusLabel[ExpenseStatus.PENDING],
    styles: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  [ExpenseStatus.REJECTED]: {
    label: ExpenseStatusLabel[ExpenseStatus.REJECTED],
    styles: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
};

export interface ExpenseColumnFormatters {
  titleHeader: string;
  dateHeader: string;
  formatCategory: (category: string) => string;
  formatAmount: (expense: Expense) => string;
  formatDate: (date: Date) => string;
}

export function createExpenseColumns(formatters: ExpenseColumnFormatters) {
  return expenseColumnHelper.columns([
    expenseColumnHelper.accessor('title', {
      header: formatters.titleHeader,
      sortFn: 'text',
    }),
    expenseColumnHelper.accessor('category', {
      header: 'Category',
      sortFn: 'text',
      cell: (info) => formatters.formatCategory(info.getValue()),
    }),
    expenseColumnHelper.accessor('amount', {
      header: 'Amount',
      sortFn: 'alphanumeric',
      cell: (info) => formatters.formatAmount(info.row.original),
    }),
    expenseColumnHelper.accessor('expenseDate', {
      header: formatters.dateHeader,
      sortFn: 'alphanumeric',
      cell: (info) => formatters.formatDate(info.getValue()),
    }),
    expenseColumnHelper.accessor('status', {
      header: 'Status',
      sortFn: 'text',
      cell: (info) =>
        flexRenderComponent(StatusBadge, {
          inputs: { dataBadge: expenseStatusBadges[info.getValue()] },
        }),
    }),
  ]);
}