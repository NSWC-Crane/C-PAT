import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppConfigComponent } from './components/app.config.component';
import { AppLayoutComponent } from './components/app.layout.component';
import { AppClassificationComponent } from './components/app.classification.component';
import { AppNavigationComponent } from './components/app.navigation.component';
import { AppMenuComponent } from './components/app.menu.component';
import { AppMenuitemComponent } from './components/app.menuitem.component';
import { AppSearchComponent } from '../common/components/search/app.search.component';
import { SharedModule } from '../common/shared.module';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        SharedModule,
        AppSearchComponent,
        AppLayoutComponent,
        AppClassificationComponent,
        AppNavigationComponent,
        AppMenuComponent,
        AppMenuitemComponent,
        AppConfigComponent,
    ],
    exports: [AppLayoutComponent, AppConfigComponent],
})
export class AppConfigModule {}
