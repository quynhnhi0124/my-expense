import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowUp, lucideArrowUpDown } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  createTableHook,
  rowPaginationFeature,
  columnFilteringFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  createFilteredRowModel,
  filterFn_includesString,
  filterFn_inNumberRange,
  injectTable,
  FlexRender,
  isFunction,
  SortingState,
} from '@tanstack/angular-table';
import { User } from '@features/users/user.interface';
import { UserService } from '@features/users/user.service';
import { UserActionsButton } from '@features/users/components/user-table-actions/user-table-actions';
import { debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs';

export const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortFns: {
    text: sortFn_text,
    alphanumeric: sortFn_alphanumeric,
  },
  filterFns: {
    includesString: filterFn_includesString,
    inNumberRange: filterFn_inNumberRange,
  },
});

export type UserTableFeatures = typeof features;
export const {
  injectAppTable,
  injectTableContext,
  createAppColumnHelper,
} = createTableHook({
  features,
  debugTable: true,
});
const columnHelper = createAppColumnHelper<User>();

@Component({
  imports: [ReactiveFormsModule, HlmTableImports, HlmButtonImports, HlmInputImports, NgIcon, FlexRender],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideArrowUpDown })],
  selector: 'app-user-list',
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  private readonly _userService = inject(UserService);
  private readonly _destroyRef = inject(DestroyRef);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly data = signal<User[]>([]);
  private readonly sorting = signal<SortingState>([]);
  readonly columns = columnHelper.columns([
    columnHelper.accessor('firstName', {
      header: 'First name',
      sortFn: 'text',
    }),
    columnHelper.accessor('lastName', {
      header: 'Last name',
      sortFn: 'text',
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      sortFn: 'text',
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      sortFn: 'text',
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) => (info.getValue() ? 'Active' : 'Inactive'),
      sortFn: 'alphanumeric',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: () => UserActionsButton,
      enableSorting: false,
    }),
  ]);

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.table.setPageIndex(0)),
        switchMap((search) => this._userService.getUsers({ search })),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(({ data }) => this.data.set(data));
  }

  readonly table = injectTable(() => ({
    key: 'user-list',
    features,
    columns: this.columns,
    data: this.data(),
    getRowId: (row) => String(row.id),
    debugTable: true,
    state: {
      sorting: this.sorting(),
    },
    onSortingChange: (updater) =>
      isFunction(updater) ? this.sorting.update(updater) : this.sorting.set(updater),
  }));
}
