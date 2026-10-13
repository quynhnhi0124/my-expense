import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/auth/services/auth.service';
import { SignupRequest } from '@features/auth/models/auth.model';
import { MOCK_USERS } from '@features/users/data/users.data';
import { Role } from '@features/users/models/user.enum';
import { Signup } from './signup';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;
  let authService: AuthService;
  let router: Router;
  const registeredEmails: string[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  afterEach(() => {
    for (const email of registeredEmails.splice(0)) {
      const userIndex = MOCK_USERS.findIndex((user) => user.email === email);
      if (userIndex !== -1) {
        MOCK_USERS.splice(userIndex, 1);
      }
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('registers new accounts with the USER role and does not return the password', async () => {
    const request = createSignupRequest();
    registeredEmails.push(request.email);

    const user = await firstValueFrom(authService.signup(request));

    expect(user.role).toBe(Role.USER);
    expect('password' in user).toBe(false);
  });

  it('rejects an email that is already registered', async () => {
    const request = createSignupRequest();
    registeredEmails.push(request.email);
    await firstValueFrom(authService.signup(request));

    await expect(
      firstValueFrom(authService.signup({ ...request, email: request.email.toUpperCase() })),
    ).rejects.toThrow('An account with this email already exists.');
  });

  it('creates the account, logs in, and navigates to the dashboard', async () => {
    const email = `signup-form-${Date.now()}@example.test`;
    registeredEmails.push(email);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const setSession = vi.spyOn(authService, 'setSession').mockImplementation(() => {});
    component.signupForm.setValue({
      firstName: 'Taylor',
      lastName: 'Tester',
      email,
      password: 'Securepass1',
      confirmPassword: 'Securepass1',
    });

    component.onSubmit();

    expect(MOCK_USERS.find((user) => user.email === email)?.role).toBe(Role.USER);
    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['dashboard']), { timeout: 3000 });
    expect(setSession).toHaveBeenCalledOnce();
    expect(component.isSubmitting()).toBe(false);
  });

  it('marks invalid fields and does not register an invalid form', () => {
    component.onSubmit();

    expect(component.signupForm.controls.firstName.touched).toBe(true);
    expect(component.isSubmitting()).toBe(false);
  });
});

function createSignupRequest(): SignupRequest {
  return {
    firstName: 'Taylor',
    lastName: 'Test',
    email: `signup-${Date.now()}-${Math.random()}@example.test`,
    password: 'Securepass1',
  };
}
