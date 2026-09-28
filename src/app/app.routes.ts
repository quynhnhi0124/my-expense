import { Routes } from '@angular/router';
import { RoutePath } from './core/routing/routes';
import { authGuard } from '@core/auth/guards/auth.guard';
import { AppLayout } from '@core/layout/app-layout/app-layout';
import { guestGuard } from '@core/auth/guards/guest.guard';

export const routes: Routes = [
  {
    path: RoutePath.auth.login,
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.Login),
    canActivate: [guestGuard],
  },
  {
    path: RoutePath.auth.signup,
    loadComponent: () => import('./features/auth/pages/signup/signup').then((m) => m.Signup),
    canActivate: [guestGuard],
  },
  {
    path: '',
    component: AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: RoutePath.users.list,
        loadComponent: () =>
          import('./features/users/pages/user-list/user-list').then((m) => m.UserList),
      },
    ],
  },
];
