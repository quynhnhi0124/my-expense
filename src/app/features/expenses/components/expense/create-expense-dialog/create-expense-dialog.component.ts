import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ExpenseCategoryType } from '@features/expenses/models/expense.interface';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';

@Component({
  selector: 'create-expense-dialog',
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmDatePickerImports,
    HlmDialogImports,
    HlmInputImports,
    HlmSelectImports,
  ],
  templateUrl: './create-expense-dialog.component.html',
})
export class CreateExpenseDialog {
  readonly createDialogState = input<'open' | 'closed'>('closed');
  readonly createExpenseForm = input.required<FormGroup>();
  readonly categoryOptions = input.required<{ value: ExpenseCategoryType; label: string }[]>();
  readonly isSubmitting = input(false);
  readonly createDialogStateChange = output<'open' | 'closed'>();
  readonly createExpense = output<void>();
}
