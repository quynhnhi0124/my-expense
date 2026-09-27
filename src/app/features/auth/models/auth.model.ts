import { Role } from '@features/users';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };
}
