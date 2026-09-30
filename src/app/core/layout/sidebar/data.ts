export const data = {
  user: {
    name: 'spartan',
    email: 'hello@spartan.com',
    avatar: '/assets/avatar.png',
  },
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
    },
    {
      title: 'Notifications',
      url: '.',
      icon: 'lucideBot',
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '.',
      icon: 'lucideLifeBuoy',
    },
    {
      title: 'Feedback',
      url: '.',
      icon: 'lucideSend',
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '.',
      icon: 'lucideFrame',
    },
    {
      name: 'Sales & Marketing',
      url: '.',
      icon: 'lucideChartPie',
    },
    {
      name: 'Travel',
      url: '.',
      icon: 'lucideMap',
    },
  ],
};
