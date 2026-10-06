import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowUp, lucideArrowUpDown } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  FlexRender,
  type AngularTable,
  type RowData,
  type TableFeature,
  type TableFeatures,
} from '@tanstack/angular-table';

type CommonTableFeatures = TableFeatures & {
  rowSortingFeature: TableFeature;
  rowPaginationFeature: TableFeature;
};

@Component({
  selector: 'app-common-table',
  imports: [FlexRender, HlmTableImports, HlmButtonImports, NgIcon],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideArrowUpDown })],
  templateUrl: './common-table.html',
})
export class CommonTable<
  TFeatures extends CommonTableFeatures = CommonTableFeatures,
  TData extends RowData = RowData,
> {
  readonly table = input.required<AngularTable<TFeatures, TData>>();
  readonly emptyMessage = input('No records found.');
  readonly showPagination = input(true);
  readonly showSorting = input(true);

  get renderedTable(): AngularTable<any, TData> {
    return this.table() as unknown as AngularTable<any, TData>;
  }
}