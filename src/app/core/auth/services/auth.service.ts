import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginRequest, LoginResponse } from '@features/auth/models/auth.model';
import { MOCK_USERS, User } from '@features/users';
import { delay, finalize, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly accessTokenKey = 'access_token';
  private readonly currentUserKey = 'currentUser';

  login(credentials: LoginRequest): Observable<HttpResponse<LoginResponse>> {
    const user = MOCK_USERS.find(
      (u) => u.email === credentials.email && u.password === credentials.password,
    );
    if (!user) {
      return throwError(() => new Error('Invalid credentials'));
    }
    if (!user.isActive) {
      return throwError(
        () => new Error('Your account has been deactivated. Contact an administrator.'),
      );
    }
    const { password, ...userInfo } = user;
    return of(
      new HttpResponse({
        status: 201,
        body: {
          accessToken: `access-token-${user.id}`,
          user: userInfo,
        },
      }),
    );
  }

  logout(): Observable<void> {
    return of(void 0).pipe(
      delay(500), // call logOut API
      finalize(() => this.clearSession()), // clear session when request fulfill
    );
  }

  signup(): Observable<any> {
    return of();
  }

  getAccessToken(): string | null | void {
    return localStorage.getItem(this.accessTokenKey);
  }

  getCurrentUser() {
    const currentUser = localStorage.getItem(this.currentUserKey);

    if (!currentUser) {
      return null;
    }

    try {
      return JSON.parse(currentUser) as User;
    } catch {
      return null;
    }
  }

  setSession(response: LoginResponse): void {
    localStorage.setItem(this.accessTokenKey, response.accessToken);
    localStorage.setItem(this.currentUserKey, JSON.stringify(response.user));
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.currentUserKey);
  }
}
