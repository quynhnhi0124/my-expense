import { ExpenseCategory } from '../models/expense-category.interface';

export const MOCK_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: 1,
    name: 'Food',
    description: 'Meals and refreshments for business purposes',
    isActive: true,
    createdAt: new Date('2026-01-05T09:00:00'),
    updatedAt: new Date('2026-02-12T14:30:00'),
  },
  {
    id: 2,
    name: 'Transportation',
    description: 'Public transit, taxi, and mileage',
    isActive: true,
    createdAt: new Date('2026-01-05T09:00:00'),
    updatedAt: new Date('2026-01-05T09:00:00'),
  },
  {
    id: 3,
    name: 'Accommodation',
    description: 'Hotels and lodging during business travel',
    isActive: true,
    createdAt: new Date('2026-01-06T10:00:00'),
    updatedAt: new Date('2026-03-08T11:15:00'),
  },
  {
    id: 4,
    name: 'Entertainment',
    description: 'Approved client and team events',
    isActive: true,
    createdAt: new Date('2026-01-08T13:00:00'),
    updatedAt: new Date('2026-01-08T13:00:00'),
  },
  {
    id: 5,
    name: 'Office Supplies',
    description: 'Equipment and consumable office supplies',
    isActive: true,
    createdAt: new Date('2026-01-10T09:30:00'),
    updatedAt: new Date('2026-04-18T16:00:00'),
  },
  {
    id: 6,
    name: 'Other',
    description: 'Expenses that do not fit another category',
    isActive: false,
    createdAt: new Date('2026-01-12T08:00:00'),
    updatedAt: new Date('2026-05-01T12:00:00'),
  },
];