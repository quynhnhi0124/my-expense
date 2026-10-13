export const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '.',
      icon: 'lucideSquareTerminal',
      isActive: true,
      items: [
        {
          title: 'Statistics',
          url: '.',
        },
      ],
    },
    {
      title: 'Expense Management',
      url: '/expenses',
      icon: 'lucideReceipt',
      items: [
        {
          title: 'Expense List',
          url: '/expenses',
        },
        {
          title: 'Expense Categories',
          url: '/expense-categories',
        },
      ],
    },
    {
      title: 'User Management',
      url: '/users',
      icon: 'lucideUsers',
      items: [
        {
          title: 'User List',
          url: '/users',
        },
      ],
    }
  ]
};
