export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type CategoryStatusHandler = (categoryId: number, isActive: boolean) => void;
