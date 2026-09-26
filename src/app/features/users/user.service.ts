import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { users } from './data/users';
import { ApiResponse, SearchParams } from '@shared/interfaces';
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
  }: SearchParams): Observable<ApiResponse<User>> {
    // const params = new HttpParams()
    //   .set('_page', page.toString())
    //   .set('_limit', limit.toString())
    //   .set('q', search);
    // return this._http.get<ApiResponse<User>>("", {params})
    const res: ApiResponse<User> = {
      data: users,
      rowCount: users.length,
      skip: 0,
      limit: 10,
    };
    return of(res);
  }
}
