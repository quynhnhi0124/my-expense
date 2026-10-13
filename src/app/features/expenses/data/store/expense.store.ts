import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Expense, ExpenseQuery } from '@features/expenses/models';
import { ExpenseService } from '../../services/expense.service';
import { finalize, tap } from 'rxjs';

type ExpenseState = {
  expenses: Expense[];
  loading: boolean;
};

const initialState: ExpenseState = {
  expenses: [],
  loading: false,
};

export const ExpenseStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(ExpenseService)) => {
    const loadExpenses = (params: ExpenseQuery) => {
      patchState(store, { loading: true });
      return service.getExpenses(params).pipe(
        tap(({ data }) => patchState(store, { expenses: data })),
        finalize(() => patchState(store, { loading: false })),
      );
    };

    return {
      getMyExpenses(params: Omit<ExpenseQuery, 'scope'> = {}) {
        return loadExpenses({ ...params, scope: 'mine' });
      },
      getAllActiveUserExpenses(params: Omit<ExpenseQuery, 'scope'> = {}) {
        return loadExpenses({ ...params, scope: 'all' });
      },
      updateExpense(expense: Expense): void {
        patchState(store, (state) => ({
          expenses: state.expenses.map((current) =>
            current.id === expense.id ? expense : current,
          ),
        }));
      },
    };
  }),
);