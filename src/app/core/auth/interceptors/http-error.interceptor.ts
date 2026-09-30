import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { toast } from '@spartan-ng/brain/sonner';
import { Observable, catchError, throwError } from 'rxjs';

export function httpErrorInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        toast.error(getHttpErrorMessage(error));
      }

      return throwError(() => error);
    }),
  );
}

function getHttpErrorMessage(error: HttpErrorResponse): string {
  const responseMessage =
    typeof error.error === 'string' ? error.error : error.error?.message;

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }

  switch (error.status) {
    case 0:
      return 'Unable to connect. Check your network and try again.';
    case 400:
      return 'The request is invalid.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This change conflicts with existing data.';
    case 422:
      return 'Some submitted information is invalid.';
    case 429:
      return 'Too many requests. Please try again shortly.';
    default:
      return error.status >= 500
        ? 'A server error occurred. Please try again later.'
        : 'An unexpected request error occurred.';
  }
}