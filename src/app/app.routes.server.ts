import { RenderMode, ServerRoute } from '@angular/ssr';
import { RoutePath } from './core/routing/routes';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  },
  {
    path: RoutePath.auth.login,
    renderMode: RenderMode.Prerender
  },
  {
    path: RoutePath.auth.signup,
    renderMode: RenderMode.Prerender
  },
  {
    path: RoutePath.users.list,
    renderMode: RenderMode.Client
  },
];
