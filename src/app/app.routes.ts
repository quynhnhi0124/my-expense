import { Routes } from '@angular/router';
import { RoutePath } from './core/routing/routes';
import { authGuard } from '@core/auth/guards/auth.guard';

export const routes: Routes = [
  {
    path: RoutePath.auth.login,
    loadComponent: () => import('./features/auth/pages/login/login').then(m => m.Login),
  },
  {
    path: RoutePath.auth.signup,
    loadComponent: () => import('./features/auth/pages/signup/signup').then(m => m.Signup),
  },
  {
    path: RoutePath.users.list,
    loadComponent: () => import('./features/users/pages/user-list/user-list').then(m => m.UserList),
  },
  {
    path: '',
    loadComponent: () => import('./features/users/pages/user-list/user-list').then(m => m.UserList),
    canActivate: [authGuard]
  },
];
