import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  },
  // {
  //   path: RoutePath.auth.login,
  //   renderMode: RenderMode.Prerender
  // },
  // {
  //   path: RoutePath.auth.signup,
  //   renderMode: RenderMode.Prerender
  // },
  // {
  //   path: RoutePath.users.list,
  //   renderMode: RenderMode.Client
  // },
];
