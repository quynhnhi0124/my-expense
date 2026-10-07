import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEllipsis } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { User } from '@features/users/models/user.interface';
import { Role } from '@features/users/models/user.enum';
import { Observable, finalize } from 'rxjs';

export type UserStatusAction = 'activate' | 'deactivate';
export type UserStatusActionHandler = (
  userId: string,
  action: UserStatusAction,
) => Observable<User>;
export type UserRoleAction = (userId: string, role: Role) => Observable<User>;

@Component({
  imports: [
    DatePipe,
    ReactiveFormsModule,
    HlmButtonImports,
    HlmSelectImports,
    NgIcon,
    HlmDropdownMenuImports,
    HlmDialogImports,
  ],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './user-table-actions.html',
})
export class UserActionsButton {
  private readonly _destroyRef = inject(DestroyRef);
  readonly user = input.required<User>();
  readonly updateStatus = input.required<UserStatusActionHandler>();
  readonly updateRole = input.required<UserRoleAction>();
  readonly dialogState = signal<'open' | 'closed'>('closed');
  readonly isUpdating = signal(false);
  readonly roleControl = new FormControl<Role>(Role.USER, { nonNullable: true });
  readonly roleOptions = [
    { value: Role.ADMIN, label: 'Admin' },
    { value: Role.USER, label: 'User' },
  ];

  prepareRoleChange(): void {
    this.roleControl.setValue(this.user().role);
  }

  saveRoleChange(): void {
    this.runUpdate(this.updateRole()(this.user().id, this.roleControl.value));
  }

  activateUser(): void {
    this.runUpdate(this.updateStatus()(this.user().id, 'activate'));
  }

  deactivateUser(): void {
    this.runUpdate(this.updateStatus()(this.user().id, 'deactivate'));
  }

  onDialogStateChange(state: string): void {
    if (state === 'open' || state === 'closed') {
      this.dialogState.set(state);
    }
  }

  private runUpdate(update$: Observable<User>): void {
    if (this.isUpdating()) return;

    this.isUpdating.set(true);
    update$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isUpdating.set(false)),
      )
      .subscribe({
        next: () => this.dialogState.set('closed'),
      });
  }
}