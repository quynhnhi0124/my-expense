import { DatePipe } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { CategoryStatusHandler, ExpenseCategory } from '@features/expense-categories/data';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';

@Component({
  imports: [DatePipe, HlmButtonImports, HlmDialogImports, HlmDropdownMenuImports, NgIcon],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './category-action-dialog.component.html',
})
export class CategoryActionsButton {
  readonly category = input.required<ExpenseCategory>();
  readonly updateStatus = input.required<CategoryStatusHandler>();
  readonly dialogState = signal<'open' | 'closed'>('closed');

  onDialogStateChange(state: string): void {
    if (state === 'open' || state === 'closed') {
      this.dialogState.set(state);
    }
  }

  setStatus(isActive: boolean): void {
    this.updateStatus()(this.category().id, isActive);
    this.dialogState.set('closed');
  }
}
