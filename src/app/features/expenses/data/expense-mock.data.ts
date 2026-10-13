import { ExpenseMock, ExpenseStatus } from "@features/expenses/models";


export const MOCK_EXPENSE: ExpenseMock[] = [
  {
    "id": "1",
    "userId": "1",
    "title": "payment",
    "description": "A payment at Wiza Group for business expenses.",
    "amount": 432.49,
    "currency": "USD",
    "category": {
      "id": "6",
      "name": "Other",
      "isActive": false
    },
    "expenseDate": new Date("2026-04-06T10:31:57.274Z"),
    "status": ExpenseStatus.DRAFT,
    "createdAt": new Date("2026-04-06T11:00:00.000Z"),
    "updatedAt": new Date("2026-04-06T11:00:00.000Z"),
    "user": {
      "id": "1",
      "email": "admin@gmail.com",
      "isActive": true
    }
  },
  {
    "id": "2",
    "userId": "2",
    "title": "deposit",
    "description": "Business expense for office supplies.",
    "amount": 707.42,
    "currency": "USD",
    "category": {
      "id": "5",
      "name": "Office Supplies",
      "isActive": true
    },
    "expenseDate": new Date("2026-09-25T01:26:09.641Z"),
    "status": ExpenseStatus.DRAFT,
    "createdAt": new Date("2026-09-25T02:00:00.000Z"),
    "updatedAt": new Date("2026-09-25T02:00:00.000Z"),
    "user": {
      "id": "2",
      "email": "user@gmail.com",
      "isActive": true
    }
  },
  {
    "id": "3",
    "userId": "3",
    "title": "deposit",
    "description": "Business office expense.",
    "amount": 431.82,
    "currency": "USD",
    "category": {
      "id": "5",
      "name": "Office Supplies",
      "isActive": true
    },
    "expenseDate": new Date("2026-10-10T14:44:06.894Z"),
    "status": ExpenseStatus.APPROVED,
    "createdAt": new Date("2026-10-10T15:00:00.000Z"),
    "updatedAt": new Date("2026-10-11T09:00:00.000Z"),
    "user": {
      "id": "3",
      "email": "Robyn_Konopelski@gmail.com",
      "isActive": false
    }
  },
  {
    "id": "4",
    "userId": "4",
    "title": "deposit",
    "description": "Business entertainment expense.",
    "amount": 91.18,
    "currency": "USD",
    "category": {
      "id": "4",
      "name": "Entertainment",
      "isActive": true
    },
    "expenseDate": new Date("2026-03-09T01:33:11.084Z"),
    "status": ExpenseStatus.PENDING,
    "createdAt": new Date("2026-03-09T02:00:00.000Z"),
    "updatedAt": new Date("2026-03-10T08:00:00.000Z"),
    "user": {
      "id": "4",
      "email": "Rozella.Feest84@gmail.com",
      "isActive": false
    }
  },
  {
    "id": "5",
    "userId": "5",
    "title": "invoice",
    "description": "Business entertainment expense.",
    "amount": 196.43,
    "currency": "USD",
    "category": {
      "id": "4",
      "name": "Entertainment",
      "isActive": true
    },
    "expenseDate": new Date("2026-10-11T19:38:27.112Z"),
    "status": ExpenseStatus.REJECTED,
    "createdAt": new Date("2026-10-11T20:00:00.000Z"),
    "updatedAt": new Date("2026-10-12T08:00:00.000Z"),
    "user": {
      "id": "5",
      "email": "Orie_DAmore95@hotmail.com",
      "isActive": false
    }
  },
  {
    "id": "6",
    "userId": "6",
    "title": "payment",
    "description": "Accommodation expense for business travel.",
    "amount": 387.28,
    "currency": "USD",
    "category": {
      "id": "3",
      "name": "Accommodation",
      "isActive": false
    },
    "expenseDate": new Date("2026-02-13T04:39:26.218Z"),
    "status": ExpenseStatus.APPROVED,
    "createdAt": new Date("2026-02-13T05:00:00.000Z"),
    "updatedAt": new Date("2026-02-14T10:00:00.000Z"),
    "user": {
      "id": "6",
      "email": "Lauryn.Russel24@hotmail.com",
      "isActive": false
    }
  },
  {
    "id": "7",
    "userId": "7",
    "title": "withdrawal",
    "description": "Accommodation expense for business travel.",
    "amount": 84.73,
    "currency": "USD",
    "category": {
      "id": "3",
      "name": "Accommodation",
      "isActive": false
    },
    "expenseDate": new Date("2026-01-29T02:58:57.719Z"),
    "status": ExpenseStatus.PENDING,
    "createdAt": new Date("2026-01-29T03:30:00.000Z"),
    "updatedAt": new Date("2026-01-30T09:00:00.000Z"),
    "user": {
      "id": "7",
      "email": "Haskell67@yahoo.com",
      "isActive": false
    }
  },
  {
    "id": "8",
    "userId": "8",
    "title": "deposit",
    "description": "Transportation expense for business travel.",
    "amount": 138.03,
    "currency": "USD",
    "category": {
      "id": "2",
      "name": "Transportation",
      "isActive": true
    },
    "expenseDate": new Date("2026-10-11T06:58:47.568Z"),
    "status": ExpenseStatus.REJECTED,
    "createdAt": new Date("2026-10-11T07:30:00.000Z"),
    "updatedAt": new Date("2026-10-12T08:00:00.000Z"),
    "user": {
      "id": "8",
      "email": "Ayden.Kohler49@yahoo.com",
      "isActive": false
    }
  },
  {
    "id": "9",
    "userId": "9",
    "title": "invoice",
    "description": "Transportation expense for business travel.",
    "amount": 172.38,
    "currency": "USD",
    "category": {
      "id": "2",
      "name": "Transportation",
      "isActive": true
    },
    "expenseDate": new Date("2026-07-15T02:55:43.119Z"),
    "status": ExpenseStatus.REJECTED,
    "createdAt": new Date("2026-07-15T03:30:00.000Z"),
    "updatedAt": new Date("2026-07-16T09:00:00.000Z"),
    "user": {
      "id": "9",
      "email": "Era_Thompson@gmail.com",
      "isActive": false
    }
  },
  {
    "id": "10",
    "userId": "10",
    "title": "deposit",
    "description": "Food expense for business purposes.",
    "amount": 718.97,
    "currency": "USD",
    "category": {
      "id": "1",
      "name": "Food",
      "isActive": true
    },
    "expenseDate": new Date("2026-05-23T19:06:08.954Z"),
    "status": ExpenseStatus.APPROVED,
    "createdAt": new Date("2026-05-23T20:00:00.000Z"),
    "updatedAt": new Date("2026-05-24T09:00:00.000Z"),
    "user": {
      "id": "10",
      "email": "Kyler.Koch@hotmail.com",
      "isActive": false
    }
  },
  {
    "id": "11",
    "userId": "1",
    "title": "new expense for admin",
    "description": "hhahaha",
    "amount": 89,
    "currency": "USD",
    "category": {
      "id": "1",
      "name": "Food",
      "isActive": true
    },
    "expenseDate": new Date("2026-10-11T17:00:00.000Z"),
    "status": ExpenseStatus.DRAFT,
    "createdAt": new Date("2026-10-11T19:38:55.579Z"),
    "updatedAt": new Date("2026-10-11T19:38:55.579Z"),
    "user": {
      "id": "1",
      "email": "admin@gmail.com",
      "isActive": true
    }
  },
  {
    "id": "12",
    "userId": "1",
    "title": "new expense for admin1",
    "description": "q",
    "amount": 12,
    "currency": "USD",
    "category": {
      "id": "3",
      "name": "Accommodation",
      "isActive": false
    },
    "expenseDate": new Date("2026-09-30T17:00:00.000Z"),
    "status": ExpenseStatus.APPROVED,
    "createdAt": new Date("2026-10-12T18:10:11.346Z"),
    "updatedAt": new Date("2026-10-12T18:10:11.346Z"),
    "user": {
      "id": "1",
      "email": "admin@gmail.com",
      "isActive": true
    }
  }
]