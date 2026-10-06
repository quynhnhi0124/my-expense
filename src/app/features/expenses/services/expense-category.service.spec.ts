import { firstValueFrom } from 'rxjs';
import { MOCK_EXPENSE_CATEGORIES } from '../data/expense-categories.data';
import { ExpenseCategoryService } from './expense-category.service';

describe('ExpenseCategoryService', () => {
  const initialCategories = MOCK_EXPENSE_CATEGORIES.map((category) => ({ ...category }));
  let service: ExpenseCategoryService;

  beforeEach(() => {
    MOCK_EXPENSE_CATEGORIES.splice(
      0,
      MOCK_EXPENSE_CATEGORIES.length,
      ...initialCategories.map((category) => ({ ...category })),
    );
    service = new ExpenseCategoryService();
  });

  it('filters categories by name and active status', async () => {
    const result = await firstValueFrom(
      service.getCategories({ search: 'food', statuses: ['active'] }),
    );

    expect(result.data.map((category) => category.name)).toEqual(['Food']);
    expect(result.rowCount).toBe(1);
  });

  it('creates normalized category data', async () => {
    const created = await firstValueFrom(
      service.createCategory({
        name: '  Travel  ',
        description: '  Business trips  ',
        isActive: true,
      }),
    );

    expect(created.name).toBe('Travel');
    expect(created.description).toBe('Business trips');
    expect(MOCK_EXPENSE_CATEGORIES[0].id).toBe(created.id);
  });

  it('updates category status and rejects unknown ids', async () => {
    const updated = await firstValueFrom(service.updateCategoryStatus(1, false));

    expect(updated.isActive).toBe(false);
    await expect(firstValueFrom(service.updateCategoryStatus(-1, true))).rejects.toThrow(
      'Expense category was not found.',
    );
  });
});