import { Component, input } from "@angular/core";
import { DatePipe } from '@angular/common';
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideEllipsis } from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu";
import { HlmDialogImports } from "@spartan-ng/helm/dialog";
import { User } from '@features/users/user.interface';

export type UserStatusAction = 'activate' | 'deactivate';

@Component({
  imports: [DatePipe, HlmButtonImports, NgIcon, HlmDropdownMenuImports, HlmDialogImports],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './user-table-actions.html',
})
export class UserActionsButton {
  readonly user = input.required<User>();
  readonly updateStatus = input.required<(userId: number, action: UserStatusAction) => void>();

  activateUser(): void {
    this.updateStatus()(this.user().id, 'activate');
  }

  deactivateUser(): void {
    this.updateStatus()(this.user().id, 'deactivate');
  }
}