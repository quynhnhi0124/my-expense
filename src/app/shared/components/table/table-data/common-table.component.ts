import { Component, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowUp, lucideArrowUpDown } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  FlexRender,
  type AngularTable,
} from '@tanstack/angular-table';

@Component({
  selector: 'app-common-table',
  imports: [FlexRender, HlmTableImports, HlmButtonImports, HlmSpinnerImports, NgIcon],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideArrowUpDown })],
  templateUrl: './common-table.html',
})
export class CommonTable {
  readonly table = input.required<unknown>();
  readonly emptyMessage = input('No records found.');
  readonly loading = input(false);
  readonly showPagination = input(true);
  readonly showSorting = input(true);

  get renderedTable(): AngularTable<any, any> {
    return this.table() as AngularTable<any, any>;
  }

  get pageCount(): number {
    return Math.max(this.renderedTable.getPageCount(), 1);
  }
}