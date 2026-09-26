import { Component, ViewEncapsulation } from '@angular/core';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';
import { SiteHeader } from '../header/header';
import { AppSidebar } from '../sidebar/sidebar';

@Component({
  imports: [HlmSidebarImports, SiteHeader, AppSidebar],
  selector: 'app-layout',
  styleUrl: './app-layout.css',
  templateUrl: './app-layout.html',
  	encapsulation: ViewEncapsulation.None,
	host: {
		class: 'block',
	},
})
export class AppLayout {}
