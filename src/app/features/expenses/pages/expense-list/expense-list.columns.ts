import { flexRenderComponent } from '@tanstack/angular-table';
import { ExpenseActionsMenu } from '../../components/expense/expense-table/expense-action-menu/expense-action-menu.component';
import {
  createExpenseColumns,
  expenseColumnHelper,
} from '../../expense-table';
import { Expense, ExpenseStatusChangeHandler } from '../../models/expense.interface';

export function createAllExpenseColumns(
  personalColumns: ReturnType<typeof createExpenseColumns>,
  updateStatus: ExpenseStatusChangeHandler,
) {
  return expenseColumnHelper.columns([
    expenseColumnHelper.accessor((expense: Expense) => expense.user.email, {
      id: 'email',
      header: 'Email',
      sortFn: 'text',
    }),
    ...personalColumns,
    expenseColumnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) =>
        flexRenderComponent(ExpenseActionsMenu, {
          inputs: { expense: info.row.original, updateStatus },
        }),
      enableSorting: false,
    }),
  ]);
}