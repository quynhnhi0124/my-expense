import { Component } from '@angular/core';
import { HlmBreadcrumbImports } from '@spartan-ng/helm/breadcrumb';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

@Component({
  imports: [HlmSidebarImports, HlmSeparatorImports, HlmBreadcrumbImports],
  selector: 'app-header',
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class SiteHeader {}
