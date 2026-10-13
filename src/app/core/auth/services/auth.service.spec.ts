import { firstValueFrom } from 'rxjs';
import { MOCK_USERS } from '@features/users/data/users.data';
import { Role } from '@features/users/models/user.enum';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const initialUsers = MOCK_USERS.map((user) => ({ ...user }));
  let service: AuthService;

  beforeEach(() => {
    MOCK_USERS.splice(0, MOCK_USERS.length, ...initialUsers.map((user) => ({ ...user })));
    service = new AuthService();
  });

  it('authenticates case-insensitive email and excludes password from the response', async () => {
    const response = await firstValueFrom(
      service.login({ email: '  ADMIN@GMAIL.COM ', password: 'Admin123' }),
    );

    expect(response.user.role).toBe(Role.ADMIN);
    expect('password' in response.user).toBe(false);
  });

  it('rejects invalid credentials and inactive accounts', async () => {
    await expect(
      firstValueFrom(service.login({ email: 'wrong@example.test', password: 'wrong' })),
    ).rejects.toThrow('Invalid credentials');
    await expect(
      firstValueFrom(
        service.login({ email: 'robyn_konopelski@gmail.com', password: 'Yzd6ombsYYOqGhE' }),
      ),
    ).rejects.toThrow('Your account has been deactivated. Contact an administrator.');
  });

  it('creates active USER accounts and rejects duplicate email addresses', async () => {
    const input = {
      firstName: 'Jamie',
      lastName: 'Taylor',
      email: '  JAMIE.TAYLOR@example.test ',
      password: 'Securepass1',
    };

    const created = await firstValueFrom(service.signup(input));

    expect(created.email).toBe('jamie.taylor@example.test');
    expect(created.role).toBe(Role.USER);
    expect(created.isActive).toBe(true);
    expect('password' in created).toBe(false);
    await expect(
      firstValueFrom(service.signup({ ...input, email: input.email.trim().toLowerCase() })),
    ).rejects.toThrow('An account with this email already exists.');
  });
});