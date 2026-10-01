import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { filter, map, startWith } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  imports: [HlmSidebarImports, HlmSeparatorImports, HlmBreadcrumbImports, RouterLink],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class SiteHeader {
  private readonly router = inject(Router);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const currentPath = this.currentUrl().split(/[?#]/, 1)[0];
    const segment = currentPath.split('/').filter(Boolean).at(-1) ?? 'dashboard';
    const labels: Record<string, string> = {
      dashboard: 'Dashboard',
      expenses: 'Expense List',
      'expense-categories': 'Expense Categories',
      users: 'User List',
    };
    const currentPage = labels[segment] ?? segment.replace(/-/g, ' ');

    return segment === 'dashboard'
      ? [{ label: currentPage }]
      : [{ label: 'Dashboard', url: '/dashboard' }, { label: currentPage }];
  });
}
