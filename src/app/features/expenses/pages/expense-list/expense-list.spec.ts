import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@core/auth/services/auth.service';
import { ExpenseList } from './expense-list';
import { Role } from '@features/users/models/user.enum';

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
              id: 1,
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
    component.selectedMineDates.set([new Date(2026, 8, 24)]);
    component.selectedMineCategories.set(['food']);

    component.onTabActivated('all');

    expect(component.activeView()).toBe('all');
    expect(component.searchControl.value).toBe('');
    expect(component.selectedMineDates()).toEqual([]);
    expect(component.selectedMineCategories()).toEqual([]);
  });

  it('syncs selected category filters for the active view', () => {
    component.onFilterChange({ key: 'category', selectedValues: ['food'] });
    expect(component.selectedMineCategories()).toEqual(['food']);

    component.onTabActivated('all');
    component.onFilterChange({ key: 'category', selectedValues: ['office'] });
    expect(component.selectedAllCategories()).toEqual(['office']);
  });
});