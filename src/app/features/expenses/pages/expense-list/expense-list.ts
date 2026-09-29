import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideArrowUpDown,
  lucideCalendarDays,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCalendarImports } from '@spartan-ng/helm/calendar';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmTableImports } from '@spartan-ng/helm/table';
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
import { combineLatest, debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs';
import { AuthService } from '@core/auth/services/auth.service';
import { Role } from '@features/users/user.enum';
import { Expense, ExpenseStatus } from '../../expense.interface';
import { ExpenseService } from '../../expense.service';

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
  imports: [
    ReactiveFormsModule,
    HlmTableImports,
    HlmButtonImports,
    HlmInputImports,
    HlmCalendarImports,
    HlmCheckboxImports,
    HlmPopoverImports,
    NgIcon,
    FlexRender,
  ],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideArrowUpDown, lucideCalendarDays })],
  selector: 'app-expense-list',
  styleUrl: './expense-list.css',
  templateUrl: './expense-list.html',
})
export class ExpenseList implements OnInit {
  private readonly _expenseService = inject(ExpenseService);
  private readonly _authService = inject(AuthService);
  private readonly _destroyRef = inject(DestroyRef);
  readonly isAdmin = this._authService.getCurrentUser()?.role === Role.ADMIN;
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly selectedDates = signal<Date[]>([]);
  private readonly selectedDates$ = toObservable(this.selectedDates);
  readonly statuses: ExpenseStatus[] = ['draft', 'pending', 'approved', 'rejected'];
  readonly selectedStatuses = signal<ExpenseStatus[]>([]);
  private readonly selectedStatuses$ = toObservable(this.selectedStatuses);
  readonly data = signal<Expense[]>([]);
  private readonly sorting = signal<SortingState>([]);
  readonly columns = columnHelper.columns([
    ...(this.isAdmin
      ? [columnHelper.accessor('userName', { header: 'User', sortFn: 'text' as const })]
      : []),
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

  ngOnInit(): void {
    const search$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
    );

    combineLatest([search$, this.selectedDates$, this.selectedStatuses$])
      .pipe(
        tap(() => this.table.setPageIndex(0)),
        switchMap(([search, expenseDates, statuses]) =>
          this._expenseService.getExpenses({ search, expenseDates, statuses }),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(({ data }) => this.data.set(data));
  }

  onExpenseDatesChange(dates: Date[] | undefined): void {
    this.selectedDates.set(dates ?? []);
  }

  clearFilters(): void {
    this.selectedDates.set([]);
    this.selectedStatuses.set([]);
  }

  toggleStatus(status: ExpenseStatus, checked: boolean): void {
    this.selectedStatuses.update((selected) =>
      checked ? [...selected, status] : selected.filter((item) => item !== status),
    );
  }

  readonly table = injectTable(() => ({
    key: 'expense-list',
    features: expenseTableFeatures,
    columns: this.columns,
    data: this.data(),
    getRowId: (expense) => String(expense.id),
    state: { sorting: this.sorting() },
    onSortingChange: (updater) =>
      isFunction(updater) ? this.sorting.update(updater) : this.sorting.set(updater),
  }));

  private formatLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');
  }
}