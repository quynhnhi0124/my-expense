import { Component, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendarDays } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCalendarImports } from '@spartan-ng/helm/calendar';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';

@Component({
  selector: 'table-data-date-filter',
  templateUrl: './table-data-date-filter.html',
  imports: [NgIcon, HlmButtonImports, HlmPopoverImports, HlmCalendarImports],
  providers: [provideIcons({ lucideCalendarDays })],
})
export class TableDataDateFilter {
  readonly selectedDates = input<Date[]>([]);
  readonly label = input<string>('Expense date');
  readonly dateChange = output<Date[]>();

  get selectedLabel(): string {
    const count = this.selectedDates().length;
    if (!count) {
      return this.label();
    }

    return `${count} ${count > 1 ? 'dates' : 'date'} selected`;
  }

  onDateChange(dates: Date[] | undefined): void {
    this.dateChange.emit(dates ?? []);
  }
}
