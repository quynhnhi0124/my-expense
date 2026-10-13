import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ExpenseCategory } from '../../data/expense-category.types';
import { ExpenseCategoryService } from '../../services/expense-category.service';
import { CreateExpenseCategory } from './create-expense-category.component';

describe('CreateExpenseCategory', () => {
  let component: CreateExpenseCategory;
  let fixture: ComponentFixture<CreateExpenseCategory>;
  let createResponse: Subject<ExpenseCategory>;

  beforeEach(async () => {
    createResponse = new Subject<ExpenseCategory>();
    await TestBed.configureTestingModule({
      imports: [CreateExpenseCategory],
      providers: [
        {
          provide: ExpenseCategoryService,
          useValue: { createCategory: () => createResponse.asObservable() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateExpenseCategory);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('marks the required name as touched without submitting an invalid form', () => {
    component.submit();

    expect(component.createCategoryForm.controls.name.touched).toBe(true);
    expect(component.isSubmitting()).toBe(false);
  });

  it('shows loading during submit and emits close and created events on success', () => {
    component.createCategoryForm.setValue({
      name: 'Travel',
      description: 'Business trips',
      isActive: true,
    });
    const stateChanged = vi.fn();
    const categoryCreated = vi.fn();
    component.dialogStateChange.subscribe(stateChanged);
    component.categoryCreated.subscribe(categoryCreated);

    component.submit();

    expect(component.isSubmitting()).toBe(true);
    createResponse.next({
      id: '7',
      name: 'Travel',
      description: 'Business trips',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    createResponse.complete();

    expect(component.isSubmitting()).toBe(false);
    expect(component.createCategoryForm.controls.name.value).toBe('');
    expect(stateChanged).toHaveBeenCalledWith('closed');
    expect(categoryCreated).toHaveBeenCalledOnce();
  });
});