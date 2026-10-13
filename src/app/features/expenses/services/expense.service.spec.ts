import { TestBed } from '@angular/core/testing';
import { AuthService } from '@core/auth/services/auth.service';
import { MOCK_EXPENSE } from '../data/expense-mock.data';
import { Expense, ExpenseStatus } from '../models/expense.types';
import { Role } from '../../users/models/user.enum';
import { ExpenseService } from './expense.service';
import { firstValueFrom } from 'rxjs';

describe('ExpenseService', () => {
  const initialExpenses = MOCK_EXPENSE.map((expense) => ({ ...expense }));
  let currentUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    role: Role;
  };
  let service: ExpenseService;

  beforeEach(() => {
    MOCK_EXPENSE.splice(
      0,
      MOCK_EXPENSE.length,
      ...initialExpenses.map((expense) => ({ ...expense })),
    );
    currentUser = {
      id: '2',
      firstName: 'Emma',
      lastName: 'User',
      email: 'user@gmail.com',
      isActive: true,
      role: Role.USER,
    };
    TestBed.configureTestingModule({
      providers: [
        ExpenseService,
        { provide: AuthService, useValue: { getCurrentUser: () => currentUser } },
      ],
    });
    service = TestBed.inject(ExpenseService);
  });

  it('restricts mine scope to the current user and searches expense fields', async () => {
    const result = await firstValueFrom(service.getExpenses({ scope: 'mine', search: 'office supplies' }));

    expect(result.data.map((expense) => expense.id)).toEqual(['2']);
    expect(result.data.every((expense) => expense.userId === currentUser.id)).toBe(true);
  });

  it('combines date, status, and category filters', async () => {
    const result = await firstValueFrom(
      service.getExpenses({
        scope: 'mine',
        expenseDates: [new Date('2026-09-25T00:00:00')],
        statuses: [ExpenseStatus.DRAFT],
        categories: ['5'],
      }),
    );

    expect(result.data.map((expense) => expense.id)).toEqual(['2']);
  });

  it('lists active users expenses from active categories for admins', async () => {
    currentUser = {
      id: '1',
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'admin@gmail.com',
      isActive: true,
      role: Role.ADMIN,
    };

    const result = await firstValueFrom(service.getExpenses({ scope: 'all' }));

    expect(result.data.map((expense) => expense.id)).toEqual(['2', '11', '12']);
  });

  it('creates a draft expense for the current user', async () => {
    const created = await firstValueFrom(
      service.createExpense({
        title: '  New expense  ',
        description: '  Receipt  ',
        amount: 25,
        currency: 'USD',
        category: '1',
        expenseDate: new Date(2026, 8, 28),
      }),
    );

    expect(created.title).toBe('New expense');
    expect(created.description).toBe('Receipt');
    expect(created.userId).toBe(currentUser.id);
    expect(created.status).toBe(ExpenseStatus.DRAFT);
    expect(MOCK_EXPENSE[0].id).toBe(created.id);
  });

  it('only lets admins update expense status', async () => {
    await expect(
      firstValueFrom(service.updateExpenseStatus('2', ExpenseStatus.APPROVED)),
    ).rejects.toThrow('Only administrators can update expense status.');

    currentUser = {
      id: '1',
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'admin@gmail.com',
      isActive: true,
      role: Role.ADMIN,
    };
    const updated: Expense = await firstValueFrom(service.updateExpenseStatus('2', ExpenseStatus.APPROVED));

    expect(updated.status).toBe('approved');
  });
});