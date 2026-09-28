import { Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsUpDown, lucideCommand } from '@ng-icons/lucide';
import { HlmSidebarImports, HlmSidebarService } from '@spartan-ng/helm/sidebar';
import { NavItems } from './nav-items';
import { data } from './data';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { AuthService } from '@core/auth/services/auth.service';
import { Router } from '@angular/router';
import { RoutePath } from '@core/routing/routes';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { User } from '@features/users';

@Component({
  imports: [
    HlmSidebarImports,
    NgIcon,
    NavItems,
    HlmAvatarImports,
    HlmDropdownMenuImports,
    AsyncPipe
  ],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
  providers: [provideIcons({ lucideCommand, lucideChevronsUpDown })],
})
export class AppSidebar {
  private readonly _sidebarService = inject(HlmSidebarService);
  private readonly router = inject(Router);
  public authService = inject(AuthService);
  protected readonly _menuSide = computed(() =>
    this._sidebarService.isMobile() ? 'top' : 'right',
  );
  public currentUser$: Observable<User | null> = this.authService.currentUser$;

  data = data;

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate([RoutePath.auth.login]),
    });
  }
}
