
export const RoutePath = {
  auth: {
    login: 'login',
    signup: 'signup'
  },
  users: {
    list: 'users',
    detail: (id: string) => `users/${id}`
  }
}