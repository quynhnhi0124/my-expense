import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TableFilterChange, TableFilterGroup } from '@shared/interfaces/data.interface';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { TableDataDateFilter } from '@shared/components/table/table-data-date-filter/table-data-date-filter.component';
import { parseDates, toDateKey } from '@shared/utils';

@Component({
  selector: 'table-data-toolbar',
  templateUrl: './table-data-toolbar.html',
  imports: [
    ReactiveFormsModule,
    HlmInputImports,
    HlmPopoverImports,
    HlmCheckboxImports,
    HlmButtonImports,
    TableDataDateFilter,
  ],
})
export class TableDataToolbar {
  readonly searchControl = input.required<FormControl>();
  readonly searchPlaceholder = input<string>('Search');
  readonly filterGroups = input<TableFilterGroup[]>();
  readonly filterChange = output<TableFilterChange>();
  readonly clear = output<void>();
  readonly parseDate = parseDates;

  hasActiveFilters(): boolean {
    return (
      Boolean(this.searchControl()?.value) ||
      !!this.filterGroups()?.some((group) => group.selectedValues.length > 0)
    );
  }

  toggleFilter(group: TableFilterGroup, value: string, checked: boolean): void {
    const selectedValues = new Set(group.selectedValues as string[]);
    if (checked) {
      selectedValues.add(value);
    } else {
      selectedValues.delete(value);
    }
    this.filterChange.emit({ key: group.key, selectedValues: [...selectedValues] });
  }

  onDateFilterChange(group: TableFilterGroup, dates: Date[] | undefined): void {
    const selectedValues = (dates ?? []).map((date) => toDateKey(date));
    this.filterChange.emit({ key: group.key, selectedValues });
  }
}
