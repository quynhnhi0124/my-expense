import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MOCK_USERS } from '../data/users.data';
import { Role } from '../models/user.enum';
import { UserService } from './user.service';

describe('UserService', () => {
  const initialUsers = MOCK_USERS.map((user) => ({ ...user }));
  let service: UserService;

  beforeEach(() => {
    MOCK_USERS.splice(0, MOCK_USERS.length, ...initialUsers.map((user) => ({ ...user })));
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(UserService);
  });

  it('filters users by search, role, and status together', async () => {
    const result = await firstValueFrom(
      service.getUsers({ search: 'emma', roles: [Role.USER], statuses: ['active'] }),
    );

    expect(result.data.map((user) => user.id)).toEqual([2]);
    expect(result.rowCount).toBe(1);
  });

  it('updates a user role and modified timestamp', async () => {
    const user = MOCK_USERS.find((item) => item.id === 2)!;
    const updated = await firstValueFrom(service.updateUserRole(user.id, Role.ADMIN));

    expect(updated.role).toBe(Role.ADMIN);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(user.createdAt.getTime());
  });

  it('updates status and rejects unknown user ids', async () => {
    const updated = await firstValueFrom(service.updateUserStatus(2, false));

    expect(updated.isActive).toBe(false);
    await expect(firstValueFrom(service.updateUserStatus(-1, true))).rejects.toThrow(
      'User was not found.',
    );
  });
});