
export interface ApiGetListResponse<T> {
  data: T[];
  rowCount: number;
  skip: number;
  limit: number;
}

export interface SearchParams {
  search?: string;
  page?: string;
  limit?: string
}