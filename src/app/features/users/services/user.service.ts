import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { MOCK_USERS } from '../data/users.data';
import { ApiGetListResponse, SearchParams } from '@shared/interfaces';
import { User } from '@features/users/models/user.interface';
import { Role } from '../models/user.enum';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _http = inject(HttpClient);

  public getUsers({
    page = '1',
    limit = '30',
    search = '',
    roles = [],
    statuses = [],
  }: SearchParams & { roles?: Role[]; statuses?: Array<'active' | 'inactive'> }): Observable<ApiGetListResponse<User>> {
    // const params = new HttpParams()
    //   .set('_page', page.toString())
    //   .set('_limit', limit.toString())
    //   .set('q', search);
    // return this._http.get<ApiGetListResponse<User>>("", {params})
    const normalizedSearch = search.trim().toLowerCase();
    const users = MOCK_USERS.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        [user.firstName, user.lastName, user.email, `${user.firstName} ${user.lastName}`].some(
          (value) => value.toLowerCase().includes(normalizedSearch),
        );

      const matchesRole = roles.length === 0 || roles.includes(user.role);
      const status = user.isActive ? 'active' : 'inactive';
      const matchesStatus = statuses.length === 0 || statuses.includes(status);

      return matchesSearch && matchesRole && matchesStatus;
    });
    const res: ApiGetListResponse<User> = {
      data: users,
      rowCount: users.length,
      skip: 0,
      limit: Number(limit || page),
    };
    return of(res);
  }

  updateUserStatus(id: number, isActive: boolean): Observable<User> {
    const user = MOCK_USERS.find((item) => item.id === id);
    if (!user) {
      return throwError(() => new Error('User was not found.'));
    }

    user.isActive = isActive;
    user.updatedAt = new Date();
    return of(user);
  }
}
