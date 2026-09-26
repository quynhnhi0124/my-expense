import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '@features/users/user.service';
import { ActivatedRoute } from '@angular/router';
import {
  ColumnDef,
  injectTable,
  rowSortingFeature,
  columnVisibilityFeature,
  rowPaginationFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  FlexRender,
} from '@tanstack/angular-table';
import { User } from '@features/users/user.interface';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { switchMap } from 'rxjs';

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  sortFns: {
    text: sortFn_text,
    alphanumeric: sortFn_alphanumeric,
  },
});

export type UserTableFeatures = typeof features;

@Component({
  imports: [HlmTableImports, FlexRender],
  selector: 'app-user-list',
  styleUrl: './user-list.css',
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  private readonly _userService = inject(UserService);
  private readonly _route = inject(ActivatedRoute);
  data: User[] = [];
  readonly columns: ColumnDef<UserTableFeatures, User>[] = [
    {
      accessorKey: 'fullName',
      header: 'Full Name',
      cell: ({ row }) => {
        const {
          original: { firstName, lastName },
        } = row;
        return `<span>${firstName} ${lastName}</span>`;
      },
      sortFn: 'text',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        const {
          original: { email },
        } = row;
        return `<span>${email}</span>`;
      },
      sortFn: 'text',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const {
          original: { role },
        } = row;
        return `<span>${role}</span>`;
      },
      sortFn: 'text',
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const {
          original: { isActive },
        } = row;
        return `<span>${isActive}</span>`;
      },
      sortFn: 'text',
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => `<span>...</span>`,
    },
  ];

  public getListUser() {
    this._route.queryParams.pipe(
      switchMap(params => {
        const page = params['page'] || 1;
        const limit = params['limit'] || 10;
        const search = params['search'] || '';
        return this._userService.getUsers({page, limit, search})
      })
    ).subscribe(({ data, rowCount }) => {
      this.data = data;
    });
  }
  ngOnInit(): void {
    this.getListUser();
  }

  readonly table = injectTable(() => ({
    features,
    columns: this.columns,
    data: this.data,
    getRowId: (row) => String(row.id),
    initialState: { pagination: { pageIndex: 1, pageSize: 20 } },
  }));
}
