import { Component, input } from '@angular/core';

@Component({
  selector: 'table-data-header',
  template: `
    <header>
      <h2 class="text-2xl font-bold tracking-tight">{{ title() }}</h2>
      <p class="text-muted-foreground">{{ description() }}</p>
    </header>
  `,
  imports: [],
})
export class TableDataHeader {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
}
