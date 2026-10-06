import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { SignupRequest } from '@features/auth/models/auth.model';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { finalize } from 'rxjs';

@Component({
  imports: [
    RouterLink,
    ReactiveFormsModule,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    HlmButtonImports,
  ],
  selector: 'app-signup',
  styleUrl: './signup.css',
  templateUrl: './signup.html',
})
export class Signup {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly isSubmitting = signal(false);
  signupForm = new FormGroup(
    {
      firstName: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30),
        Validators.pattern(/^\p{L}+(?: \p{L}+)*$/u),
      ]),
      lastName: new FormControl('', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30),
        Validators.pattern(/^\p{L}+(?: \p{L}+)*$/u),
      ]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: this.passwordsMatch },
  );

  get firstName() {
    return this.signupForm.get('firstName');
  }

  get lastName() {
    return this.signupForm.get('lastName');
  }

  get email() {
    return this.signupForm.get('email');
  }

  get password() {
    return this.signupForm.get('password');
  }

  get confirmPassword() {
    return this.signupForm.get('confirmPassword');
  }

  onSubmit(): void {
    if (this.signupForm.invalid || this.isSubmitting()) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const formValue = this.signupForm.getRawValue();
    const request: SignupRequest = {
      firstName: formValue.firstName?.trim() ?? '',
      lastName: formValue.lastName?.trim() ?? '',
      email: formValue.email?.trim() ?? '',
      password: formValue.password ?? '',
    };

    this.isSubmitting.set(true);
    this.authService
      .signup(request)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          toast.success('Account created. Please log in.');
          void this.router.navigate(['/login']);
        },
        error: (error: unknown) => {
          toast.error(error instanceof Error ? error.message : 'Unable to create account.');
        },
      });
  }

  private passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password && confirmPassword && password !== confirmPassword
      ? { passwordsMismatch: true }
      : null;
  }
}
