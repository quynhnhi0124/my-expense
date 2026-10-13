import { Component, input } from "@angular/core";
import { Expense, ExpenseStatus, ExpenseStatusChangeHandler, ExpenseStatusLabel } from "@features/expenses/models";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideEllipsis } from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu";

@Component({
  imports: [HlmButtonImports, HlmDropdownMenuImports, NgIcon],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './expense-action-menu.html',
})
export class ExpenseActionsMenu {
  readonly expense = input.required<Expense>();
  readonly updateStatus = input.required<ExpenseStatusChangeHandler>();
  readonly statuses = Object.keys(ExpenseStatusLabel) as ExpenseStatus[];
  readonly expenseStatusLabel = ExpenseStatusLabel;
}
