import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
  lucideCalendarDays,
  lucideEllipsis,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCalendarImports } from '@spartan-ng/helm/calendar';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import {
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  flexRenderComponent,
  FlexRender,
  injectTable,
  isFunction,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  SortingState,
  tableFeatures,
} from '@tanstack/angular-table';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { AuthService } from '@core/auth/services/auth.service';
import { Role } from '@features/users/user.enum';
import { Expense, ExpenseCategoryType, ExpenseStatus } from '../../expense.interface';
import { CreateExpenseInput, ExpenseScope, ExpenseService } from '../../expense.service';
import { MOCK_USERS } from '@features/users/data/users.data';
import { ExpenseCategoryService } from '../../expense-category.service';
import { ExpenseCategory } from '../../expense-category.interface';

const expenseTableFeatures = tableFeatures({
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
const columnHelper = createAppColumnHelper<Expense>();
type ExpenseStatusChangeHandler = (expenseId: number, status: ExpenseStatus) => void;

@Component({
  imports: [HlmBadgeImports],
  template: `<span hlmBadge [class]="badgeClass() + ' first-letter:uppercase'">{{ status() }}</span>`,
})
class ExpenseStatusLabel {
  readonly status = input.required<ExpenseStatus>();

  protected readonly badgeClass = computed(() => {
    const classes: Record<ExpenseStatus, string> = {
      draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    };

    return classes[this.status()];
  });
}

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
    ReactiveFormsModule,
    HlmTableImports,
    HlmButtonImports,
    HlmInputImports,
    HlmCalendarImports,
    HlmCheckboxImports,
    HlmDatePickerImports,
    HlmDialogImports,
    HlmPopoverImports,
    HlmSelectImports,
    NgIcon,
    HlmDropdownMenuImports,
    HlmTabsImports,
    FlexRender,
    NgTemplateOutlet,
  ],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideArrowUpDown, lucideCalendarDays })],
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
  readonly emailSearchControl = new FormControl('', { nonNullable: true });
  readonly activeView = signal<ExpenseScope>('mine');
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
  readonly selectedDates = signal<Date[]>([]);
  readonly statuses: ExpenseStatus[] = ['draft', 'pending', 'approved', 'rejected'];
  readonly selectedStatuses = signal<ExpenseStatus[]>([]);
  readonly data = signal<Expense[]>([]);
  private readonly sorting = signal<SortingState>([]);
  private readonly personalColumns = columnHelper.columns([
    columnHelper.accessor('title', { header: 'Expense', sortFn: 'text' }),
    columnHelper.accessor('amount', {
      header: 'Amount',
      sortFn: 'alphanumeric',
      cell: (info) =>
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: info.row.original.currency,
        }).format(info.getValue()),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      sortFn: 'text',
      cell: (info) => this.formatLabel(info.getValue()),
    }),
    columnHelper.accessor('expenseDate', {
      header: 'Expense date',
      sortFn: 'alphanumeric',
      cell: (info) => new DatePipe('en-US').transform(info.getValue(), 'mediumDate') ?? '',
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      sortFn: 'text',
      cell: (info) =>
        flexRenderComponent(ExpenseStatusLabel, { inputs: { status: info.getValue() } }),
    }),
  ]);
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
      .subscribe(({ data }) => this.availableCategories.set(data.filter((category) => category.isActive)));

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.updateFilterQueryParams()),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe();

    this.emailSearchControl.valueChanges
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
          view: this.isAdmin && params.get('view') === 'all' ? 'all' as const : 'mine' as const,
          search: params.get('search') ?? '',
          email: params.get('email') ?? '',
          expenseDates: this.parseDates(params.getAll('expenseDates')),
          statuses: params
            .getAll('statuses')
            .filter((status): status is ExpenseStatus => this.statuses.includes(status as ExpenseStatus)),
        })),
        tap(({ view, search, email, expenseDates, statuses }) => {
          this.activeView.set(view);
          this.searchControl.setValue(search, { emitEvent: false });
          this.emailSearchControl.setValue(email, { emitEvent: false });
          this.selectedDates.set(expenseDates);
          this.selectedStatuses.set(statuses);
          this.table.setPageIndex(0);
        }),
        switchMap(({ view, search, email, expenseDates, statuses }) =>
          this._expenseService.getExpenses({
            scope: view,
            search: view === 'mine' ? search : '',
            emailSearch: view === 'all' ? email : '',
            expenseDates: view === 'mine' ? expenseDates : [],
            statuses: view === 'mine' ? statuses : [],
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

    this.activeView.set(nextView);
    this.table.setPageIndex(0);
    this.updateFilterQueryParams();
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
    if (formValue.amount === null || formValue.category === null || formValue.expenseDate === null) {
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
          console.log(error,32232)
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
    this.searchControl.setValue('', { emitEvent: false });
    this.selectedDates.set([]);
    this.selectedStatuses.set([]);
    this.updateFilterQueryParams();
  }

  clearEmailSearch(): void {
    this.emailSearchControl.setValue('', { emitEvent: false });
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
            expenses.map((expense) => (expense.id === updatedExpense.id ? updatedExpense : expense)),
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
        expenseDates: this.selectedDates(),
        statuses: this.selectedStatuses(),
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

    return categoryTypes[name.trim().toLocaleLowerCase()] ?? null;
  }

  private updateFilterQueryParams(): void {
    void this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        view: this.isAdmin && this.activeView() === 'all' ? 'all' : null,
        search: this.searchControl.value.trim() || null,
        email: this.emailSearchControl.value.trim() || null,
        expenseDates: this.selectedDates().map((date) => this.toDateKey(date)),
        statuses: this.selectedStatuses(),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private parseDates(values: string[]): Date[] {
    return values.flatMap((value) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (!match) return [];

      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return date.getFullYear() === Number(year) &&
        date.getMonth() === Number(month) - 1 &&
        date.getDate() === Number(day)
        ? [date]
        : [];
    });
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}