import { Role } from "../user.enum";
import { User } from "../user.interface";

export const MOCK_USERS: User[] = [
  {
    id: 1,
    firstName: 'Emily',
    lastName: 'Johnson',
    email: 'emily.johnson@x.dummyjson.com',
    password: 'emilyspass',
    role: Role.ADMIN,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    firstName: 'User',
    lastName: 'Emma',
    email: 'user.emma@x.dummyjson.com',
    password: 'emilyspass',
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    firstName: 'Inactive',
    lastName: 'User',
    email: 'inactive.user@x.dummyjson.com',
    password: 'inactivepass',
    role: Role.USER,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
