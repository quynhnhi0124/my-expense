import { Injectable } from '@angular/core';
import { delay, map, Observable, of, throwError } from 'rxjs';
import { ApiGetListResponse, SearchParams } from '@shared/interfaces';
import { User } from '@features/users/models/user.interface';
import { Role, UserStatus } from '../models/user.enum';
import { MOCK_USERS } from '../data/users.data';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  public getUsers(
    params: SearchParams & { role?: Role[]; status?: UserStatus[] },
  ): Observable<ApiGetListResponse<User>> {
    return of(MOCK_USERS).pipe(delay(1000), map((users) => this.handleUserData(users, params)));
  }

  private handleUserData(
    data: User[],
    {
      page = '1',
      limit = '30',
      search = '',
      role = [],
      status = [],
    }: SearchParams & { role?: Role[]; status?: UserStatus[] },
  ): ApiGetListResponse<User> {
    const normalizedSearch = search.trim().toLowerCase();
    const users = data.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        [user.firstName, user.lastName, user.email, `${user.firstName} ${user.lastName}`].some(
          (value) => value.toLowerCase().includes(normalizedSearch),
        );

      const matchesRole = role.length === 0 || role.includes(user.role);
      const matchesStatus = status.length === 0 || status.includes(user.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE);

      return matchesSearch && matchesRole && matchesStatus;
    });
    const res: ApiGetListResponse<User> = {
      data: users,
      rowCount: users.length,
      skip: 0,
      limit: Number(limit),
    };

    return res;
  }

  getUserDetail(id: string): Observable<User> {
    const user = MOCK_USERS.find((item) => item.id === id);
    if (!user) {
      return throwError(() => new Error('User was not found.'));
    }

    return of({ ...user }).pipe(delay(1000));
  }

  updateUser(id: string, data: Partial<Pick<User, 'role' | 'isActive'>>): Observable<User> {
    const user = MOCK_USERS.find((item) => item.id === id);
    if (!user) {
      return throwError(() => new Error('User was not found.'));
    }

    Object.assign(user, data, { updatedAt: new Date() });
    return of({ ...user }).pipe(delay(1000));
  }
}
