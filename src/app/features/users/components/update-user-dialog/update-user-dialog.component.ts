import { DatePipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Role, RoleLabel, UserStatus, UserStatusLabel } from '@features/users/models/user.enum';
import { User } from '@features/users/models/user.interface';
import { UserService } from '@features/users/services/user.service';
import { OpenDialogState } from '@shared/enums';
import { BrnDialogState } from '@spartan-ng/brain/dialog';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { tap } from 'rxjs';
@Component({
  selector: 'update-user-dialog',
  templateUrl: './update-user-dialog.html',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    HlmButtonImports,
    HlmDialogImports,
    HlmSelectImports,
    HlmSpinnerImports,
    HlmSkeletonImports,
  ],
})
export class UpdateUserDialog {
  readonly id = input.required<string>();
  readonly user = signal<User | null>(null);
  private readonly userService = inject(UserService);
  private readonly _destroyRef = inject(DestroyRef);
  readonly openDialogState = input.required<BrnDialogState>();
  readonly openDialogStateChange = output<BrnDialogState>();
  readonly userUpdated = output<void>();
  readonly isLoading = signal<boolean>(false);

  readonly userForm = new FormGroup({
    isActive: new FormControl(true, { nonNullable: true }),
    role: new FormControl<Role>(Role.USER, { nonNullable: true }),
  });
  readonly roleOptions = [
    { value: Role.ADMIN, label: RoleLabel[Role.ADMIN] },
    { value: Role.USER, label: RoleLabel[Role.USER] },
  ];
  readonly statusOptions = [
    { value: true, label: UserStatusLabel[UserStatus.ACTIVE] },
    { value: false, label: UserStatusLabel[UserStatus.INACTIVE] },
  ];
  readonly statusToLabel = (value: boolean) => UserStatusLabel[value ? UserStatus.ACTIVE : UserStatus.INACTIVE];
  readonly roleToLabel = (value: Role) => RoleLabel[value];

  constructor() {
    effect(() => {
      if (this.openDialogState() === OpenDialogState.OPEN) {
        this.getUser();
      }
    });
  }

  onDialogStateChange(state: BrnDialogState) {
    this.openDialogStateChange.emit(state);
    if (state === "closed") {
      this.userForm.reset();
    }
  }

  getUser() {
    this.isLoading.set(true);
    this.userService
      .getUserDetail(this.id())
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        tap(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (user) => {
          this.user.set(user);
          this.userForm.patchValue({
            role: user.role,
            isActive: user.isActive,
          });
          this.userForm.markAsPristine();
        },
        error: (error) => {
          this.openDialogStateChange.emit('closed');
          toast.error(error instanceof Error ? error.message : 'Failed to load user');
        },
      });
  }

  hasChanges(): boolean {
    const user = this.user();
    if (!user) {
      return false;
    }

    const formValue = this.userForm.getRawValue();
    return formValue.role !== user.role || formValue.isActive !== user.isActive;
  }

  updateUser() {
    if (this.userForm.invalid || !this.hasChanges()) {
      return;
    }
    this.isLoading.set(true);
    this.userService
      .updateUser(this.id(), this.userForm.getRawValue())
      .pipe(
        tap(() => {
          this.isLoading.set(false);
          this.openDialogStateChange.emit('closed');
        }),
      )
      .subscribe({
        next: (user) => {
          console.log('updated user: ', user);
          toast.success('Successfully update user');
          this.userUpdated.emit();
        },
        error: (error) => {
          console.log(error);
        },
      });
  }
}
