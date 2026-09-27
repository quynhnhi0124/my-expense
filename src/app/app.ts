import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppLayout } from './core/layout/app-layout/app-layout';
import { AuthService } from './core/auth/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppLayout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public readonly _authService = inject(AuthService);
  protected readonly title = signal('expense-management');
  protected readonly isLoggedIn = this._authService.getAccessToken();
}
