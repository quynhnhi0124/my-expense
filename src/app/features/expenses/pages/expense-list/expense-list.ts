import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { injectTable, isFunction, SortingState } from '@tanstack/angular-table';
import { debounceTime, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { AuthService } from '@core/auth/services/auth.service';
import { Role } from '@features/users/models/user.enum';
import { ExpenseService } from '../../services/expense.service';
import { CommonTable } from '@shared/components/table/table-data/common-table.component';
import { TableDataHeader } from '@shared/components/table/table-data-header/table-data-header.component';
import { TableDataToolbar } from '@shared/components/table/table-data-toolbar/table-data-toolbar.component';
import { CreateExpenseDialog } from '../../components/create-expense-dialog/create-expense-dialog.component';
import { FilterItem, TableFilterChange, TableFilterGroup } from '@shared/interfaces/data.interface';
import { parseDates, toDateKey, updateTableFilterQueryParams } from '@shared/utils';
import { createExpenseColumns, expenseTableFeatures } from '../../expense-table';
import { createAllExpenseColumns, createMyExpenseColumns } from './expense-list.columns';
import {
  EXPENSE_STATUS_OPTIONS,
  parseExpenseListRouteFilters,
} from './expense-list.filters';
import { BrnDialogState } from '@spartan-ng/brain/dialog';
import { ExpenseScope, ExpenseStatus, ExpenseStatusChangeHandler } from '@features/expenses/models';
import { ExpenseCategoryStore } from '@features/expense-categories/data/store/expense-categories.store';
import { ExpenseStore } from '@features/expenses/data/store/expense.store';
@Component({
  imports: [
    CommonTable,
    NgTemplateOutlet,
    TableDataHeader,
    TableDataToolbar,
    CreateExpenseDialog,
    HlmTabsImports,
    HlmButtonImports,
  ],
  selector: 'app-expense-list',
  styleUrl: './expense-list.css',
  templateUrl: './expense-list.html',
})
export class ExpenseList implements OnInit {
  private readonly _expenseService = inject(ExpenseService);
  private readonly _expenseStore = inject(ExpenseStore);
  private readonly _categoryStore = inject(ExpenseCategoryStore);
  private readonly _authService = inject(AuthService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  readonly isAdmin = this._authService.getCurrentUser()?.role === Role.ADMIN;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly loading = signal<boolean>(false);
  readonly activeView = signal<ExpenseScope>('mine');
  readonly createDialogState = signal<BrnDialogState>('closed');
  readonly categoryOptions = computed<FilterItem<string>[]>(() =>
    this._categoryStore.activeCategories().map((category) => ({
      id: category.id,
      value: category.id,
      label: category.name,
    })),
  );
  readonly filters = {
    mine: {
      dates: signal<Date[]>([]),
      categories: signal<string[]>([]),
      statuses: signal<ExpenseStatus[]>([]),
    },
    all: {
      dates: signal<Date[]>([]),
      categories: signal<string[]>([]),
      statuses: signal<ExpenseStatus[]>([]),
    },
  };
  readonly statuses = EXPENSE_STATUS_OPTIONS;
  readonly data = this._expenseStore.expenses;
  private readonly sorting = signal<SortingState>([]);

  get personalFilterGroups(): TableFilterGroup[] {
    return [
      {
        key: 'expenseDates',
        label: 'Expense date',
        type: 'date',
        selectedValues: this.filters.mine.dates().map((date) => toDateKey(date)),
      },
      ...(this.isAdmin ? [this.createStatusFilterGroup(this.filters.mine.statuses())] : []),
      this.createCategoryFilterGroup(this.filters.mine.categories()),
    ];
  }

  get allUserFilterGroups(): TableFilterGroup[] {
    return [
      {
        key: 'expenseDates',
        label: 'Expense date',
        type: 'date',
        selectedValues: this.filters.all.dates().map((date) => toDateKey(date)),
      },
      this.createStatusFilterGroup(this.filters.all.statuses()),
      this.createCategoryFilterGroup(this.filters.all.categories()),
    ];
  }

  private createStatusFilterGroup(selectedStatuses: ExpenseStatus[]): TableFilterGroup {
    return {
      key: 'status',
      label: 'Status',
      type: 'checkbox',
      options: this.statuses,
      selectedValues: selectedStatuses,
    };
  }

  private createCategoryFilterGroup(selectedCategories: string[]): TableFilterGroup {
    return {
      key: 'category',
      label: 'Category',
      type: 'checkbox',
      options: this.categoryOptions(),
      selectedValues: selectedCategories,
    };
  }

  private readonly handleStatusChange: ExpenseStatusChangeHandler = (expenseId, status) => {
    this._expenseService
      .updateExpenseStatus(expenseId, status)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (updatedExpense) => {
          this._expenseStore.updateExpense(updatedExpense);
          toast.success('Expense status updated');
        },
        error: () => toast.error('Unable to update expense status'),
      });
  };

  private readonly personalColumns = createExpenseColumns({
    titleHeader: 'Expense',
    dateHeader: 'Expense date',
    formatCategory: (category) =>
      this._categoryStore.categories().find((item) => item.id === category)?.name ??
      this.formatLabel(category),
    formatAmount: (expense) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: expense.currency,
      }).format(expense.amount),
    formatDate: (date) => new DatePipe('en-US').transform(date, 'mediumDate') ?? '',
  });
  private readonly allUserColumns = createAllExpenseColumns(
    this.personalColumns,
    this.handleStatusChange,
  );
  private readonly adminMyExpenseColumns = createMyExpenseColumns(
    this.personalColumns,
    this.handleStatusChange,
  );
  readonly columns = computed(() => {
    if (!this.isAdmin) return this.personalColumns;
    return this.activeView() === 'all' ? this.allUserColumns : this.adminMyExpenseColumns;
  });

  ngOnInit(): void {
    this._categoryStore
      .getCategories()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.updateFilterQueryParams()),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe();

    this._route.queryParamMap
      .pipe(
        map((params) => parseExpenseListRouteFilters(params, this.isAdmin)),
        tap(({ view, search, expenseDates, categories, statuses }) => {
          this.activeView.set(view);
          this.searchControl.setValue(search, { emitEvent: false });
          if (view === 'mine') {
            this.filters.mine.dates.set(expenseDates);
            this.filters.mine.categories.set(categories);
            this.filters.mine.statuses.set(this.isAdmin ? statuses : []);
          } else {
            this.filters.all.dates.set(expenseDates);
            this.filters.all.statuses.set(statuses);
            this.filters.all.categories.set(categories);
          }
          this.table.setPageIndex(0);
          this.loading.set(true);
        }),
        switchMap(({ view, search, expenseDates, categories, statuses }) => {
          const filters = {
            search,
            expenseDates,
            categories,
            statuses: this.isAdmin ? statuses : [],
          };
          const request =
            view === 'all'
              ? this._expenseStore.getAllActiveUserExpenses(filters)
              : this._expenseStore.getMyExpenses(filters);
          return request.pipe(finalize(() => this.loading.set(false)));
        }),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({ error: () => toast.error('Unable to load expenses') });
  }

  onTabActivated(tab: string): void {
    if (!this.isAdmin) return;

    const nextView = tab === 'all' ? 'all' : 'mine';
    if (nextView === this.activeView()) return;
    this.searchControl.setValue('', { emitEvent: false });
    this.clearViewFilters();
    this.activeView.set(nextView);
    this.table.setPageIndex(0);
    this.updateFilterQueryParams();
  }

  onFilterChange(change: TableFilterChange): void {
    switch (change.key) {
      case 'status':
        this.filters[this.activeView()].statuses.set(
          this.statuses
            .filter((item) => change.selectedValues.includes(item.value))
            .map((item) => item.value),
        );
        break;
      case 'category': {
        const activeCategoryIds = new Set(
          this._categoryStore.activeCategories().map((category) => category.id),
        );
        const categories = change.selectedValues.filter((value) => activeCategoryIds.has(value));
        this.filters[this.activeView()].categories.set(categories);
        break;
      }
      case 'expenseDates': {
        const dates = parseDates(change.selectedValues);
        this.filters[this.activeView()].dates.set(dates);
        break;
      }
      default:
        return;
    }

    this.updateFilterQueryParams();
  }

  onCreateDialogStateChange(state: string): void {
    if (state === 'open' || state === 'closed') {
      this.createDialogState.set(state);
    }
  }

  clearViewFilters(): void {
    this.filters[this.activeView()].statuses.set([]);
    this.searchControl.setValue('', { emitEvent: false });
    this.filters[this.activeView()].dates.set([]);
    this.filters[this.activeView()].categories.set([]);
    this.table.setPageIndex(0);
    this.updateFilterQueryParams();
  }

  readonly table = injectTable(() => ({
    key: 'expense-list',
    features: expenseTableFeatures,
    columns: this.columns(),
    data: this.data(),
    getRowId: (expense) => String(expense.id),
    state: { sorting: this.sorting() },
    onSortingChange: (updater) =>
      isFunction(updater) ? this.sorting.update(updater) : this.sorting.set(updater),
  }));

  private formatLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');
  }

  reloadCurrentExpenses(): void {
    const isAllView = this.isAdmin && this.activeView() === 'all';
    const filters = {
        search: this.searchControl.value.trim(),
        expenseDates: this.filters[this.activeView()].dates(),
        categories: this.filters[this.activeView()].categories(),
        statuses: this.isAdmin ? this.filters[this.activeView()].statuses() : [],
    };
    const request = isAllView
      ? this._expenseStore.getAllActiveUserExpenses(filters)
      : this._expenseStore.getMyExpenses(filters);
    request
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        error: () => toast.error('Unable to reload expenses'),
      });
  }

  private updateFilterQueryParams(): void {
    const isAllView = this.activeView() === 'all';
    updateTableFilterQueryParams(this._router, this._route, {
      view: this.isAdmin && isAllView ? 'all' : null,
      search: this.searchControl.value.trim() || null,
      email: null,
      expenseDates: this.filters[this.activeView()].dates().map((date) => toDateKey(date)),
      categories: this.filters[this.activeView()].categories(),
      statuses: this.isAdmin ? this.filters[this.activeView()].statuses() : [],
    });
  }
}
