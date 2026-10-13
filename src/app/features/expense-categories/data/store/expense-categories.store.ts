import { computed, inject } from '@angular/core';
import { ExpenseCategoryService } from '../../services/expense-category.service';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { finalize, tap } from 'rxjs';
import { ExpenseCategory, ExpenseCategoryParams } from '@features/expense-categories/data';

type ExpenseCategoryState = {
  categories: ExpenseCategory[];
  loading: boolean;
  params: ExpenseCategoryParams;
};

const initialState: ExpenseCategoryState = {
  categories: [],
  loading: false,
  params: {
    search: '',
    page: '1',
    limit: '30',
    statuses: [],
  },
};

export const ExpenseCategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ categories }) => ({
    activeCategories: computed(() => categories().filter((category) => category.isActive)),
  })),
  withMethods((store, service = inject(ExpenseCategoryService)) => ({
    updateParams(params: Partial<ExpenseCategoryParams>): void {
      patchState(store, (state) => ({
        params: { ...state.params, ...params },
      }));
    },
    getCategories() {
      patchState(store, { loading: true });
      return service.getCategories(store.params()).pipe(
        tap(({ data }) => {
          patchState(store, { categories: data });
        }),
        finalize(() => patchState(store, { loading: false })),
      );
    },
  })),
);
