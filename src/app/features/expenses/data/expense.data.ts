import { Expense, ExpenseStatus } from '../models/expense.types';

export const MOCK_EXPENSES: Expense[] = [
  {
    "title": "payment",
    "description": "A invoice of COP 780.51 occurred at Wiza Group using a card ending in ****6494 for account ***6166.",
    "amount": 432.49,
    "currency": "USD",
    "category": "other",
    "expenseDate": new Date("2026-04-06T10:31:57.274Z"),
    "status": ExpenseStatus.DRAFT,
    "createdAt": new Date("2026-10-11T16:45:42.102Z"),
    "updatedAt": new Date("2026-10-11T18:18:40.492Z"),
    "user": {
      "email": "Ayana.Maggio@yahoo.com"
    },
    "id": "1",
    "userId": "1"
  },
  {
    "title": "deposit",
    "description": "You made a deposit of SZL 87.27 at O'Kon, Harvey and O'Kon using card ending in ****8721 from account ***2758.",
    "amount": 707.42,
    "currency": "USD",
    "category": "office",
    "expenseDate": new Date("2026-09-25T01:26:09.641Z"),
    "status": ExpenseStatus.DRAFT,
    "createdAt": new Date("2026-10-11T04:33:54.800Z"),
    "updatedAt": new Date("2026-10-10T21:55:05.301Z"),
    "user": {
      "email": "Devan_Harvey71@yahoo.com"
    },
    "id": "2",
    "userId": "2"
  },
  {
    "title": "deposit",
    "description": "payment of GYD 431.89 at Luettgen LLC charged to account ending in 8715 using card ending in ****2841.",
    "amount": 431.82,
    "currency": "USD",
    "category": "office",
    "expenseDate": new Date("2026-10-10T14:44:06.894Z"),
    "status": ExpenseStatus.APPROVED,
    "createdAt": new Date("2026-10-10T23:29:40.565Z"),
    "updatedAt": new Date("2026-10-10T20:36:53.119Z"),
    "user": {
      "email": "Koby37@gmail.com"
    },
    "id": "3",
    "userId": "3"
  },
  {
    "title": "deposit",
    "description": "A payment for SEK 355.95 was made at Douglas, MacGyver and Ryan via card ending ****0566 on account ***2353.",
    "amount": 91.18,
    "currency": "USD",
    "category": "entertainment",
    "expenseDate": new Date("2026-03-09T01:33:11.084Z"),
    "status": ExpenseStatus.PENDING,
    "createdAt": new Date("2026-10-11T02:23:05.901Z"),
    "updatedAt": new Date("2026-10-11T01:37:29.064Z"),
    "user": {
      "email": "Keyon.VonRueden@hotmail.com"
    },
    "id": "4",
    "userId": "4"
  },
  {
    "title": "invoice",
    "description": "invoice of GBP 816.89 at Walsh - Swaniawski charged to account ending in 1754 using card ending in ****9950.",
    "amount": 196.43,
    "currency": "USD",
    "category": "entertainment",
    "expenseDate": new Date("2026-10-11T19:38:27.112Z"),
    "status": ExpenseStatus.REJECTED,
    "createdAt": new Date("2026-10-11T05:26:27.167Z"),
    "updatedAt": new Date("2026-10-11T20:29:21.257Z"),
    "user": {
      "email": "Elna.OKeefe74@hotmail.com"
    },
    "id": "5",
    "userId": "5"
  },
  {
    "title": "payment",
    "description": "Your deposit of BIF 151.46 at Jakubowski, Prosacco and Larson was successful. Charged via card ****9332 to account ***9512.",
    "amount": 387.28,
    "currency": "USD",
    "category": "accommodation",
    "expenseDate": new Date("2026-02-13T04:39:26.218Z"),
    "status": ExpenseStatus.APPROVED,
    "createdAt": new Date("2026-10-11T11:43:37.462Z"),
    "updatedAt": new Date("2026-10-11T17:31:36.431Z"),
    "user": {
      "email": "Taurean3@gmail.com"
    },
    "id": "6",
    "userId": "6"
  },
  {
    "title": "withdrawal",
    "description": "payment at Jones, Stracke and Herzog with a card ending in ****1306 for SGD 425.47 from account ***6263.",
    "amount": 84.73,
    "currency": "USD",
    "category": "accommodation",
    "expenseDate": new Date("2026-01-29T02:58:57.719Z"),
    "status": ExpenseStatus.PENDING,
    "createdAt": new Date("2026-10-11T07:01:31.808Z"),
    "updatedAt": new Date("2026-10-11T00:20:08.311Z"),
    "user": {
      "email": "Micaela_Padberg22@gmail.com"
    },
    "id": "7",
    "userId": "7"
  },
  {
    "title": "deposit",
    "description": "You made a withdrawal of BND 159.05 at Rippin and Sons using card ending in ****6824 from account ***2073.",
    "amount": 138.03,
    "currency": "USD",
    "category": "transportation",
    "expenseDate": new Date("2026-10-11T06:58:47.568Z"),
    "status": ExpenseStatus.REJECTED,
    "createdAt": new Date("2026-10-11T05:44:46.489Z"),
    "updatedAt": new Date("2026-10-11T18:05:23.175Z"),
    "user": {
      "email": "Jeremie_Barrows@yahoo.com"
    },
    "id": "8",
    "userId": "8"
  },
  {
    "title": "invoice",
    "description": "You made a deposit of PKR 441.05 at Spencer, Mante and Brekke using card ending in ****6661 from account ***5219.",
    "amount": 172.38,
    "currency": "USD",
    "category": "transportation",
    "expenseDate": new Date("2026-07-15T02:55:43.119Z"),
    "status": ExpenseStatus.REJECTED,
    "createdAt": new Date("2026-10-11T06:54:05.504Z"),
    "updatedAt": new Date("2026-10-11T03:25:53.214Z"),
    "user": {
      "email": "Casimir49@yahoo.com"
    },
    "id": "9",
    "userId": "9"
  },
  {
    "title": "deposit",
    "description": "payment at Bogan, Cronin and Schinner with a card ending in ****7748 for UAH 239.90 from account ***4010.",
    "amount": 718.97,
    "currency": "USD",
    "category": "food",
    "expenseDate": new Date("2026-05-23T19:06:08.954Z"),
    "status": ExpenseStatus.APPROVED,
    "createdAt": new Date("2026-10-11T15:01:29.281Z"),
    "updatedAt": new Date("2026-10-11T12:20:04.015Z"),
    "user": {
      "email": "Milo.Haley@yahoo.com"
    },
    "id": "10",
    "userId": "10"
  },
  {
    "title": "new expense for admin",
    "description": "hhahaha",
    "amount": 89.00,
    "currency": "USD",
    "category": "food",
    "expenseDate": new Date("2026-10-11T17:00:00.000Z"),
    "status": ExpenseStatus.DRAFT,
    "createdAt": new Date("2026-10-11T19:38:55.579Z"),
    "updatedAt": new Date("2026-10-11T19:38:55.579Z"),
    "user": {
      "email": "admin@gmail.com"
    },
    "id": "11",
    "userId": "1"
  },
  {
    "title": "new expense for admin1",
    "description": "q",
    "amount": 12.00,
    "currency": "USD",
    "category": "accommodation",
    "expenseDate": new Date("2026-09-30T17:00:00.000Z"),
    "status": ExpenseStatus.DRAFT,
    "createdAt": new Date("2026-10-12T18:10:11.346Z"),
    "updatedAt": new Date("2026-10-12T18:10:11.346Z"),
    "user": {
      "email": "admin@gmail.com"
    },
    "id": "12",
    "userId": "1"
  }
];
