import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/services/auth.service';
import { MOCK_EXPENSES } from '../data/expense.data';
import { Expense } from '../models/expense.interface';
import { Role } from '../../users/models/user.enum';
import { ExpenseService } from './expense.service';
import { firstValueFrom } from 'rxjs';

describe('ExpenseService', () => {
  const initialExpenses = MOCK_EXPENSES.map((expense) => ({ ...expense }));
  let currentUser: { id: number; firstName: string; lastName: string; role: Role };
  let service: ExpenseService;

  beforeEach(() => {
    MOCK_EXPENSES.splice(
      0,
      MOCK_EXPENSES.length,
      ...initialExpenses.map((expense) => ({ ...expense })),
    );
    currentUser = { id: 2, firstName: 'Emma', lastName: 'User', role: Role.USER };
    TestBed.configureTestingModule({
      providers: [
        ExpenseService,
        { provide: AuthService, useValue: { getCurrentUser: () => currentUser } },
      ],
    });
    service = TestBed.inject(ExpenseService);
  });

  it('restricts mine scope to the current user and searches expense fields', async () => {
    const result = await firstValueFrom(service.getExpenses({ scope: 'mine', search: 'coffee' }));

    expect(result.data.map((expense) => expense.id)).toEqual([9]);
    expect(result.data.every((expense) => expense.userId === currentUser.id)).toBe(true);
  });

  it('combines date, status, and category filters', async () => {
    const result = await firstValueFrom(
      service.getExpenses({
        scope: 'mine',
        expenseDates: [new Date(2026, 8, 8)],
        statuses: ['rejected'],
        categories: ['food'],
      }),
    );

    expect(result.data.map((expense) => expense.id)).toEqual([9]);
  });

  it('allows admins to list all users expenses', async () => {
    currentUser = { id: 1, firstName: 'Emily', lastName: 'Johnson', role: Role.ADMIN };

    const result = await firstValueFrom(service.getExpenses({ scope: 'all' }));

    expect(result.data).toHaveLength(initialExpenses.length);
  });

  it('creates an expense for the current user with pending status', async () => {
    const created = await firstValueFrom(
      service.createExpense({
        title: '  New expense  ',
        description: '  Receipt  ',
        amount: 25,
        currency: 'USD',
        category: 'food',
        expenseDate: new Date(2026, 8, 28),
      }),
    );

    expect(created.title).toBe('New expense');
    expect(created.description).toBe('Receipt');
    expect(created.userId).toBe(currentUser.id);
    expect(created.status).toBe('pending');
    expect(MOCK_EXPENSES[0].id).toBe(created.id);
  });

  it('only lets admins update expense status', async () => {
    await expect(
      firstValueFrom(service.updateExpenseStatus(2, 'approved')),
    ).rejects.toThrow('Only administrators can update expense status.');

    currentUser = { id: 1, firstName: 'Emily', lastName: 'Johnson', role: Role.ADMIN };
    const updated: Expense = await firstValueFrom(service.updateExpenseStatus(2, 'approved'));

    expect(updated.status).toBe('approved');
  });
});