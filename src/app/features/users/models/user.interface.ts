import { Role } from "./user.enum";

export type UserStatus = 'active' | 'inactive';
export interface User {
  id:  number,
  email: string,
  password?: string,
  firstName: string,
  lastName: string,
  isActive: boolean,
  role: Role,
  createdAt: Date,
  updatedAt: Date
}

export interface UserFilter {
  search?: string,
  email?: string,
  role?: Role,
  isActive?: boolean
}