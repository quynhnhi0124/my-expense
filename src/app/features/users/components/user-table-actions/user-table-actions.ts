import { Component, input, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { User } from '@features/users/models/user.interface';
import { Role } from '@features/users/models/user.enum';
import { Observable } from 'rxjs';
import { BrnDialogState } from '@spartan-ng/brain/dialog';
import { UpdateUserDialog } from '../update-user-dialog/update-user-dialog.component';

export type UserStatusAction = 'activate' | 'deactivate';
export type UserStatusActionHandler = (
  userId: string,
  action: UserStatusAction,
) => Observable<User>;
export type UserRoleAction = (userId: string, role: Role) => Observable<User>;

@Component({
  imports: [
    NgIcon,
    UpdateUserDialog,
    ReactiveFormsModule,
    HlmButtonImports,
    HlmSelectImports,
    HlmDialogImports,
    HlmDropdownMenuImports,
  ],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './user-table-actions.html',
})
export class UserActionsButton {
  readonly user = input.required<User>();
  readonly onUserUpdated = input.required<() => void>();
  readonly dialogState = signal<BrnDialogState>('closed');
  readonly openUpdateDialog = signal<BrnDialogState>("closed");

  onDialogStateChange(state: BrnDialogState): void {
      this.dialogState.set(state);
  }

  onUserDialogStateChange(open: BrnDialogState): void {
    this.openUpdateDialog.set(open);
  }

  handleUserUpdated(): void {
    this.onUserUpdated()();
  }

}
