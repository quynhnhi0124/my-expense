import { TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { Role } from '@features/users/user.enum';

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the user dashboard overview', () => {
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 2,
        firstName: 'Emma',
        lastName: 'User',
        email: 'user.emma@x.dummyjson.com',
        role: Role.USER,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Dashboard');
    expect(text).toContain("Welcome back Emma! Here's your overview:");
    expect(text).toContain('Overview');
    expect(text).toContain('Monthly Spending');
    expect(text).toContain('Spending by Category');
    expect(text).toContain('Recent Expenses');
  });

  it('renders the admin dashboard overview', () => {
    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        id: 1,
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@x.dummyjson.com',
        role: Role.ADMIN,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Admin Dashboard');
    expect(text).toContain("Welcome back Emily! Here's the system overview:");
    expect(text).toContain('System Overview');
    expect(text).toContain('My Expenses');
    expect(text).toContain('Recent Expenses');
  });
});
