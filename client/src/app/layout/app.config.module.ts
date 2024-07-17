import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ListboxModule } from 'primeng/listbox';
import { SidebarModule } from 'primeng/sidebar';
import { BadgeModule } from 'primeng/badge';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { AppConfigComponent } from './components/app.config.component';
import { AppLayoutComponent } from './components/app.layout.component';
import { AppClassificationComponent } from './components/app.classification.component';
import { AppNavigationComponent } from './components/app.navigation.component';
import { AppMenuComponent } from './components/app.menu.component';
import { AppMenuitemComponent } from './components/app.menuitem.component';
import { AppSearchComponent } from '../common/components/search/app.search.component';
import { SharedModule } from '../common/shared.module';
import { PanelMenuModule } from 'primeng/panelmenu';
import { DropdownModule } from 'primeng/dropdown';

@NgModule({
  declarations: [
    AppLayoutComponent,
    AppClassificationComponent,
    AppNavigationComponent,
    AppMenuComponent,
    AppMenuitemComponent,
    AppConfigComponent
  ],
  imports: [
    CommonModule,
    DropdownModule,
    FormsModule, 
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    ListboxModule,
    SidebarModule,
    BadgeModule,
    RadioButtonModule,
    InputSwitchModule,
    ButtonModule,
    OverlayPanelModule,
    SelectButtonModule,
    TooltipModule,
    MenuModule,
    RippleModule,
    SharedModule,
    PanelMenuModule,
    AppSearchComponent
  ],
  exports: [
    AppLayoutComponent,
    AppConfigComponent
  ]
})
export class AppConfigModule { }
