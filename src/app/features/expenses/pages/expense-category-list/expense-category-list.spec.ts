import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MOCK_EXPENSE_CATEGORIES } from '@features/expenses/data/expense-categories.data';
import { ExpenseCategoryList } from './expense-category-list';

describe('ExpenseCategoryList', () => {
  let component: ExpenseCategoryList;
  let fixture: ComponentFixture<ExpenseCategoryList>;
  const initialCategories = MOCK_EXPENSE_CATEGORIES.map((category) => ({ ...category }));

  beforeEach(async () => {
    MOCK_EXPENSE_CATEGORIES.splice(
      0,
      MOCK_EXPENSE_CATEGORIES.length,
      ...initialCategories.map((category) => ({ ...category })),
    );
    await TestBed.configureTestingModule({
      imports: [ExpenseCategoryList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseCategoryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    MOCK_EXPENSE_CATEGORIES.splice(
      0,
      MOCK_EXPENSE_CATEGORIES.length,
      ...initialCategories.map((category) => ({ ...category })),
    );
  });

  it('loads categories and syncs status filter selections', () => {
    expect(component.data().length).toBeGreaterThan(0);

    component.onFilterChange({ key: 'status', selectedValues: ['inactive'] });

    expect(component.statusControl.value).toEqual(['inactive']);
  });

  it('marks required name as touched and does not create an invalid category', () => {
    component.createCategory();

    expect(component.createCategoryForm.controls.name.touched).toBe(true);
    expect(MOCK_EXPENSE_CATEGORIES).toHaveLength(initialCategories.length);
  });

  it('creates a category and resets the form after success', () => {
    component.createCategoryForm.setValue({
      name: 'Travel',
      description: 'Business trips',
      isActive: true,
    });

    component.createCategory();

    expect(MOCK_EXPENSE_CATEGORIES.some((category) => category.name === 'Travel')).toBe(true);
    expect(component.createCategoryForm.controls.name.value).toBe('');
    expect(component.createDialogState()).toBe('closed');
  });
});