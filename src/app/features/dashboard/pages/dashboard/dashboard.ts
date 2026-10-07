import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmChartImports } from '@spartan-ng/helm/chart';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { AuthService } from '@core/auth/services/auth.service';
import { MOCK_EXPENSE_CATEGORIES } from '@features/expenses/data/expense-categories.data';
import { MOCK_EXPENSES } from '@features/expenses/data/expense.data';
import { Expense, ExpenseStatus } from '@features/expenses/models/expense.interface';
import { createExpenseColumns, expenseTableFeatures } from '@features/expenses/expense-table';
import { MOCK_USERS } from '@features/users/data/users.data';
import { Role } from '@features/users/models/user.enum';
import {
  injectTable,
  isFunction,
  SortingState,
} from '@tanstack/angular-table';
import { type ChartTooltipContent, barY, defineChart } from '@tanstack/charts';
import { tooltip } from '@tanstack/charts/tooltip';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { CommonTable } from '@shared/components/table/table-data/common-table.component';
import { TableDataHeader } from '@shared/components/table/table-data-header/table-data-header.component';

interface OverviewStat {
  status: ExpenseStatus;
  label: string;
  total: number;
  count: number;
}

interface CategoryProgress {
  category: string;
  amount: number;
  percentage: number;
}

@Component({
  imports: [
    RouterLink,
    HlmCardImports,
    HlmButtonImports,
    HlmChartImports,
    HlmProgressImports,
    CommonTable,
    TableDataHeader
  ],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  readonly currentUser = this.authService.getCurrentUser();
  readonly isAdmin = this.currentUser?.role === Role.ADMIN;

  readonly pageTitle = this.isAdmin ? 'Admin Dashboard' : 'Dashboard';
  readonly pageDescription = this.isAdmin
    ? `Welcome back ${this.currentUser?.firstName ?? 'User'}! Here's the system overview:`
    : `Welcome back ${this.currentUser?.firstName ?? 'User'}! Here's your overview:`;

  private readonly activeUserIds = new Set(
    MOCK_USERS.filter((user) => user.isActive).map((user) => user.id),
  );

  private readonly statuses: ExpenseStatus[] = ['draft', 'pending', 'approved', 'rejected'];
  private readonly myExpensesSorting = signal<SortingState>([]);
  private readonly recentExpensesSorting = signal<SortingState>([]);
  private readonly expenseColumns = createExpenseColumns({
    titleHeader: 'Title',
    dateHeader: 'Date',
    formatCategory: (category) => this.formatCategoryLabel(category),
    formatAmount: (expense) => this.formatCurrency(expense.amount),
    formatDate: (date) => this.formatDate(date),
  });

  readonly myExpensesTable = injectTable(() => ({
    key: 'dashboard-my-expenses',
    features: expenseTableFeatures,
    columns: this.expenseColumns,
    data: this.pendingExpenses,
    getRowId: (expense) => String(expense.id),
    state: { sorting: this.myExpensesSorting() },
    onSortingChange: (updater) =>
      isFunction(updater)
        ? this.myExpensesSorting.update(updater)
        : this.myExpensesSorting.set(updater),
  }));

  readonly recentExpensesTable = injectTable(() => ({
    key: 'dashboard-recent-expenses',
    features: expenseTableFeatures,
    columns: this.expenseColumns,
    data: this.recentExpenses,
    getRowId: (expense) => String(expense.id),
    state: { sorting: this.recentExpensesSorting() },
    onSortingChange: (updater) =>
      isFunction(updater)
        ? this.recentExpensesSorting.update(updater)
        : this.recentExpensesSorting.set(updater),
  }));

  get overview(): OverviewStat[] {
    const expenses = this.isAdmin
      ? MOCK_EXPENSES.filter((expense) => this.activeUserIds.has(expense.userId))
      : MOCK_EXPENSES.filter((expense) => expense.userId === this.currentUser?.id);

    return this.statuses.map((status) => {
      const matches = expenses.filter((expense) => expense.status === status);
      return {
        status,
        label: this.formatStatusLabel(status),
        total: matches.reduce((sum, expense) => sum + expense.amount, 0),
        count: matches.length,
      };
    });
  }

  get monthlyApprovedSpending() {
    const relevantExpenses = MOCK_EXPENSES.filter(
      (expense) => expense.userId === this.currentUser?.id && expense.status === 'approved',
    );

    const monthMap = new Map<string, number>();
    const monthOrder = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    for (const expense of relevantExpenses) {
      const month = monthOrder[new Date(expense.expenseDate).getMonth()];
      monthMap.set(month, (monthMap.get(month) ?? 0) + expense.amount);
    }

    return monthOrder.map((month) => ({
      month,
      value: monthMap.get(month) ?? 0,
    }));
  }

  get categoryProgress(): CategoryProgress[] {
    if (this.isAdmin) {
      return [];
    }

    const relevantExpenses = MOCK_EXPENSES.filter(
      (expense) => expense.userId === this.currentUser?.id,
    );
    const categoryMap = new Map(
      MOCK_EXPENSE_CATEGORIES.filter((category) => category.isActive).map((category) => [
        category.name.toLowerCase(),
        category.name,
      ]),
    );
    const totals = new Map<string, number>();
    const totalAmount = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    for (const expense of relevantExpenses) {
      const categoryName =
        categoryMap.get(expense.category.toLowerCase()) ??
        this.formatCategoryLabel(expense.category);
      totals.set(categoryName, (totals.get(categoryName) ?? 0) + expense.amount);
    }

    return MOCK_EXPENSE_CATEGORIES.filter((category) => category.isActive)
      .map((category) => {
        const amount = totals.get(category.name) ?? 0;
        return {
          category: category.name,
          amount,
          percentage: totalAmount === 0 ? 0 : Math.round((amount / totalAmount) * 100),
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  get recentExpenses(): Expense[] {
    const expenses = this.isAdmin
      ? MOCK_EXPENSES.filter((expense) => this.activeUserIds.has(expense.userId))
      : MOCK_EXPENSES.filter((expense) => expense.userId === this.currentUser?.id);

    return [...expenses]
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
      .slice(0, 5);
  }

  get pendingExpenses(): Expense[] {
    if (!this.isAdmin) {
      return [];
    }

    return [...MOCK_EXPENSES]
      .filter((expense) => expense.status === 'pending' && this.activeUserIds.has(expense.userId))
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
      .slice(0, 5);
  }

  get chartOptions() {
    const rows = this.monthlyApprovedSpending;
    const series = defineChart({
      marks: [
        barY(rows, {
          x: 'month',
          y: 'value',
        }),
      ],
      scales: {
        x: {
          scale: () =>
            scaleBand<string>()
              .domain(rows.map((row) => row.month))
              .padding(0.2),
        },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
        },
      },
      tooltip: {
        use: tooltip,
        content: (points): ChartTooltipContent => {
          const point = points[0];
          const month = String(point?.xValue ?? '');
          const value = Number(point?.yValue ?? 0);

          return {
            title: month,
            rows: [
              {
                label: 'Spending',
                value: this.formatCurrency(value),
              },
            ],
          };
        },
      },
    });

    return {
      definition: series,
      ariaLabel: 'Monthly spending chart',
      height: 280,
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private formatStatusLabel(status: ExpenseStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  private formatCategoryLabel(category: string): string {
    return category
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (value) => value.toUpperCase())
      .trim();
  }
}
