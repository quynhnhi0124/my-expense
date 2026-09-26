import { Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronsUpDown, lucideCommand } from '@ng-icons/lucide';
import { HlmSidebarImports, HlmSidebarService } from '@spartan-ng/helm/sidebar';
import { NavItems } from './nav-items';
import { data } from './data';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmDropdownMenuImports } from '@spartan-ng/helm/dropdown-menu';


@Component({
  imports: [HlmSidebarImports, NgIcon, NavItems, HlmAvatarImports, HlmDropdownMenuImports],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
  providers: [provideIcons({lucideCommand, lucideChevronsUpDown})]
})
export class AppSidebar {
  private readonly _sidebarService = inject(HlmSidebarService);
	protected readonly _menuSide = computed(() => (this._sidebarService.isMobile() ? 'top' : 'right'));
  public readonly user = {
    name: "string",
		email: "string",
		avatar: "string",
	};
  data = data;
}
