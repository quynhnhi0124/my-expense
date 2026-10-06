import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import {
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  createTableHook,
  rowPaginationFeature,
  createSortedRowModel,
  createPaginatedRowModel,
  flexRenderComponent,
  injectTable,
  isFunction,
  SortingState,
  sortFn_basic,
} from '@tanstack/angular-table';
import { User, UserStatus } from '@features/users/models/user.interface';
import { UserService } from '@features/users/services/user.service';
import {
  UserActionsButton,
  UserRoleAction,
  UserStatusActionHandler,
} from '@features/users/components/user-table-actions/user-table-actions';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  map,
  Observable,
  switchMap,
  tap,
} from 'rxjs';
import { Role } from '@features/users/models/user.enum';
import { toast } from '@spartan-ng/brain/sonner';
import { CommonTable } from '@shared/components/table/table-data/common-table.component';
import { TableDataHeader } from '@shared/components/table/table-data-header/table-data-header.component';
import { FilterItem, TableFilterChange, TableFilterGroup } from '@shared/interfaces/data.interface';
import {
  TableDataToolbar,
} from '@shared/components/table/table-data-toolbar/table-data-toolbar.component';
import {
  StatusBadge,
  StatusBadgeProps,
} from '@shared/components/status-badge/status-badge.component';
import { updateTableFilterQueryParams } from '@shared/utils';

export const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    text: sortFn_text,
    basic: sortFn_basic,
  },
});

export type UserTableFeatures = typeof features;
export const { createAppColumnHelper } = createTableHook({
  features,
});
const columnHelper = createAppColumnHelper<User>();

const userStatusBadges: Record<string, StatusBadgeProps> = {
  true: { label: 'Active'},
  false: { label: 'Inactive', variant: 'outline' },
};

interface UserListFilters {
  search: string;
  roles: Role[];
  statuses: UserStatus[];
}

@Component({
  imports: [
    CommonTable,
    TableDataHeader,
    TableDataToolbar,
  ],
  selector: 'app-user-list',
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  private readonly _userService = inject(UserService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly roleControl = new FormControl<Role[]>([], { nonNullable: true });
  readonly statusControl = new FormControl<UserStatus[]>([], { nonNullable: true });
  readonly roles: FilterItem<Role>[] = [
    { id: 'role-admin', label: 'Admin', value: Role.ADMIN },
    { id: 'role-user', label: 'User', value: Role.USER },
  ];
  readonly statuses: FilterItem<UserStatus>[] = [
    { id: 'status-active', label: 'Active', value: 'active' },
    { id: 'status-inactive', label: 'Inactive', value: 'inactive' },
  ];
  readonly data = signal<User[]>([]);
  private readonly sorting = signal<SortingState>([]);

  get filterGroups(): TableFilterGroup[] {
    return [
      {
        key: 'role',
        label: 'Role',
        options: this.roles.map((item) => ({ ...item, value: item.value })),
        selectedValues: this.roleControl.value.map(String),
      },
      {
        key: 'status',
        label: 'Status',
        options: this.statuses.map((item) => ({ ...item, value: item.value })),
        selectedValues: this.statusControl.value,
      },
    ];
  }
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
      cell: (info) =>
        flexRenderComponent(StatusBadge, {
          inputs: { dataBadge: userStatusBadges[String(info.getValue())] },
        }),
      sortFn: 'basic',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) =>
        flexRenderComponent(UserActionsButton, {
          inputs: {
            user: info.row.original,
            updateStatus: this.updateUserStatus,
            updateRole: this.updateUserRole,
          },
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
        tap((filters) => this.syncFilterControls(filters)),
        switchMap((filters) => this.loadUsers(filters)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe();
  }

  readonly table = injectTable<UserTableFeatures, User>(() => ({
    key: 'user-list',
    features,
    columns: this.columns,
    data: this.data(),
    getRowId: (row) => String(row.id),
    state: {
      sorting: this.sorting(),
    },
    onSortingChange: (updater) =>
      isFunction(updater) ? this.sorting.update(updater) : this.sorting.set(updater),
  }));

  private updateSearchQueryParam(): void {
    updateTableFilterQueryParams(this._router, this._route, {
      search: this.searchControl.value.trim() || null,
      role: this.roleControl.value,
      status: this.statusControl.value,
    });
  }

  private parseFilters(params: ParamMap): UserListFilters {
    return {
      search: params.get('search') ?? '',
      roles: params
        .getAll('role')
        .filter((role): role is Role => role === Role.ADMIN || role === Role.USER),
      statuses: params
        .getAll('status')
        .filter((status): status is UserStatus => status === 'active' || status === 'inactive'),
    };
  }

  private syncFilterControls(filters: UserListFilters): void {
    this.searchControl.setValue(filters.search, { emitEvent: false });
    this.roleControl.setValue(filters.roles, { emitEvent: false });
    this.statusControl.setValue(filters.statuses, { emitEvent: false });
    this.table.setPageIndex(0);
  }

  private filtersFromControls(): UserListFilters {
    return {
      search: this.searchControl.value.trim(),
      roles: this.roleControl.value,
      statuses: this.statusControl.value,
    };
  }

  private loadUsers(filters: UserListFilters) {
    return this._userService.getUsers(filters).pipe(
      tap(({ data }) => this.data.set(data)),
    );
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.roleControl.setValue([], { emitEvent: false });
    this.statusControl.setValue([], { emitEvent: false });
    this.updateSearchQueryParam();
  }

  onFilterChange(change: TableFilterChange): void {
    switch (change.key) {
      case 'role':
        this.roleControl.setValue(
          this.roles
            .filter((item) => change.selectedValues.includes(item.value))
            .map((item) => item.value),
          { emitEvent: false },
        );
        break;

      case 'status':
        this.statusControl.setValue(
          this.statuses
            .filter((item) => change.selectedValues.includes(item.value))
            .map((item) => item.value),
          { emitEvent: false },
        );
        break;

      default:
        return;
    }

    this.updateSearchQueryParam();
  }

  private readonly updateUserStatus: UserStatusActionHandler = (userId, action) =>
    this.updateUserAndReload(
      this._userService.updateUserStatus(userId, action === 'activate'),
      'User status updated',
      'Unable to update user status',
    );

  private readonly updateUserRole: UserRoleAction = (userId, role) =>
    this.updateUserAndReload(
      this._userService.updateUserRole(userId, role),
      'User role updated',
      'Unable to update user role',
    );

  private updateUserAndReload(
    update$: Observable<User>,
    successMessage: string,
    errorMessage: string,
  ): Observable<User> {
    return update$.pipe(
      switchMap((updatedUser) =>
        this.loadUsers(this.filtersFromControls()).pipe(map(() => updatedUser)),
      ),
      tap(() => toast.success(successMessage)),
      catchError(() => {
        toast.error(errorMessage);
        return EMPTY;
      }),
    );
  }
}
