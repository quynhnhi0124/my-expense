import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CategoryStatus } from '@features/expense-categories/data/expense-category.types';
import { ExpenseCategoryList } from './expense-category-list';

describe('ExpenseCategoryList', () => {
  let component: ExpenseCategoryList;
  let fixture: ComponentFixture<ExpenseCategoryList>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseCategoryList],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseCategoryList);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.waitFor(() => expect(component.data().length).toBeGreaterThan(0), { timeout: 2500 });
  });

  it('loads categories and syncs status filter selections', () => {
    expect(component.data().length).toBeGreaterThan(0);

    component.onFilterChange({ key: 'status', selectedValues: [CategoryStatus.INACTIVE] });

    expect(component.statusControl.value).toEqual([CategoryStatus.INACTIVE]);
  });

});