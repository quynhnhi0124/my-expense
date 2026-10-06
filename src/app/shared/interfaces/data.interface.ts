export interface FilterItem<T> {
  id: string;
  label: string;
  value: T;
}

export interface TableFilterGroup {
  key: string;
  label: string;
  type?: 'checkbox' | 'date';
  options?: FilterItem<string>[];
  selectedValues: string[];
}

export interface TableFilterChange {
  key: string;
  selectedValues: string[]
}
