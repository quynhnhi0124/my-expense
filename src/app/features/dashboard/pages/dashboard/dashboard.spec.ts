import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { User } from '@features/users/models/user.interface';
import { Dashboard } from './dashboard';
import { Role } from '@features/users/models/user.enum';

describe('Dashboard', () => {
  let currentUser: User | null;

  beforeEach(async () => {
    currentUser = null;
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { getCurrentUser: () => currentUser } },
      ],
    }).compileComponents();
  });

  it('renders the user dashboard and limits recent expenses to five newest rows', () => {
    currentUser = {
        id: '2',
        firstName: 'Emma',
        lastName: 'User',
        email: 'user.emma@x.dummyjson.com',
        role: Role.USER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const fixture = TestBed.createComponent(Dashboard);
    const dashboard = fixture.componentInstance;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Dashboard');
    expect(text).toContain("Welcome back Emma! Here's your overview:");
    expect(text).toContain('Overview');
    expect(text).toContain('Monthly Spending');
    expect(text).toContain('Approved expenses for');
    expect(text).toContain('Spending by Category');
    expect(text).toContain('My Expenses');
    expect(text).not.toContain('Recent Expenses');
    expect(dashboard.myExpenses.length).toBeGreaterThan(0);
    expect(dashboard.myExpenses.every((expense) => expense.userId === currentUser?.id)).toBe(true);
    expect(dashboard.overview.reduce((count, stat) => count + stat.count, 0)).toBe(1);
    expect(dashboard.monthlyApprovedSpending.every((month) => month.value === 0)).toBe(true);
  });

  it('renders the admin dashboard overview', () => {
    currentUser = {
        id: '1',
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@x.dummyjson.com',
        role: Role.ADMIN,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const fixture = TestBed.createComponent(Dashboard);
    const dashboard = fixture.componentInstance;
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Admin Dashboard');
    expect(text).toContain("Welcome back Emily! Here's the system overview:");
    expect(text).toContain('System Overview');
    expect(text).toContain('Spending by Category');
    expect(text).toContain('My Expenses');
    expect(text).toContain('Recent Expenses');
    expect(dashboard.overview.reduce((count, stat) => count + stat.count, 0)).toBe(12);
    expect(dashboard.overview.find((stat) => stat.status === 'approved')?.count).toBe(4);
    expect(dashboard.myExpenses.map((expense) => expense.id)).toEqual(['11', '12', '1']);
    expect(dashboard.myExpenses.every((expense) => expense.userId === currentUser?.id)).toBe(true);
    expect(dashboard.recentExpenses).toHaveLength(5);
    expect(dashboard.recentExpenses.some((expense) => expense.id === '8')).toBe(true);
    expect(dashboard.categoryProgress.map((item) => item.category)).not.toContain('Other');
    expect(
      dashboard.monthlyApprovedSpending.reduce((sum, month) => sum + month.value, 0),
    ).toBeCloseTo(1550.07);
  });
});
