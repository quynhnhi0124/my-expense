import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable} from 'rxjs';
import { ApiGetListResponse, SearchParams } from '@shared/interfaces';
import { User } from '@features/users/models/user.interface';
import { Role, UserStatus } from '../models/user.enum';
import { environment } from '../../../../../environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _http = inject(HttpClient);

  public getUsers(
    params: SearchParams & { role?: Role[]; status?: UserStatus[] },
  ): Observable<ApiGetListResponse<User>> {
    let httpParams = new HttpParams();
    return this._http
      .get<User[]>(`${environment.baseURL}/users`, { params: httpParams })
      .pipe(map((users) => this.handleUserData(users, params)));
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
      const userStatus = (user.isActive ? 'true' : 'false') as UserStatus;
      const matchesStatus = status.length === 0 || status.includes(userStatus);

      return matchesSearch && matchesRole && matchesStatus;
    });
    const res: ApiGetListResponse<User> = {
      data: users,
      rowCount: data.length,
      skip: 0,
      limit: Number(limit || page),
    };

    return res;
  }

  getUserDetail(id: string): Observable<User> {
    return this._http.get<User>(`${environment.baseURL}/users/${id}`);
  }

  updateUser(id: string, data: any) {
    return this._http.put<User>(`${environment.baseURL}/users/${id}`, data)
  }
}
