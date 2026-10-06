import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import {
  flexRenderComponent,
  injectTable,
  isFunction,
  SortingState,
} from '@tanstack/angular-table';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { AuthService } from '@core/auth/services/auth.service';
import { Role } from '@features/users/models/user.enum';
import { Expense, ExpenseCategoryType, ExpenseStatus } from '../../models/expense.interface';
import { CreateExpenseInput, ExpenseScope, ExpenseService } from '../../services/expense.service';
import { MOCK_USERS } from '@features/users/data/users.data';
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
  expenseColumnHelper as columnHelper,
  expenseTableFeatures,
} from '../../expense-table';
type ExpenseStatusChangeHandler = (expenseId: number, status: ExpenseStatus) => void;

@Component({
  imports: [HlmButtonImports, HlmDropdownMenuImports, NgIcon],
  providers: [provideIcons({ lucideEllipsis })],
  template: `
    <button
      hlmBtn
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label="Change expense status"
      [hlmDropdownMenuTrigger]="menu"
    >
      <ng-icon name="lucideEllipsis" />
    </button>
    <ng-template #menu>
      <hlm-dropdown-menu class="w-44">
        <hlm-dropdown-menu-label>Change status</hlm-dropdown-menu-label>
        @for (status of statuses; track status) {
          <button
            hlmDropdownMenuItem
            [disabled]="status === expense().status"
            (click)="updateStatus()(expense().id, status)"
          >
            Set {{ status }}
          </button>
        }
      </hlm-dropdown-menu>
    </ng-template>
  `,
})
class ExpenseActionsMenu {
  readonly expense = input.required<Expense>();
  readonly updateStatus = input.required<ExpenseStatusChangeHandler>();
  readonly statuses: ExpenseStatus[] = ['draft', 'pending', 'approved', 'rejected'];
}

@Component({
  imports: [
    HlmButtonImports,
    CommonTable,
    HlmTabsImports,
    NgTemplateOutlet,
    TableDataHeader,
    TableDataToolbar,
    CreateExpenseDialog,
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
  readonly categoryValues: ExpenseCategoryType[] = [
    'food',
    'transportation',
    'accommodation',
    'entertainment',
    'office',
    'other',
  ];
  readonly createDialogState = signal<'open' | 'closed'>('closed');
  readonly isSubmitting = signal(false);
  readonly availableCategories = signal<ExpenseCategory[]>([]);
  readonly categoryOptions = computed(() =>
    this.availableCategories().flatMap((category) => {
      const value = this.toExpenseCategoryType(category.name);
      return value ? [{ value, label: category.name }] : [];
    }),
  );
  readonly createExpenseForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    currency: new FormControl<'USD' | 'VND'>('USD', { nonNullable: true }),
    category: new FormControl<ExpenseCategoryType | null>(null, [Validators.required]),
    expenseDate: new FormControl<Date | null>(null, [Validators.required]),
  });
  readonly selectedMineDates = signal<Date[]>([]);
  readonly selectedDates = signal<Date[]>([]);
  readonly selectedMineCategories = signal<ExpenseCategoryType[]>([]);
  readonly selectedAllCategories = signal<ExpenseCategoryType[]>([]);
  readonly statuses: FilterItem<ExpenseStatus>[] = [
    { id: 'draft', label: 'Draft', value: 'draft' },
    { id: 'pending', label: 'Pending', value: 'pending' },
    { id: 'approved', label: 'Approved', value: 'approved' },
    { id: 'rejected', label: 'Rejected', value: 'rejected' },
  ];
  readonly selectedStatuses = signal<ExpenseStatus[]>([]);
  readonly data = signal<Expense[]>([]);
  private readonly sorting = signal<SortingState>([]);

  get personalFilterGroups(): TableFilterGroup[] {
    return [
      {
        key: 'expenseDates',
        label: 'Expense date',
        type: 'date',
        selectedValues: this.selectedMineDates().map((date) => toDateKey(date)),
      },
      this.createCategoryFilterGroup(this.selectedMineCategories()),
    ];
  }

  get allUserFilterGroups(): TableFilterGroup[] {
    return [
      {
        key: 'expenseDates',
        label: 'Expense date',
        type: 'date',
        selectedValues: this.selectedDates().map((date) => toDateKey(date)),
      },
      {
        key: 'status',
        label: 'Status',
        type: 'checkbox',
        options: this.statuses.map((item) => ({ ...item, value: item.value })),
        selectedValues: this.selectedStatuses().map(String),
      },
      this.createCategoryFilterGroup(this.selectedAllCategories()),
    ];
  }

  private createCategoryFilterGroup(
    selectedCategories: ExpenseCategoryType[],
  ): TableFilterGroup {
    return {
      key: 'category',
      label: 'Category',
      type: 'checkbox',
      options: this.categoryOptions().map((item) => ({
        id: item.value,
        label: item.label,
        value: item.value,
      })),
      selectedValues: selectedCategories,
    };
  }
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
  private readonly allUserColumns = columnHelper.columns([
    columnHelper.accessor('userName', { header: 'User', sortFn: 'text' }),
    columnHelper.accessor(
      (expense) => MOCK_USERS.find((user) => user.id === expense.userId)?.email ?? '',
      { id: 'userEmail', header: 'Email', sortFn: 'text' },
    ),
    ...this.personalColumns,
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) =>
        flexRenderComponent(ExpenseActionsMenu, {
          inputs: { expense: info.row.original, updateStatus: this.handleStatusChange },
        }),
      enableSorting: false,
    }),
  ]);
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
        map((params) => ({
          view: this.isAdmin && params.get('view') === 'all' ? ('all' as const) : ('mine' as const),
          search: params.get('search') ?? '',
          expenseDates: parseDates(params.getAll('expenseDates')),
          categories: params
            .getAll('categories')
            .filter((category): category is ExpenseCategoryType =>
              this.categoryValues.includes(category as ExpenseCategoryType),
            ),
          statuses: params
            .getAll('statuses')
            .filter((status): status is ExpenseStatus =>
              this.statuses.some((item) => item.value === status),
            ),
        })),
        tap(({ view, search, expenseDates, categories, statuses }) => {
          this.activeView.set(view);
          this.searchControl.setValue(search, { emitEvent: false });
          if (view === 'mine') {
            this.selectedMineDates.set(expenseDates);
            this.selectedMineCategories.set(categories);
          } else {
            this.selectedDates.set(expenseDates);
            this.selectedStatuses.set(statuses);
            this.selectedAllCategories.set(categories);
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
//https://support.google.com/youtube/contact/familyplan_support
  onTabActivated(tab: string): void {
    if (!this.isAdmin) return;

    const nextView = tab === 'all' ? 'all' : 'mine';
    if (nextView === this.activeView()) return;

    if (this.activeView() === 'mine') {
      this.searchControl.setValue('', { emitEvent: false });
      this.selectedMineDates.set([]);
      this.selectedMineCategories.set([]);
    } else {
      this.searchControl.setValue('', { emitEvent: false });
      this.selectedDates.set([]);
      this.selectedStatuses.set([]);
      this.selectedAllCategories.set([]);
    }

    this.activeView.set(nextView);
    this.table.setPageIndex(0);
    this.updateFilterQueryParams();
  }

  onFilterChange(change: TableFilterChange): void {
    if (change.key === 'status') {
      this.selectedStatuses.set(
        this.statuses
          .filter((item) => change.selectedValues.includes(item.value))
          .map((item) => item.value),
      );
      this.updateFilterQueryParams();
      return;
    }

    if (change.key === 'category') {
      const selectedCategories = change.selectedValues.filter(
        (value): value is ExpenseCategoryType =>
          this.categoryValues.includes(value as ExpenseCategoryType),
      );
      if (this.activeView() === 'all') {
        this.selectedAllCategories.set(selectedCategories);
      } else {
        this.selectedMineCategories.set(selectedCategories);
      }
      this.updateFilterQueryParams();
      return;
    }

    if (change.key === 'expenseDates') {
      const dates = parseDates(change.selectedValues);
      if (this.activeView() === 'all') {
        this.selectedDates.set(dates);
      } else {
        this.selectedMineDates.set(dates);
      }
      this.updateFilterQueryParams();
    }
  }

  onCreateDialogStateChange(state: string): void {
    if (state === 'open' || state === 'closed') {
      this.createDialogState.set(state);
    }
  }

  createExpense(): void {
    if (this.createExpenseForm.invalid) {
      this.createExpenseForm.markAllAsTouched();
      return;
    }

    const formValue = this.createExpenseForm.getRawValue();
    if (
      formValue.amount === null ||
      formValue.category === null ||
      formValue.expenseDate === null
    ) {
      return;
    }

    const input: CreateExpenseInput = {
      title: formValue.title,
      description: formValue.description,
      amount: formValue.amount,
      currency: formValue.currency,
      category: formValue.category,
      expenseDate: formValue.expenseDate,
    };

    this.isSubmitting.set(true);
    this._expenseService
      .createExpense(input)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          toast.success('Expense created');
          this.createExpenseForm.reset({
            title: '',
            description: '',
            amount: null,
            currency: 'USD',
            category: null,
            expenseDate: null,
          });
          this.createDialogState.set('closed');
          this.reloadPersonalExpenses();
          this.isSubmitting.set(false);
        },
        error: (error) => {
          toast.error('Unable to create expense');
          this.isSubmitting.set(false);
        },
      });
  }

  onExpenseDatesChange(dates: Date[] | undefined): void {
    this.selectedDates.set(dates ?? []);
    this.updateFilterQueryParams();
  }

  clearFilters(): void {
    if (this.activeView() === 'all') {
      this.searchControl.setValue('', { emitEvent: false });
      this.selectedDates.set([]);
      this.selectedStatuses.set([]);
      this.selectedAllCategories.set([]);
    } else {
      this.searchControl.setValue('', { emitEvent: false });
      this.selectedMineDates.set([]);
      this.selectedMineCategories.set([]);
    }
    this.updateFilterQueryParams();
  }

  toggleStatus(status: ExpenseStatus, checked: boolean): void {
    this.selectedStatuses.update((selected) =>
      checked ? [...selected, status] : selected.filter((item) => item !== status),
    );
    this.updateFilterQueryParams();
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

  private reloadPersonalExpenses(): void {
    this._expenseService
      .getExpenses({
        scope: 'mine',
        search: this.searchControl.value,
        expenseDates: this.selectedMineDates(),
        categories: this.selectedMineCategories(),
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(({ data }) => this.data.set(data));
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
      expenseDates: (isAllView ? this.selectedDates() : this.selectedMineDates()).map((date) =>
        toDateKey(date),
      ),
      categories: isAllView ? this.selectedAllCategories() : this.selectedMineCategories(),
      statuses: isAllView ? this.selectedStatuses() : [],
    });
  }
}
