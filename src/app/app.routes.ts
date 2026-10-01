import { Routes } from '@angular/router';
import { RoutePath } from './core/routing/routes';
import { authGuard } from '@core/auth/guards/auth.guard';
import { AppLayout } from '@core/layout/app-layout/app-layout';
import { guestGuard } from '@core/auth/guards/guest.guard';
import { adminGuard } from '@core/auth/guards/admin.guard';

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
        path: '',
        redirectTo: RoutePath.dashboard,
        pathMatch: 'full',
      },
      {
        path: RoutePath.dashboard,
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: RoutePath.users.list,
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/pages/user-list/user-list').then((m) => m.UserList),
      },
      {
        path: RoutePath.expenses.list,
        loadComponent: () =>
          import('./features/expenses/pages/expense-list/expense-list').then((m) => m.ExpenseList),
      },
      {
        path: RoutePath.expenses.categories,
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/expenses/pages/expense-category-list/expense-category-list').then(
            (m) => m.ExpenseCategoryList,
          ),
      },
    ],
  },
];
