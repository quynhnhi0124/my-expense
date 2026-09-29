import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { MOCK_USERS } from './data/users.data';
import { ApiGetListResponse, SearchParams } from '@shared/interfaces';
import { User } from '@features/users/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _http = inject(HttpClient);

  public getUsers({
    page = '1',
    limit = '30',
    search = '',
  }: SearchParams): Observable<ApiGetListResponse<User>> {
    // const params = new HttpParams()
    //   .set('_page', page.toString())
    //   .set('_limit', limit.toString())
    //   .set('q', search);
    // return this._http.get<ApiGetListResponse<User>>("", {params})
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const users = normalizedSearch
      ? MOCK_USERS.filter((user) =>
          [user.firstName, user.lastName, user.email, `${user.firstName} ${user.lastName}`].some(
            (value) => value.toLocaleLowerCase().includes(normalizedSearch),
          ),
        )
      : MOCK_USERS;
    const res: ApiGetListResponse<User> = {
      data: users,
      rowCount: users.length,
      skip: 0,
      limit: Number(limit || page),
    };
    return of(res);
  }
}
