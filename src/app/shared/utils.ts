import { ActivatedRoute, Params, Router } from '@angular/router';

export function updateTableFilterQueryParams(
  router: Router,
  route: ActivatedRoute,
  queryParams: Params,
): void {
  void router.navigate([], {
    relativeTo: route,
    queryParams,
    queryParamsHandling: 'merge',
    replaceUrl: true,
  });
}

export function parseDates(values: string[]): Date[] {
  return values.flatMap((value) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return [];

    const [, year, month, day] = match;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
      ? [date]
      : [];
  });
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
