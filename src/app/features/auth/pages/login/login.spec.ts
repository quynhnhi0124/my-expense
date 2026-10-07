import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { LoginResponse } from '@features/auth/models/auth.model';
import { Role } from '@features/users/models/user.enum';
import { of } from 'rxjs';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authService: { login: ReturnType<typeof vi.fn>; setSession: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authService = { login: vi.fn(), setSession: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not submit an invalid form', () => {
    component.onSubmit();

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('stores the session and navigates after a successful login', () => {
    const response: LoginResponse = {
      accessToken: 'test-token',
      user: {
        id: '2',
        email: 'user@example.test',
        firstName: 'Test',
        lastName: 'User',
        role: Role.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    authService.login.mockReturnValue(of(new HttpResponse({ status: 201, body: response })));
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.loginForm.setValue({ email: 'user@example.test', password: 'Securepass1' });

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith({
      email: 'user@example.test',
      password: 'Securepass1',
    });
    expect(authService.setSession).toHaveBeenCalledWith(response);
    expect(navigate).toHaveBeenCalledWith(['/users']);
  });
});
