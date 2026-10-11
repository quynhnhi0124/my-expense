import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpenseCategoryType } from '@features/expenses/models/expense.interface';
import { ExpenseService } from '@features/expenses/services/expense.service';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { finalize } from 'rxjs';

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
  private readonly _expenseService = inject(ExpenseService);
  private readonly _destroyRef = inject(DestroyRef);
  readonly createDialogState = input<'open' | 'closed'>('closed');
  readonly categoryOptions = input.required<{ value: ExpenseCategoryType; label: string }[]>();
  readonly isSubmitting = signal(false);
  readonly createDialogStateChange = output<'open' | 'closed'>();
  readonly expenseCreated = output<void>();
  readonly createExpenseForm = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: new FormControl('', { nonNullable: true }),
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    currency: new FormControl<'USD' | 'VND'>('USD', { nonNullable: true }),
    category: new FormControl<ExpenseCategoryType | null>(null, [Validators.required]),
    expenseDate: new FormControl<Date | null>(null, [Validators.required]),
  });

  submit(): void {
    if (this.createExpenseForm.invalid) {
      this.createExpenseForm.markAllAsTouched();
      return;
    }

    const formValue = this.createExpenseForm.getRawValue();
    if (formValue.amount === null || formValue.category === null || formValue.expenseDate === null) {
      return;
    }

    this.isSubmitting.set(true);
    this._expenseService
      .createExpense({
        title: formValue.title,
        description: formValue.description,
        amount: formValue.amount,
        currency: formValue.currency,
        category: formValue.category,
        expenseDate: formValue.expenseDate,
      })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          toast.success('Expense created');
          this.createExpenseForm.reset({
            title: '',
            description: '',
            amount: null,
            currency: 'USD',
            category: null,
            expenseDate: null,
          });
          this.createDialogStateChange.emit('closed');
          this.expenseCreated.emit();
        },
        error: () => toast.error('Unable to create expense'),
      });
  }
}
