import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ExpenseList } from './expense-list';
import { Role } from '@features/users/models/user.enum';
import { parseExpenseListRouteFilters } from './expense-list.filters';

describe('ExpenseList', () => {
  let component: ExpenseList;
  let fixture: ComponentFixture<ExpenseList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseList],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            getCurrentUser: () => ({
              id: '1',
              firstName: 'Admin',
              lastName: 'User',
              email: 'admin@example.test',
              role: Role.ADMIN,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('parses supported route filters and restricts all view to admins', () => {
    const params = convertToParamMap({
      view: 'all',
      categories: ['food', 'invalid'],
      statuses: ['draft', 'invalid'],
    });

    const adminFilters = parseExpenseListRouteFilters(params, true);
    const userFilters = parseExpenseListRouteFilters(params, false);

    expect(adminFilters.view).toBe('all');
    expect(adminFilters.categories).toEqual(['food']);
    expect(adminFilters.statuses).toEqual(['draft']);
    expect(userFilters.view).toBe('mine');
  });

  it('loads the admin expense list and defines separate filter groups per tab', () => {
    expect(component.data().length).toBeGreaterThan(0);
    expect(component.personalFilterGroups.map((group) => group.key)).toEqual([
      'expenseDates',
      'category',
    ]);
    expect(component.allUserFilterGroups.map((group) => group.key)).toEqual([
      'expenseDates',
      'status',
      'category',
    ]);
  });

  it('clears the outgoing tab filters when switching views', () => {
    component.searchControl.setValue('lunch');
    component.filters.mine.dates.set([new Date(2026, 8, 24)]);
    component.filters.mine.categories.set(['food']);

    component.onTabActivated('all');

    expect(component.activeView()).toBe('all');
    expect(component.searchControl.value).toBe('');
    expect(component.filters.mine.dates()).toEqual([]);
    expect(component.filters.mine.categories()).toEqual([]);
  });

  it('syncs selected category filters for the active view', () => {
    component.onFilterChange({ key: 'category', selectedValues: ['food'] });
    expect(component.filters.mine.categories()).toEqual(['food']);

    component.onTabActivated('all');
    component.onFilterChange({ key: 'category', selectedValues: ['office'] });
    expect(component.filters.all.categories()).toEqual(['office']);
  });
});