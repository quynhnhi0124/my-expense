import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { LoginRequest } from '@features/auth/models/auth.model';
import { toast } from '@spartan-ng/brain/sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { finalize } from 'rxjs';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    HlmButtonImports,
    HlmSpinnerImports,
  ],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  readonly isSubmitting = signal<boolean>(false);
  readonly router = inject(Router);
  loginForm = new FormGroup({
    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),
    password: new FormControl('', [Validators.required]),
  });

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit() {
    this.authService
      .login(this.loginForm.value as LoginRequest)
      .pipe(
        // runs when Observable ends
        finalize(() => {
          this.isSubmitting.set(true);
        }),
      )
      .subscribe({
        next: (res) => {
          if (!res.body) {
            toast.error('Failed to login');
            return;
          }

          toast.success('Successfully logged in');
          this.authService.setSession(res.body);
          this.router.navigate(['/users']);
        },
        error: () => {
          toast.error('Failed to login');
        },
      });
  }
}
