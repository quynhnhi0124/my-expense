import { DatePipe } from "@angular/common";
import { Component, input, signal } from "@angular/core";
import { CategoryStatusHandler, ExpenseCategory } from "@features/expenses/models/expense-category.interface";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideEllipsis } from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmDialogImports } from "@spartan-ng/helm/dialog";
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu";

@Component({
  imports: [DatePipe, HlmButtonImports, HlmDialogImports, HlmDropdownMenuImports, NgIcon],
  providers: [provideIcons({ lucideEllipsis })],
  template: `
    <hlm-dialog [state]="dialogState()" (stateChanged)="onDialogStateChange($event)">
      <button hlmBtn type="button" size="icon-sm" variant="ghost" aria-label="Category actions"
        [hlmDropdownMenuTrigger]="menu" align="start">
        <ng-icon name="lucideEllipsis" />
      </button>
      <ng-template #menu>
        <hlm-dropdown-menu class="w-40">
          <button hlmDropdownMenuItem (click)="dialogState.set('open')">Details</button>
        </hlm-dropdown-menu>
      </ng-template>

      <hlm-dialog-content *hlmDialogPortal class="sm:max-w-md">
        <hlm-dialog-header>
          <h3 hlmDialogTitle>{{ category().name }}</h3>
          <p hlmDialogDescription>Expense category details</p>
        </hlm-dialog-header>
        <dl class="grid gap-3 py-2 text-sm">
          <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Description</dt><dd>{{ category().description || 'No description' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Status</dt><dd>{{ category().isActive ? 'Active' : 'Inactive' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Created</dt><dd>{{ category().createdAt | date:'mediumDate' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Updated</dt><dd>{{ category().updatedAt | date:'mediumDate' }}</dd></div>
        </dl>
        <hlm-dialog-footer>
          <button hlmBtn type="button" variant="outline" hlmDialogClose>Close</button>
          @if (category().isActive) {
            <button hlmBtn type="button" variant="destructive" (click)="setStatus(false)">Deactivate category</button>
          } @else {
            <button hlmBtn type="button" variant="secondary" (click)="setStatus(true)">Activate category</button>
          }
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
export class CategoryActionsButton {
  readonly category = input.required<ExpenseCategory>();
  readonly updateStatus = input.required<CategoryStatusHandler>();
  readonly dialogState = signal<'open' | 'closed'>('closed');

  onDialogStateChange(state: string): void {
    if (state === 'open' || state === 'closed') this.dialogState.set(state);
  }

  setStatus(isActive: boolean): void {
    this.updateStatus()(this.category().id, isActive);
    this.dialogState.set('closed');
  }
}