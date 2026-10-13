export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export const RoleLabel: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.USER]: 'User',
};

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const UserStatusLabel: Record<UserStatus, string> = {
  [UserStatus.ACTIVE]: 'Active',
  [UserStatus.INACTIVE]: 'Inactive',
};