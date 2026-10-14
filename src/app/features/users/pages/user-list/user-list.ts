import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
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
import { User } from '@features/users/models/user.interface';
import { UserService } from '@features/users/services/user.service';
import { UserActionsButton } from '@features/users/components/user-table-actions/user-table-actions';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { Role, RoleLabel, UserStatus, UserStatusLabel } from '@features/users/models/user.enum';
import { CommonTable } from '@shared/components/table/table-data/common-table.component';
import { TableDataHeader } from '@shared/components/table/table-data-header/table-data-header.component';
import { FilterItem, TableFilterChange, TableFilterGroup } from '@shared/interfaces/data.interface';
import { TableDataToolbar } from '@shared/components/table/table-data-toolbar/table-data-toolbar.component';
import {
  StatusBadge,
  StatusBadgeProps,
} from '@shared/components/status-badge/status-badge.component';
import { updateTableFilterQueryParams } from '@shared/utils';

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

type UserTableFeatures = typeof features;
const { createAppColumnHelper } = createTableHook({
  features,
});
const columnHelper = createAppColumnHelper<User>();

const userStatusBadges: Record<string, StatusBadgeProps> = {
  [UserStatus.ACTIVE]: { label: UserStatusLabel[UserStatus.ACTIVE] },
  [UserStatus.INACTIVE]: { label: UserStatusLabel[UserStatus.INACTIVE], variant: 'outline' },
};

interface UserListFilters {
  search: string;
  role: Role[];
  status: UserStatus[];
}

@Component({
  imports: [CommonTable, TableDataHeader, TableDataToolbar],
  selector: 'app-user-list',
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList {
  private readonly _userService = inject(UserService);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly roleControl = new FormControl<Role[]>([], { nonNullable: true });
  readonly statusControl = new FormControl<UserStatus[]>([], { nonNullable: true });
  readonly roles: FilterItem<Role>[] = [
    { id: 'role-admin', label: RoleLabel[Role.ADMIN], value: Role.ADMIN },
    { id: 'role-user', label: RoleLabel[Role.USER], value: Role.USER },
  ];
  readonly status: FilterItem<UserStatus>[] = [
    { id: 'status-active', label: UserStatusLabel[UserStatus.ACTIVE], value: UserStatus.ACTIVE },
    {
      id: 'status-inactive',
      label: UserStatusLabel[UserStatus.INACTIVE],
      value: UserStatus.INACTIVE,
    },
  ];
  private readonly sorting = signal<SortingState>([]);
  private readonly searchValue = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: this.searchControl.value },
  );
  private readonly routeFilters = toSignal(
    this._route.queryParamMap.pipe(map((params) => this.parseFilters(params))),
    { initialValue: this.parseFilters(this._route.snapshot.queryParamMap) },
  );
  private readonly usersResource = rxResource({
    defaultValue: { data: [], rowCount: 0, skip: 0, limit: 30 },
    params: () => this.routeFilters(),
    stream: ({ params }) => this._userService.getUsers(params),
  });
  readonly data = computed(() => this.usersResource.value().data);
  readonly loading = computed(() => this.usersResource.isLoading());

  get filterGroups(): TableFilterGroup[] {
    return [
      {
        key: 'role',
        label: 'Role',
        options: this.roles,
        selectedValues: this.roleControl.value,
      },
      {
        key: 'status',
        label: 'Status',
        options: this.status,
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
      cell: (role) => RoleLabel[role.getValue()],
      sortFn: 'text',
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) =>
        flexRenderComponent(StatusBadge, {
          inputs: {
            dataBadge: userStatusBadges[info.getValue() ? UserStatus.ACTIVE : UserStatus.INACTIVE],
          },
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
            onUserUpdated: () => this.reloadUsers(),
          },
        }),
      enableSorting: false,
    }),
  ]);

  constructor() {
    effect(() => {
      this.searchValue();
      this.updateSearchQueryParam();
    });

    effect(() => {
      const filters = this.routeFilters();
      this.syncFilterControls(filters);
    });
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
      role: params
        .getAll('role')
        .filter((role): role is Role => role === Role.ADMIN || role === Role.USER),
      status: params
        .getAll('status')
        .filter(
          (status): status is UserStatus =>
            status === UserStatus.ACTIVE || status === UserStatus.INACTIVE,
        ),
    };
  }

  private syncFilterControls(filters: UserListFilters): void {
    this.searchControl.setValue(filters.search, { emitEvent: false });
    this.roleControl.setValue(filters.role, { emitEvent: false });
    this.statusControl.setValue(filters.status, { emitEvent: false });
    this.table.setPageIndex(0);
  }

  private reloadUsers(): void {
    this.usersResource.reload();
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
          this.status
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
}
