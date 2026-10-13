import { Component, input } from "@angular/core";
import { HlmBadgeImports } from "@spartan-ng/helm/badge";

export type StatusBadgeProps  = {
  label: string;
  variant?: 'secondary' | 'destructive' | 'outline' | 'ghost';
  styles?: string;
}
@Component({
  selector: 'status-badge',
  imports: [HlmBadgeImports],
  template: `<span hlmBadge [variant]="dataBadge()?.variant" [class]="dataBadge()?.styles">{{
    dataBadge().label
  }}</span>`,
})
export class StatusBadge {
  readonly dataBadge = input.required<StatusBadgeProps >();
}