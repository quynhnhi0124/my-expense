import { HttpEvent, HttpRequest, HttpHandlerFn } from "@angular/common/http"
import { inject } from "@angular/core"
import { Observable } from "rxjs"
import { AuthService } from "../services/auth.service"

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const authToken = inject(AuthService).getAuthToken();

  const newReq = req.clone({
    headers: req.headers.append('X-Authentication-Token', authToken)
  })
  
  return next(newReq);
}