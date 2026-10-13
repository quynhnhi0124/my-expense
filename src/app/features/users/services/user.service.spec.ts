import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MOCK_USERS } from '../data/users.data';
import { Role, UserStatus } from '../models/user.enum';
import { UserService } from './user.service';

describe('UserService', () => {
  const initialUsers = MOCK_USERS.map((user) => ({ ...user }));
  let service: UserService;

  beforeEach(() => {
    MOCK_USERS.splice(0, MOCK_USERS.length, ...initialUsers.map((user) => ({ ...user })));
    TestBed.configureTestingModule({ providers: [UserService] });
    service = TestBed.inject(UserService);
  });

  it('filters users by search, role, and status together', async () => {
    const result = await firstValueFrom(
      service.getUsers({ search: 'audrey', role: [Role.USER], status: [UserStatus.ACTIVE] }),
    );

    expect(result.data.map((user) => user.id)).toEqual(['2']);
    expect(result.rowCount).toBe(1);
  });

  it('loads user details and rejects unknown ids', async () => {
    const user = await firstValueFrom(service.getUserDetail('2'));

    expect(user.email).toBe('user@gmail.com');
    await expect(firstValueFrom(service.getUserDetail('-1'))).rejects.toThrow('User was not found.');
  });

  it('updates a user role and modified timestamp', async () => {
    const user = MOCK_USERS.find((item) => item.id === '2')!;
    const updated = await firstValueFrom(service.updateUser(user.id, { role: Role.ADMIN }));

    expect(updated.role).toBe(Role.ADMIN);
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(user.createdAt.getTime());
  });

  it('updates status and rejects unknown user ids', async () => {
    const updated = await firstValueFrom(service.updateUser('2', { isActive: false }));

    expect(updated.isActive).toBe(false);
    await expect(
      firstValueFrom(service.updateUser('-1', { isActive: true })),
    ).rejects.toThrow('User was not found.');
  });
});