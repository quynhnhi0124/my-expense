import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { LoginRequest, LoginResponse } from '@features/auth/models/auth.model';
import { MOCK_USERS } from '@features/users';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly accessTokenKey = 'access_token';
  currentUser = new BehaviorSubject({});

  getAuthToken() {
    return 'auth';
  }

  isLoggedIn() {
    return false;
  }

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
    // return this.http.post<LoginResponse>('/api/login', credentials).pipe(
    //     tap((response) => {
    //       localStorage.setItem(
    //         'access_token',
    //         response.accessToken
    //       );

    //       this.currentUser.set(response.user);
    //     })
    //   );;
  }

  getAccessToken() {
    return localStorage.getItem(this.accessTokenKey);
  }

  setSession(response: LoginResponse): void {
    localStorage.setItem('access_token', response.accessToken);
    this.currentUser.next(response.user);
  }
}
