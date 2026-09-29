import { Component } from "@angular/core";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideEllipsis } from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmDropdownMenuImports } from "@spartan-ng/helm/dropdown-menu";

@Component({
  imports: [HlmButtonImports, NgIcon, HlmDropdownMenuImports],
  providers: [provideIcons({ lucideEllipsis })],
  templateUrl: './user-table-actions.html',
})
export class UserActionsButton {}