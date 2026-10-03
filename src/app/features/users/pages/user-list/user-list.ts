import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowUp, lucideArrowUpDown } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
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
  flexRenderComponent,
  injectTable,
  FlexRender,
  isFunction,
  SortingState,
} from '@tanstack/angular-table';
import { User } from '@features/users/models/user.interface';
import { UserService } from '@features/users/services/user.service';
import { UserActionsButton, UserStatusAction } from '@features/users/components/user-table-actions/user-table-actions';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs';
import { Role } from '@features/users/models/user.enum';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { toast } from '@spartan-ng/brain/sonner';

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
  imports: [HlmBadgeImports],
  template: `<span hlmBadge [variant]="isActive() ? 'secondary' : 'destructive'">{{ isActive() ? 'Active' : 'Inactive' }}</span>`,
})
class UserStatusBadge {
  readonly isActive = input.required<boolean>();
}

@Component({
  imports: [
    ReactiveFormsModule,
    HlmTableImports,
    HlmButtonImports,
    HlmInputImports,
    HlmCheckboxImports,
    HlmPopoverImports,
    NgIcon,
    FlexRender,
  ],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideArrowUpDown })],
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
  readonly statusControl = new FormControl<Array<'active' | 'inactive'>>([], { nonNullable: true });
  readonly roles = [
    { id: 'role-admin', label: 'Admin', value: Role.ADMIN },
    { id: 'role-user', label: 'User', value: Role.USER },
  ];
  readonly statuses = [
    { id: 'status-active', label: 'Active', value: 'active' as const },
    { id: 'status-inactive', label: 'Inactive', value: 'inactive' as const },
  ];
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
      cell: (info) => flexRenderComponent(UserStatusBadge, { inputs: { isActive: info.getValue() } }),
      sortFn: 'alphanumeric',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) =>
        flexRenderComponent(UserActionsButton, {
          inputs: { user: info.row.original, updateStatus: this.updateUserStatus },
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
        map((params) => ({
          search: params.get('search') ?? '',
          roles: params
            .getAll('role')
            .filter((role): role is Role => role === Role.ADMIN || role === Role.USER),
          statuses: params
            .getAll('status')
            .filter((status): status is 'active' | 'inactive' => status === 'active' || status === 'inactive'),
        })),
        tap(({ search, roles, statuses }) => {
          this.searchControl.setValue(search, { emitEvent: false });
          this.roleControl.setValue(roles, { emitEvent: false });
          this.statusControl.setValue(statuses, { emitEvent: false });
          this.table.setPageIndex(0);
        }),
        switchMap(({ search, roles, statuses }) =>
          this._userService.getUsers({
            search,
            roles,
            statuses,
          }),
        ),
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

  private updateSearchQueryParam(): void {
    void this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        search: this.searchControl.value.trim() || null,
        role: this.roleControl.value,
        status: this.statusControl.value,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.roleControl.setValue([], { emitEvent: false });
    this.statusControl.setValue([], { emitEvent: false });
    this.updateSearchQueryParam();
  }

  selectRole(role: Role): void {
    if (!this.roleControl.value.includes(role)) {
      this.roleControl.setValue([...this.roleControl.value, role], { emitEvent: false });
      this.updateSearchQueryParam();
    }
  }

  deselectRole(role: Role): void {
    this.roleControl.setValue(this.roleControl.value.filter((item) => item !== role), { emitEvent: false });
    this.updateSearchQueryParam();
  }

  selectStatus(status: 'active' | 'inactive'): void {
    if (!this.statusControl.value.includes(status)) {
      this.statusControl.setValue([...this.statusControl.value, status], { emitEvent: false });
      this.updateSearchQueryParam();
    }
  }

  deselectStatus(status: 'active' | 'inactive'): void {
    this.statusControl.setValue(this.statusControl.value.filter((item) => item !== status), { emitEvent: false });
    this.updateSearchQueryParam();
  }

  private readonly updateUserStatus = (userId: number, action: UserStatusAction): void => {
    this._userService.updateUserStatus(userId, action === 'activate').subscribe({
      next: (updatedUser) => {
        toast.success('User status updated');
        this.reloadUsers();
      },
      error: () => toast.error('Unable to update user status'),
    });
  };

  private reloadUsers(): void {
    this._userService
      .getUsers({
        search: this.searchControl.value,
        roles: this.roleControl.value,
        statuses: this.statusControl.value,
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(({ data }) => this.data.set(data));
  }
}
