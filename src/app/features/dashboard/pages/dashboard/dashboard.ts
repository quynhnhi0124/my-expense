import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmChartImports } from '@spartan-ng/helm/chart';
import { HlmProgressImports } from '@spartan-ng/helm/progress';
import { AuthService } from '@core/auth/services/auth.service';
import { MOCK_EXPENSE } from '@features/expenses/data/expense-mock.data';
import { Expense, ExpenseStatus, toExpense } from '@features/expenses/models/expense.types';
import { createExpenseColumns, expenseTableFeatures } from '@features/expenses/expense-table';
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
import { MOCK_EXPENSE_CATEGORIES } from '@features/expense-categories/data';

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
  readonly currentYear = new Date().getFullYear();

  private readonly statuses: ExpenseStatus[] = [
    ExpenseStatus.APPROVED,
    ExpenseStatus.DRAFT,
    ExpenseStatus.PENDING,
    ExpenseStatus.REJECTED
  ]
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
    data: this.myExpenses,
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

  get allExpenses(): Expense[] {
    return MOCK_EXPENSE.map(toExpense);
  }

  get expenses(): Expense[] {
    return this.isAdmin
      ? this.allExpenses
      : this.allExpenses.filter((expense) => expense.userId === this.currentUser?.id);
  }

  get overview(): OverviewStat[] {
    return this.statuses.map((status) => {
      const matches = this.expenses.filter((expense) => expense.status === status);
      return {
        status,
        label: this.formatStatusLabel(status),
        total: matches.reduce((sum, expense) => sum + expense.amount, 0),
        count: matches.length,
      };
    });
  }

  get monthlyApprovedSpending() {
    const relevantExpenses = this.expenses.filter(
      (expense) =>
        expense.status === ExpenseStatus.APPROVED &&
        new Date(expense.expenseDate).getFullYear() === this.currentYear,
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
    const activeCategories = MOCK_EXPENSE_CATEGORIES.filter((category) => category.isActive);
    const activeCategoryIds = new Set(activeCategories.map((category) => category.id));
    const totals = new Map<string, number>();
    const relevantExpenses = this.expenses.filter(
      (expense) =>
        expense.status === ExpenseStatus.APPROVED && activeCategoryIds.has(expense.category),
    );
    const totalAmount = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    for (const expense of relevantExpenses) {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
    }

    return activeCategories
      .map((category) => {
        const amount = totals.get(category.id) ?? 0;
        return {
          category: category.name,
          amount,
          percentage: totalAmount === 0 ? 0 : Math.round((amount / totalAmount) * 100),
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }

  get recentExpenses(): Expense[] {
    return [...this.allExpenses]
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())
      .slice(0, 5);
  }

  get myExpenses(): Expense[] {
    return this.allExpenses
      .filter((expense) => expense.userId === this.currentUser?.id)
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
    return MOCK_EXPENSE_CATEGORIES.find((item) => item.id === category)?.name ?? category
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (value) => value.toUpperCase())
      .trim();
  }
}
