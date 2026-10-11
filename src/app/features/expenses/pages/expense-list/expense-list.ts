import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { injectTable, isFunction, SortingState } from '@tanstack/angular-table';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { AuthService } from '@core/auth/services/auth.service';
import { Role } from '@features/users/models/user.enum';
import {
  Expense,
  ExpenseCategoryType,
  ExpenseStatus,
  ExpenseStatusChangeHandler,
} from '../../models/expense.interface';
import { ExpenseScope, ExpenseService } from '../../services/expense.service';
import { ExpenseCategoryService } from '../../services/expense-category.service';
import { ExpenseCategory } from '../../models/expense-category.interface';
import { CommonTable } from '@shared/components/table/table-data/common-table.component';
import { TableDataHeader } from '@shared/components/table/table-data-header/table-data-header.component';
import { TableDataToolbar } from '@shared/components/table/table-data-toolbar/table-data-toolbar.component';
import { CreateExpenseDialog } from '../../components/expense/create-expense-dialog/create-expense-dialog.component';
import { FilterItem, TableFilterChange, TableFilterGroup } from '@shared/interfaces/data.interface';
import { parseDates, toDateKey, updateTableFilterQueryParams } from '@shared/utils';
import {
  createExpenseColumns,
  expenseTableFeatures,
} from '../../expense-table';
import { createAllExpenseColumns } from './expense-list.columns';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_STATUS_OPTIONS,
  parseExpenseListRouteFilters,
} from './expense-list.filters';
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
  private readonly _categoryService = inject(ExpenseCategoryService);
  private readonly _authService = inject(AuthService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);
  readonly isAdmin = this._authService.getCurrentUser()?.role === Role.ADMIN;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly activeView = signal<ExpenseScope>('mine');
  readonly createDialogState = signal<'open' | 'closed'>('closed');
  readonly availableCategories = signal<ExpenseCategory[]>([]);
  readonly categoryOptions = computed<FilterItem<ExpenseCategoryType>[]>(() =>
    this.availableCategories().flatMap((category) => {
      const value = this.toExpenseCategoryType(category.name);
      return value ? [{ id: value, value, label: category.name }] : [];
    }),
  );
  readonly filters = {
    mine: {
      dates: signal<Date[]>([]),
      categories: signal<ExpenseCategoryType[]>([]),
    },
    all: {
      dates: signal<Date[]>([]),
      categories: signal<ExpenseCategoryType[]>([]),
      statuses: signal<ExpenseStatus[]>([]),
    },
  };
  readonly statuses = EXPENSE_STATUS_OPTIONS;
  readonly data = signal<Expense[]>([]);
  private readonly sorting = signal<SortingState>([]);

  get personalFilterGroups(): TableFilterGroup[] {
    return [
      {
        key: 'expenseDates',
        label: 'Expense date',
        type: 'date',
        selectedValues: this.filters.mine.dates().map((date) => toDateKey(date)),
      },
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
      {
        key: 'status',
        label: 'Status',
        type: 'checkbox',
        options: this.statuses,
        selectedValues: this.filters.all.statuses(),
      },
      this.createCategoryFilterGroup(this.filters.all.categories()),
    ];
  }

  private createCategoryFilterGroup(selectedCategories: ExpenseCategoryType[]): TableFilterGroup {
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
          this.data.update((expenses) =>
            expenses.map((expense) =>
              expense.id === updatedExpense.id ? updatedExpense : expense,
            ),
          );
          toast.success('Expense status updated');
        },
        error: () => toast.error('Unable to update expense status'),
      });
  };

  private readonly personalColumns = createExpenseColumns({
    titleHeader: 'Expense',
    dateHeader: 'Expense date',
    formatCategory: (category) => this.formatLabel(category),
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
  readonly columns = computed(() =>
    this.isAdmin && this.activeView() === 'all' ? this.allUserColumns : this.personalColumns,
  );

  ngOnInit(): void {
    this._categoryService
      .getCategories({})
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(({ data }) =>
        this.availableCategories.set(data.filter((category) => category.isActive)),
      );

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
          } else {
            this.filters.all.dates.set(expenseDates);
            this.filters.all.statuses.set(statuses);
            this.filters.all.categories.set(categories);
          }
          this.table.setPageIndex(0);
        }),
        switchMap(({ view, search, expenseDates, categories, statuses }) =>
          this._expenseService.getExpenses({
            scope: view,
            search,
            expenseDates,
            categories,
            statuses: view === 'all' ? statuses : [],
          }),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(({ data }) => this.data.set(data));
  }

  onTabActivated(tab: string): void {
    if (!this.isAdmin) return;

    const nextView = tab === 'all' ? 'all' : 'mine';
    if (nextView === this.activeView()) return;
    this.searchControl.setValue('', { emitEvent: false });
    this.clearViewFilters(this.activeView());
    this.activeView.set(nextView);
    this.table.setPageIndex(0);
    this.updateFilterQueryParams();
  }

  onFilterChange(change: TableFilterChange): void {
    switch (change.key) {
      case 'status':
        this.filters.all.statuses.set(
          this.statuses
            .filter((item) => change.selectedValues.includes(item.value))
            .map((item) => item.value),
        );
        break;
      case 'category': {
        const categories = change.selectedValues.filter(
          (value): value is ExpenseCategoryType =>
            EXPENSE_CATEGORIES.includes(value as ExpenseCategoryType),
        );
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

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.clearViewFilters(this.activeView());
    this.table.setPageIndex(0);
    this.updateFilterQueryParams();
  }

  private clearViewFilters(view: ExpenseScope): void {
    this.filters[view].dates.set([]);
    this.filters[view].categories.set([]);
    if (view === 'all') {
      this.filters.all.statuses.set([]);
    }
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
    this._expenseService
      .getExpenses({
        scope: isAllView ? 'all' : 'mine',
        search: this.searchControl.value.trim(),
        expenseDates: this.filters[this.activeView()].dates(),
        categories: this.filters[this.activeView()].categories(),
        statuses: isAllView ? this.filters.all.statuses() : [],
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ({ data }) => this.data.set(data),
        error: () => toast.error('Unable to reload expenses'),
      });
  }

  private toExpenseCategoryType(name: string): ExpenseCategoryType | null {
    const categoryTypes: Record<string, ExpenseCategoryType> = {
      food: 'food',
      transportation: 'transportation',
      accommodation: 'accommodation',
      entertainment: 'entertainment',
      'office supplies': 'office',
      other: 'other',
    };

    return categoryTypes[name.trim().toLowerCase()] ?? null;
  }

  private updateFilterQueryParams(): void {
    const isAllView = this.activeView() === 'all';
    updateTableFilterQueryParams(this._router, this._route, {
      view: this.isAdmin && isAllView ? 'all' : null,
      search: this.searchControl.value.trim() || null,
      email: null,
      expenseDates: this.filters[this.activeView()].dates().map((date) => toDateKey(date)),
      categories: this.filters[this.activeView()].categories(),
      statuses: isAllView ? this.filters.all.statuses() : [],
    });
  }
}
