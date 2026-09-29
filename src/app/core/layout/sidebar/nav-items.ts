import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBookOpen,
  lucideBot,
  lucideChevronRight,
  lucideReceipt,
  lucideSettings2,
  lucideSquareTerminal,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmCollapsibleImports } from '@spartan-ng/helm/collapsible';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

@Component({
  selector: 'nav-items',
  imports: [HlmSidebarImports, NgIcon, HlmCollapsibleImports, RouterLink],
  providers: [
    provideIcons({
      lucideSquareTerminal,
      lucideBot,
      lucideBookOpen,
      lucideSettings2,
      lucideChevronRight,
      lucideReceipt,
      lucideUsers,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-sidebar-group>
      <ul hlmSidebarMenu>
        @for (item of items(); track $index) {
          <!-- <hlm-collapsible [expanded]="item.isActive ?? false" class="group/collapsible">
            <li hlmSidebarMenuItem>
              <button
                hlmCollapsibleTrigger
                hlmSidebarMenuButton
                class="flex w-full items-center justify-between"
              >
                <span>{{ item.title }} 1111111</span>
                <ng-icon
                  name="lucideChevronRight"
                  class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                  hlm
                />
              </button>
              <hlm-collapsible-content>
                <ul hlmSidebarMenuSub>
                  @for (subItem of item.items; track subItem.title) {
                    <li hlmSidebarMenuSubItem>
                      <button hlmSidebarMenuSubButton class="w-full">
                        <span>{{ subItem.title }}</span>
                      </button>
                    </li>
                  }
                </ul>
              </hlm-collapsible-content>
            </li>
          </hlm-collapsible> -->
          <hlm-collapsible [expanded]="item.isActive ?? false" class="group/collapsible">
            <li hlmSidebarMenuItem>
              @if (item.items; as subItems) {
                <button
                  hlmCollapsibleTrigger
                  hlmSidebarMenuButton
                  /* hlmSidebarMenuAction */
                  class="flex w-full items-center justify-between"
                >
                  <ng-icon [name]="item.icon" />
                  <span>{{ item.title }}</span>
                  <ng-icon
                    name="lucideChevronRight"
                    class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                    hlm
                  />
                </button>
                <hlm-collapsible-content>
                  <ul hlmSidebarMenuSub>
                    @for (subItem of subItems; track $index) {
                      <li hlmSidebarMenuSubItem>
                        <a hlmSidebarMenuSubButton [routerLink]="subItem.url">{{
                          subItem.title
                        }}</a>
                      </li>
                    }
                  </ul>
                </hlm-collapsible-content>
              } @else {
                <a hlmSidebarMenuButton [routerLink]="item.url">
                  <ng-icon [name]="item.icon" />
                  {{ item.title }}
                </a>
              }
            </li>
          </hlm-collapsible>
        }
      </ul>
    </hlm-sidebar-group>
  `,
})
export class NavItems {
  public readonly items = input.required<
    {
      title: string;
      url: string;
      icon: string;
      isActive?: boolean;
      items?: {
        title: string;
        url: string;
      }[];
    }[]
  >();
}
