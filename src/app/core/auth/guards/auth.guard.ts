import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from "@angular/router";
import { RoutePath } from "@core/routing/routes";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const _authService = inject(AuthService);
  const isLoggedIn = _authService.getAccessToken();
  if (!isLoggedIn) {
    // Optional: Pass the attempted URL as a query param to redirect back after login
    return router.createUrlTree([RoutePath.auth.login])
    // return router.createUrlTree([RoutePath.auth.login], {queryParams: {returnUrl: state.url}})
  }
  return true;
}