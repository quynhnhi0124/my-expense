import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpenseCategoryService } from '@features/expense-categories/services/expense-category.service';
import { BrnDialogState } from '@spartan-ng/brain/dialog';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-create-expense-category',
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmCheckboxImports,
    HlmDialogImports,
    HlmInputImports,
    HlmSpinnerImports,
  ],
  templateUrl: './create-expense-category.component.html',
})
export class CreateExpenseCategory {
  private readonly _categoryService = inject(ExpenseCategoryService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly dialogState = input<BrnDialogState>('closed');
  readonly dialogStateChange = output<BrnDialogState>();
  readonly categoryCreated = output<void>();
  readonly isSubmitting = signal(false);
  readonly createCategoryForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    description: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  submit(): void {
    if (this.createCategoryForm.invalid || this.isSubmitting()) {
      this.createCategoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this._categoryService
      .createCategory(this.createCategoryForm.getRawValue())
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => {
          toast.success('Expense category created');
          this.createCategoryForm.reset({ name: '', description: '', isActive: true });
          this.dialogStateChange.emit('closed');
          this.categoryCreated.emit();
        },
        error: (error: unknown) => {
          toast.error(error instanceof Error ? error.message : 'Unable to create expense category');
        },
      });
  }
}