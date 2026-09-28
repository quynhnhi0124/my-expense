import { Injectable } from '@angular/core';
import { LoginRequest, LoginResponse } from '@features/auth/models/auth.model';
import { MOCK_USERS, User } from '@features/users';
import { BehaviorSubject, delay, finalize, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly accessTokenKey = 'access_token';
  private readonly currentUserKey = 'currentUser';
  private readonly currentUser = new BehaviorSubject<User | null>(this.getCurrentUser());
  currentUser$ = this.currentUser.asObservable(); //expose the subject behavior

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const user = MOCK_USERS.find(
      (u) => u.email === credentials.email && u.passwordHash === credentials.password,
    );
    if (!user) {
      return throwError(() => new Error('Invalid credentials'));
    }
    const { passwordHash, ...userInfo } = user;
    return of({
      accessToken: `access-token-${user.id}`,
      user: userInfo,
    });
  }

  logout(): Observable<void> {
    return of(void 0).pipe(
      delay(500), // call logOut API
      finalize(() => this.clearSession()), // clear session when request fulfill
    );
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
    this.currentUser.next(response.user);
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.currentUserKey);
    this.currentUser.next(null);
  }
}
