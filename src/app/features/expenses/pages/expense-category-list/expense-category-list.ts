import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowDown, lucideArrowUp, lucideArrowUpDown, lucideEllipsis } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  createPaginatedRowModel,
  createSortedRowModel,
  createTableHook,
  flexRenderComponent,
  FlexRender,
  injectTable,
  isFunction,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  SortingState,
  tableFeatures,
} from '@tanstack/angular-table';
import { debounceTime, distinctUntilChanged, map, merge, switchMap, tap } from 'rxjs';
import { toast } from '@spartan-ng/brain/sonner';
import { ExpenseCategory } from '../../expense-category.interface';
import { ExpenseCategoryService } from '../../expense-category.service';

const categoryTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: {
    text: sortFn_text,
    alphanumeric: sortFn_alphanumeric,
  },
});

const { createAppColumnHelper } = createTableHook({ features: categoryTableFeatures });
const columnHelper = createAppColumnHelper<ExpenseCategory>();
type CategoryStatusHandler = (categoryId: number, isActive: boolean) => void;

@Component({
  imports: [HlmBadgeImports],
  template: `<span hlmBadge [variant]="isActive() ? 'secondary' : 'destructive'">{{ isActive() ? 'Active' : 'Inactive' }}</span>`,
})
class CategoryStatusBadge {
  readonly isActive = input.required<boolean>();
}

@Component({
  imports: [DatePipe, HlmButtonImports, HlmDialogImports, HlmDropdownMenuImports, NgIcon],
  providers: [provideIcons({ lucideEllipsis })],
  template: `
    <hlm-dialog [state]="dialogState()" (stateChanged)="onDialogStateChange($event)">
      <button hlmBtn type="button" size="icon-sm" variant="ghost" aria-label="Category actions"
        [hlmDropdownMenuTrigger]="menu" align="start">
        <ng-icon name="lucideEllipsis" />
      </button>
      <ng-template #menu>
        <hlm-dropdown-menu class="w-40">
          <button hlmDropdownMenuItem (click)="dialogState.set('open')">Details</button>
        </hlm-dropdown-menu>
      </ng-template>

      <hlm-dialog-content *hlmDialogPortal class="sm:max-w-md">
        <hlm-dialog-header>
          <h3 hlmDialogTitle>{{ category().name }}</h3>
          <p hlmDialogDescription>Expense category details</p>
        </hlm-dialog-header>
        <dl class="grid gap-3 py-2 text-sm">
          <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Description</dt><dd>{{ category().description || 'No description' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Status</dt><dd>{{ category().isActive ? 'Active' : 'Inactive' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Created</dt><dd>{{ category().createdAt | date:'mediumDate' }}</dd></div>
          <div class="flex justify-between gap-4"><dt class="text-muted-foreground">Updated</dt><dd>{{ category().updatedAt | date:'mediumDate' }}</dd></div>
        </dl>
        <hlm-dialog-footer>
          <button hlmBtn type="button" variant="outline" hlmDialogClose>Close</button>
          @if (category().isActive) {
            <button hlmBtn type="button" variant="destructive" (click)="setStatus(false)">Deactivate category</button>
          } @else {
            <button hlmBtn type="button" variant="secondary" (click)="setStatus(true)">Activate category</button>
          }
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
})
class CategoryActionsButton {
  readonly category = input.required<ExpenseCategory>();
  readonly updateStatus = input.required<CategoryStatusHandler>();
  readonly dialogState = signal<'open' | 'closed'>('closed');

  onDialogStateChange(state: string): void {
    if (state === 'open' || state === 'closed') this.dialogState.set(state);
  }

  setStatus(isActive: boolean): void {
    this.updateStatus()(this.category().id, isActive);
    this.dialogState.set('closed');
  }
}

@Component({
  imports: [
    ReactiveFormsModule,
    HlmTableImports,
    HlmButtonImports,
    HlmInputImports,
    HlmCheckboxImports,
    HlmPopoverImports,
    HlmDialogImports,
    NgIcon,
    FlexRender,
  ],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideArrowUpDown })],
  selector: 'app-expense-category-list',
  styleUrl: './expense-category-list.css',
  templateUrl: './expense-category-list.html',
})
export class ExpenseCategoryList implements OnInit {
  private readonly _categoryService = inject(ExpenseCategoryService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<Array<'active' | 'inactive'>>([], { nonNullable: true });
  readonly statuses = [
    { id: 'category-active', label: 'Active', value: 'active' as const },
    { id: 'category-inactive', label: 'Inactive', value: 'inactive' as const },
  ];
  readonly createDialogState = signal<'open' | 'closed'>('closed');
  readonly isSubmitting = signal(false);
  readonly createCategoryForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    description: new FormControl('', { nonNullable: true }),
    isActive: new FormControl(true, { nonNullable: true }),
  });
  readonly data = signal<ExpenseCategory[]>([]);
  private readonly sorting = signal<SortingState>([]);
  readonly columns = columnHelper.columns([
    columnHelper.accessor('name', { header: 'Name', sortFn: 'text' }),
    columnHelper.accessor('description', {
      header: 'Description',
      sortFn: 'text',
      cell: (info) => info.getValue() || 'No description',
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) =>
        flexRenderComponent(CategoryStatusBadge, { inputs: { isActive: info.getValue() } }),
      sortFn: 'alphanumeric',
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      sortFn: 'alphanumeric',
      cell: (info) => new DatePipe('en-US').transform(info.getValue(), 'mediumDate') ?? '',
    }),
    columnHelper.accessor('updatedAt', {
      header: 'Updated',
      sortFn: 'alphanumeric',
      cell: (info) => new DatePipe('en-US').transform(info.getValue(), 'mediumDate') ?? '',
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) =>
        flexRenderComponent(CategoryActionsButton, {
          inputs: { category: info.row.original, updateStatus: this.updateCategoryStatus },
        }),
      enableSorting: false,
    }),
  ]);

  ngOnInit(): void {
    merge(this.searchControl.valueChanges, this.statusControl.valueChanges)
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.updateSearchQueryParam()),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe();

    this._route.queryParamMap
      .pipe(
        map((params) => ({
          search: params.get('search') ?? '',
          statuses: params
            .getAll('status')
            .filter((status): status is 'active' | 'inactive' => status === 'active' || status === 'inactive'),
        })),
        tap(({ search, statuses }) => {
          this.searchControl.setValue(search, { emitEvent: false });
          this.statusControl.setValue(statuses, { emitEvent: false });
          this.table.setPageIndex(0);
        }),
        switchMap(({ search, statuses }) => this._categoryService.getCategories({ search, statuses })),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(({ data }) => this.data.set(data));
  }

  readonly table = injectTable(() => ({
    key: 'expense-category-list',
    features: categoryTableFeatures,
    columns: this.columns,
    data: this.data(),
    getRowId: (category) => String(category.id),
    state: { sorting: this.sorting() },
    onSortingChange: (updater) =>
      isFunction(updater) ? this.sorting.update(updater) : this.sorting.set(updater),
  }));

  private updateSearchQueryParam(): void {
    void this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        search: this.searchControl.value.trim() || null,
        status: this.statusControl.value,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  clearFilters(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.statusControl.setValue([], { emitEvent: false });
    this.updateSearchQueryParam();
  }

  toggleStatus(status: 'active' | 'inactive', checked: boolean): void {
    if (checked) {
      if (!this.statusControl.value.includes(status)) {
        this.statusControl.setValue([...this.statusControl.value, status]);
      }
      return;
    }

    this.statusControl.setValue(this.statusControl.value.filter((item) => item !== status));
  }

  onCreateDialogStateChange(state: string): void {
    if (state === 'open' || state === 'closed') this.createDialogState.set(state);
  }

  createCategory(): void {
    if (this.createCategoryForm.invalid) {
      this.createCategoryForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this._categoryService
      .createCategory(this.createCategoryForm.getRawValue())
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          toast.success('Expense category created');
          this.createCategoryForm.reset({ name: '', description: '', isActive: true });
          this.createDialogState.set('closed');
          this.reloadCategories();
          this.isSubmitting.set(false);
        },
        error: () => {
          toast.error('Unable to create expense category');
          this.isSubmitting.set(false);
        },
      });
  }

  private readonly updateCategoryStatus: CategoryStatusHandler = (categoryId, isActive) => {
    this._categoryService.updateCategoryStatus(categoryId, isActive).subscribe({
      next: (updatedCategory) => {
        toast.success(isActive ? 'Category activated' : 'Category deactivated');
        this.reloadCategories();
      },
      error: () => toast.error('Unable to update category status'),
    });
  };

  private reloadCategories(): void {
    this._categoryService
      .getCategories({
        search: this.searchControl.value,
        statuses: this.statusControl.value,
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(({ data }) => this.data.set(data));
  }
}