
export const RoutePath = {
  dashboard: 'dashboard',
  auth: {
    login: 'login',
    signup: 'signup'
  },
  users: {
    list: 'users',
    detail: (id: string) => `users/${id}`
  },
  expenses: {
    list: 'expenses',
    categories: 'expense-categories',
  }
}