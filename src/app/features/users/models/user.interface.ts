import { Role, UserStatus } from './user.enum';
export interface User {
  id: string,
  email: string,
  password?: string,
  firstName: string,
  lastName: string,
  isActive: UserStatus,
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