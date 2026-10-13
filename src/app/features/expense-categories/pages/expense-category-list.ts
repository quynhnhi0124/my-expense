import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import {
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  flexRenderComponent,
  injectTable,
  isFunction,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  SortingState,
  tableFeatures,
} from '@tanstack/angular-table';
import { debounceTime, distinctUntilChanged, finalize, map, switchMap, tap } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { ExpenseCategoryService } from '../services/expense-category.service';
import { CommonTable } from '@shared/components/table/table-data/common-table.component';
import { TableDataHeader } from '@shared/components/table/table-data-header/table-data-header.component';
import { TableDataToolbar } from '@shared/components/table/table-data-toolbar/table-data-toolbar.component';
import { FilterItem, TableFilterChange, TableFilterGroup } from '@shared/interfaces/data.interface';
import {
  StatusBadge,
  StatusBadgeProps,
} from '@shared/components/status-badge/status-badge.component';
import { updateTableFilterQueryParams } from '@shared/utils';
import { CategoryActionsButton } from '@features/expense-categories/components/category-action-dialog/category-action-dialog.component';
import { CreateExpenseCategory } from '@features/expense-categories/components/create-expense-category/create-expense-category.component';

import { BrnDialogState } from '@spartan-ng/brain/dialog';
import { ExpenseCategoryStore } from '../data/store/expense-categories.store';
import { CategoryStatus, CategoryStatusLabel, ExpenseCategory, ExpenseCategoryParams } from '@features/expense-categories/data';

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    text: sortFn_text,
    basic: sortFn_basic,
  },
});

const { createAppColumnHelper } = createTableHook({
  features,
});
const columnHelper = createAppColumnHelper<ExpenseCategory>();

const categoryStatusBadges: Record<string, StatusBadgeProps> = {
  active: { label: CategoryStatusLabel[CategoryStatus.ACTIVE] },
  inactive: { label: CategoryStatusLabel[CategoryStatus.INACTIVE], variant: 'outline' },
};

@Component({
  imports: [
    HlmButtonImports,
    CommonTable,
    TableDataHeader,
    TableDataToolbar,
    CreateExpenseCategory,
  ],
  selector: 'app-expense-category-list',
  styleUrl: './expense-category-list.css',
  templateUrl: './expense-category-list.html',
})
export class ExpenseCategoryList implements OnInit {
  private readonly _categoryService = inject(ExpenseCategoryService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly store = inject(ExpenseCategoryStore);
  private readonly sorting = signal<SortingState>([]);
  
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<CategoryStatus[]>([], { nonNullable: true });
  readonly statuses: FilterItem<CategoryStatus>[] = [
    { id: 'status-active', label: CategoryStatusLabel[CategoryStatus.ACTIVE], value: CategoryStatus.ACTIVE },
    { id: 'status-inactive', label: CategoryStatusLabel[CategoryStatus.INACTIVE], value: CategoryStatus.INACTIVE },
  ];
  readonly loading = signal<boolean>(false);
  readonly createDialogState = signal<BrnDialogState>('closed');
  readonly data = signal<ExpenseCategory[]>([]);

  get filterGroups(): TableFilterGroup[] {
    return [
      {
        key: 'status',
        label: 'Status',
        options: this.statuses,
        selectedValues: this.statusControl.value,
      },
    ];
  }

  readonly columns = columnHelper.columns([
    columnHelper.accessor('name', {
      header: 'Name',
      sortFn: 'text',
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      sortFn: 'text',
      cell: (info) => info.getValue() || '-',
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) =>
        flexRenderComponent(StatusBadge, {
          inputs: {
            dataBadge: categoryStatusBadges[info.getValue() ? 'active' : 'inactive'],
          },
        }),
      sortFn: 'basic',
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      sortFn: 'basic',
      cell: (info) => new DatePipe('en-US').transform(info.getValue(), 'mediumDate') ?? '',
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Updated',
      sortFn: 'basic',
      cell: (info) => new DatePipe('en-US').transform(info.getValue(), 'mediumDate') ?? '',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) =>
        flexRenderComponent(CategoryActionsButton, {
          inputs: { category: info.row.original, updateStatus: this.updateCategoryStatus },
        }),
      enableSorting: false,
    }),
  ]);

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.updateSearchQueryParam()),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe();

    this._route.queryParamMap
      .pipe(
        map((params) => this.parseFilters(params)),
        tap((filters) => {
          this.syncFilterControls(filters);
          this.loading.set(true);
        }),
        switchMap((filters) =>
          this.loadCategories(filters).pipe(finalize(() => this.loading.set(false))),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe();
  }

  readonly table = injectTable(() => ({
    key: 'expense-category-list',
    features,
    columns: this.columns,
    data: this.data(),
    getRowId: (category) => String(category.id),
    state: {
      sorting: this.sorting(),
    },
    onSortingChange: (updater) =>
      isFunction(updater) ? this.sorting.update(updater) : this.sorting.set(updater),
  }));

  private parseFilters(params: ParamMap): ExpenseCategoryParams {
    return {
      search: params.get('search') ?? '',
      statuses: params
        .getAll('status')
        .filter((status): status is CategoryStatus => status === CategoryStatus.ACTIVE || status === CategoryStatus.INACTIVE),
    };
  }

  private syncFilterControls(filters: ExpenseCategoryParams): void {
    this.searchControl.setValue(filters.search ?? "", { emitEvent: false });
    this.statusControl.setValue(filters.statuses, { emitEvent: false });
    this.table.setPageIndex(0);
  }

  private filtersFromControls(): ExpenseCategoryParams {
    return {
      search: this.searchControl.value.trim(),
      statuses: this.statusControl.value,
    };
  }

  private loadCategories(filters: ExpenseCategoryParams) {
    return this._categoryService
      .getCategories(filters)
      .pipe(tap(({ data }) => this.data.set(data)));
  }

  private updateSearchQueryParam(): void {
    updateTableFilterQueryParams(this._router, this._route, {
      search: this.searchControl.value.trim() || null,
      status: this.statusControl.value,
    });
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue([], { emitEvent: false });
    this.updateSearchQueryParam();
  }

  onFilterChange(change: TableFilterChange): void {
    if (change.key !== 'status') {
      return;
    }

    this.statusControl.setValue(
      this.statuses
        .filter((item) => change.selectedValues.includes(item.value))
        .map((item) => item.value),
      { emitEvent: false },
    );

    this.updateSearchQueryParam();
  }

  onCreateDialogStateChange(state: string): void {
    if (state === 'open' || state === 'closed') this.createDialogState.set(state);
  }

  onCategoryCreated(): void {
    this.reloadCategories();
  }

  private readonly updateCategoryStatus = (categoryId: string, isActive: boolean): void => {
    this._categoryService.updateCategoryStatus(categoryId, isActive).subscribe({
      next: () => {
        toast.success(isActive ? 'Category activated' : 'Category deactivated');
        this.reloadCategories();
      },
      error: () => toast.error('Unable to update category status'),
    });
  };

  private reloadCategories(): void {
    this.loadCategories(this.filtersFromControls())
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe();
  }
}
