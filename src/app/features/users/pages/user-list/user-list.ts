import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService } from '@features/users/user.service';
import { ActivatedRoute } from '@angular/router';
import {
  rowSortingFeature,
  columnVisibilityFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  FlexRender,
  createTableHook,
  columnFilteringFeature,
  rowPaginationFeature,
  globalFilteringFeature,
  rowSelectionFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  filterFn_includesString,
  filterFn_inNumberRange,
  flexRenderComponent,
  Updater,
  injectTable,
  FlexRenderCell,
} from '@tanstack/angular-table';
import { User } from '@features/users/user.interface';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { switchMap } from 'rxjs';
// import {
//   TableHeaderSelection,
//   TableRowSelection,
// } from '@features/users/components/user-table-selection';
import { TableFilter } from '@features/users/components/user-table-filter';

export const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  rowSelectionFeature,
  filteredRowModel: createFilteredRowModel(),
  sortFns: {
    text: sortFn_text,
    alphanumeric: sortFn_alphanumeric,
  },
  paginatedRowModel: createPaginatedRowModel(),
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
  imports: [HlmTableImports, TableFilter, FlexRenderCell, FlexRender],
  selector: 'app-user-list',
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  private readonly _userService = inject(UserService);
  private readonly _route = inject(ActivatedRoute);
  readonly data = signal<User[]>([]);
  readonly globalFilter = signal<string>('');
  readonly columns = columnHelper.columns([
    // columnHelper.display({
    //   id: 'select',
    //   header: () => flexRenderComponent(TableHeaderSelection),
    //   cell: () => flexRenderComponent(TableRowSelection),
    // }),
     columnHelper.accessor(
    (row) => `${row.firstName} ${row.lastName}`,
    {
      id: 'fullName',
      header: 'Full name',
    },
  ),
    columnHelper.accessor('email', {
      header: 'Email',
    }),
    columnHelper.accessor('role', {
      header: 'Role',
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: '...',
    }),
  ]);
  //   {
  //     accessorKey: 'fullName',
  //     header: 'Full Name',
  //     cell: ({ row }) => {
  //       const {
  //         original: { firstName, lastName },
  //       } = row;
  //       return `<span>${firstName} ${lastName}</span>`;
  //     },
  //     sortFn: 'text',
  //   },
  //   {
  //     accessorKey: 'email',
  //     header: 'Email',
  //     cell: ({ row }) => {
  //       const {
  //         original: { email },
  //       } = row;
  //       return `<span>${email}</span>`;
  //     },
  //     sortFn: 'text',
  //   },
  //   {
  //     accessorKey: 'role',
  //     header: 'Role',
  //     cell: ({ row }) => {
  //       const {
  //         original: { role },
  //       } = row;
  //       return `<span>${role}</span>`;
  //     },
  //     sortFn: 'text',
  //   },
  //   {
  //     accessorKey: 'isActive',
  //     header: 'Status',
  //     cell: ({ row }) => {
  //       const {
  //         original: { isActive },
  //       } = row;
  //       return `<span>${isActive}</span>`;
  //     },
  //     sortFn: 'text',
  //   },
  //   {
  //     accessorKey: 'actions',
  //     header: 'Actions',
  //     cell: ({ row }) => `<span>...</span>`,
  //   },
  // ];

  public getListUser() {
    this._route.queryParams
      .pipe(
        switchMap((params) => {
          const page = params['page'] || 1;
          const limit = params['limit'] || 10;
          const search = params['search'] || '';
          return this._userService.getUsers({ page, limit, search });
        }),
      )
      .subscribe(({ data, rowCount }) => {
        this.data.set(data);
        console.log(this.data());
      });
  }
  ngOnInit(): void {
    this.getListUser();
  }

  readonly table = injectTable(() => ({
    key: 'row-selection',
    features,
    columns: this.columns,
    data: this.data(),
    getRowId: (row) => String(row.id),
    debugTable: true,
    state: {
      globalFilter: this.globalFilter(),
    },

    onGlobalFilterChange: (updaterOrValue: Updater<string>) => {
      this.globalFilter.set(
        typeof updaterOrValue === 'function' ? updaterOrValue(this.globalFilter()) : updaterOrValue,
      );
    },
  }));

  stringifiedState() {
    return JSON.stringify(this.table.store.get(), null, 2);
  }

  onPageInputChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const page = inputElement.value ? Number(inputElement.value) - 1 : 0;
    this.table.setPageIndex(page);
  }

  onPageSizeChange(event: any): void {
    this.table.setPageSize(Number(event.target.value));
  }

  logSelectedFlatRows(): void {
    console.info('table.getSelectedRowModel().flatRows', this.table.getSelectedRowModel().flatRows);
  }


  onGlobalFilter(event: Event): void {
    this.table.setGlobalFilter((event.target as HTMLInputElement).value);
  }
}
