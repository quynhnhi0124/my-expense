import { SearchParams } from "@shared/interfaces";

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type CategoryStatusHandler = (categoryId: string, isActive: boolean) => void;
export type ExpenseCategoryParams = SearchParams & { statuses: CategoryStatus[] };


export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const CategoryStatusLabel: Record<CategoryStatus, string> = {
  [CategoryStatus.ACTIVE]: 'Active',
  [CategoryStatus.INACTIVE]: 'Inactive',
};
