# Expense Management

An expense management application built with Angular 22. The application currently uses in-memory mock data and is not connected to a backend.

## Features

- **Authentication:** Sign in with a mock account. Newly registered users are automatically signed in and redirected to the dashboard.
- **Dashboard:** View expense totals by status, approved spending by month, spending by category, and recent expenses. Data is scoped according to the user's role.
- **Expenses:** Users can view and create their own expenses. Admins can switch between **My expenses** and **All user expenses**, filter records, and update expense statuses.
- **Expense categories:** Admins can search and filter categories, create categories, and activate or deactivate them.
- **Users:** Admins can search and filter users by role or status, view user details, and update roles or account status.
- **Shared tables:** Feature lists use a common table with sorting, pagination, and loading states.

## Getting started

Requirements: Node.js 22.22.3 or later in the 22.x line, 24.15.0 or later in the 24.x line, or 26.x or later.

```bash
npm install
npm start
```

Once the development server starts, open [http://localhost:4200](http://localhost:4200).

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@gmail.com` | `Admin123` |
| User | `user@gmail.com` | `User123` |

Sign in at `/login`. Users can access their own expense data. Admins can also view all expenses and manage users and expense categories. The other mock user accounts are inactive and cannot sign in.

## Common commands

```bash
npm start     # Start the development server
npm run build # Build the application to dist/
npm test      # Run unit tests
```

Mock operations include a delay to simulate network requests. Created and updated records are kept in memory and reset to their initial fixtures when the application reloads. The sign-in session is stored in browser storage.
