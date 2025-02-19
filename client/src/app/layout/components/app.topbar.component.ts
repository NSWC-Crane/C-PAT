/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { AppConfigService } from '../services/appconfigservice';
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  inject,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { StyleClass } from 'primeng/styleclass';
import { AppSearchComponent } from '../../common/components/search/app.search.component';
import { AppConfiguratorComponent } from '../components/app.configurator.component';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, filter, map, merge, of, switchMap, take, takeUntil } from 'rxjs';
import { NotificationService } from '../../common/components/notifications/notifications.service';
import { Popover } from 'primeng/popover';
import { NotificationsPanelComponent } from '../../common/components/notifications/notifications-popover/notifications-popover.component';
import { AuthService } from '../../core/auth/services/auth.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';


@Component({
  selector: 'cpat-topbar',
  standalone: true,
  imports: [
    AppSearchComponent,
    CommonModule,
    FormsModule,
    StyleClass,
    RouterModule,
    AppConfiguratorComponent,
    Popover,
    NotificationsPanelComponent,
  ],
  template: `<div class="layout-topbar">
    <div class="layout-topbar-inner">
      <div class="layout-topbar-logo-container">
        <a [routerLink]="['/']" class="layout-topbar-logo" aria-label="PrimeNG Logo">
          <svg
            width="170"
            height="50"
            viewBox="0 0 170 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="18%"
                  style="stop-color:var(--high-contrast-text-color); stop-opacity: 0.5"
                />
                <stop offset="48%" style="stop-color:var(--p-primary-color); stop-opacity: 0.8" />
              </linearGradient>
            </defs>
            <g transform="matrix(1,0,0,1.3333375,-308.99834,-252.67754)">
              <path
                fill="url(#logoGradient)"
                transform="scale(1.1524269,0.867734)"
                d="m 299.35694,252.71645 h -22.1684 q -0.85081,0 -1.84343,-0.18907 -0.96898,-0.21271 -1.93796,-0.63811 -0.94535,-0.42541 -1.81979,-1.08715 -0.87445,-0.68538 -1.55983,-1.63073 -0.66174,-0.96898 -1.06351,-2.22156 -0.40178,-1.27622 -0.40178,-2.85968 v -16.63812 q 0,-0.85081 0.18907,-1.81979 0.21271,-0.99262 0.63811,-1.93797 0.42541,-0.96898 1.11079,-1.84342 0.68537,-0.87445 1.63072,-1.53619 0.96898,-0.68538 2.22157,-1.08715 1.25258,-0.40178 2.83604,-0.40178 h 22.1684 v 6.14476 h -22.1684 q -1.20532,0 -1.84343,0.63811 -0.63811,0.63811 -0.63811,1.8907 v 16.59085 q 0,1.18168 0.63811,1.84343 0.66175,0.63811 1.84343,0.63811 h 22.1684 z m 39.58643,-19.7105 q 0,2.1034 -0.51994,3.75775 -0.51994,1.65436 -1.41802,2.93058 -0.87445,1.25259 -2.0325,2.15067 -1.15805,0.89808 -2.43427,1.46529 -1.25258,0.56721 -2.55244,0.82718 -1.27621,0.25997 -2.41063,0.25997 h -13.89661 v -6.14476 h 13.89661 q 1.18168,-0.0945 2.12703,-0.47268 0.96898,-0.40177 1.65436,-1.06351 0.68538,-0.66175 1.06351,-1.58346 0.37814,-0.94535 0.37814,-2.12703 v -2.78878 q -0.11816,-1.15805 -0.4963,-2.12703 -0.37814,-0.96898 -1.03989,-1.65436 -0.63811,-0.68537 -1.55982,-1.06351 -0.92171,-0.40178 -2.12703,-0.40178 h -13.84934 q -1.22896,0 -1.86707,0.63811 -0.63811,0.63811 -0.63811,1.84343 v 25.26442 h -6.14476 v -25.26442 q 0,-2.36337 0.85082,-4.01773 0.87444,-1.65436 2.15066,-2.6706 1.29986,-1.01625 2.81241,-1.46529 1.51256,-0.47268 2.78878,-0.47268 h 13.89661 q 2.07976,0 3.73412,0.54358 1.65436,0.51994 2.90695,1.41802 1.27621,0.87445 2.15066,2.0325 0.89808,1.15805 1.46529,2.43427 0.59084,1.25258 0.85081,2.55244 0.25997,1.27622 0.25997,2.41063 z m 38.49929,19.7105 h -6.14476 v -8.31906 h -21.60119 v 8.31906 h -6.14476 v -16.94536 q 0,-3.71049 1.27622,-6.83014 1.27621,-3.11964 3.54505,-5.36484 2.26883,-2.24521 5.36485,-3.49779 3.09601,-1.25259 6.75923,-1.25259 h 13.84934 q 0.63811,0 1.20532,0.23634 0.56721,0.23634 0.99262,0.66174 0.4254,0.42541 0.66174,0.99262 0.23634,0.56721 0.23634,1.20532 z m -27.74595,-14.46382 h 21.60119 v -13.28214 h -10.8006 q -0.2836,0 -1.20532,0.0945 -0.89808,0.0709 -2.10339,0.40177 -1.18169,0.33087 -2.50518,1.01625 -1.32348,0.68538 -2.43427,1.89069 -1.11078,1.20532 -1.84342,3.02512 -0.70901,1.79616 -0.70901,4.37223 z m 65.51258,-13.28214 h -13.54211 v 27.74596 h -6.14476 v -27.74596 h -13.56574 v -6.14476 h 33.25261 z"
              />
              <path
                style="fill: var(--high-contrast-text-color); stroke: var(--high-contrast-text-color); stroke-width: 0.4; opacity: 0.6; "
                d="m 314.57522,227.09915 h -4.01464 q -0.15409,0 -0.33384,-0.0252 -0.17549,-0.0284 -0.35096,-0.0852 -0.1712,-0.0569 -0.32956,-0.14524 -0.15837,-0.0916 -0.28248,-0.21784 -0.11984,-0.12945 -0.1926,-0.29679 -0.0728,-0.17049 -0.0728,-0.38202 v -2.2227 q 0,-0.11366 0.0342,-0.24311 0.0385,-0.1326 0.1155,-0.25889 0.0771,-0.12945 0.20116,-0.24627 0.12411,-0.11681 0.29531,-0.20522 0.17549,-0.0916 0.40233,-0.14523 0.22684,-0.0537 0.5136,-0.0537 h 4.01463 v 0.82089 h -4.01463 q -0.21829,0 -0.33385,0.0853 -0.11549,0.0852 -0.11549,0.25258 v 2.21639 q 0,0.15786 0.11549,0.24626 0.11985,0.0852 0.33385,0.0852 h 4.01463 z m 7.1861,-3.00569 q 0,0.28099 -0.0942,0.502 -0.0942,0.22101 -0.2568,0.39149 -0.15836,0.16734 -0.36808,0.28732 -0.20972,0.11997 -0.44083,0.1989 -0.22685,0.0758 -0.46225,0.11051 -0.23112,0.0347 -0.43655,0.0347 l 2.32403,1.48075 h -1.72056 l -2.31976,-1.48075 h -0.80035 v -0.82089 h 2.51664 q 0.20971,-0.0126 0.38091,-0.0631 0.17549,-0.0537 0.2996,-0.14207 0.1284,-0.0884 0.19689,-0.21153 0.0685,-0.12629 0.0685,-0.28731 v -0.51779 q 0,-0.0695 -0.0256,-0.10419 -0.0214,-0.0379 -0.06,-0.0537 -0.0342,-0.019 -0.0771,-0.0221 -0.0385,-0.003 -0.0728,-0.003 h -3.67223 v 3.70661 h -1.1128 v -4.11389 q 0,-0.0852 0.0428,-0.16102 0.0428,-0.0758 0.11562,-0.13261 0.0771,-0.0568 0.17977,-0.0884 0.10269,-0.0316 0.22256,-0.0316 h 4.22435 q 0.37236,0 0.62916,0.10104 0.2568,0.0979 0.41517,0.24942 0.16263,0.14839 0.23111,0.32204 0.0728,0.17365 0.0728,0.32519 z m 7.13904,3.00569 h -1.1128 v -1.11134 h -3.91191 v 1.11134 h -1.1128 v -2.26374 q 0,-0.49569 0.23111,-0.91245 0.23112,-0.41675 0.642,-0.71669 0.41089,-0.29994 0.97156,-0.46727 0.56068,-0.16734 1.22408,-0.16734 h 2.50808 q 0.11562,0 0.21828,0.0316 0.10269,0.0316 0.17976,0.0884 0.0771,0.0569 0.11984,0.13261 0.0428,0.0757 0.0428,0.16102 z m -5.02471,-1.93223 h 3.91191 v -1.77437 h -1.95596 q -0.0513,0 -0.21828,0.0126 -0.16264,0.009 -0.38092,0.0537 -0.214,0.0442 -0.45368,0.13576 -0.23967,0.0916 -0.44084,0.25258 -0.20116,0.16102 -0.33383,0.40413 -0.1284,0.23995 -0.1284,0.58409 z m 12.4505,1.58178 q 0,0.0884 -0.047,0.16417 -0.0428,0.0757 -0.11984,0.13261 -0.0728,0.0537 -0.17549,0.0852 -0.10269,0.0316 -0.21827,0.0316 -0.10269,0 -0.20973,-0.0284 -0.10269,-0.0284 -0.18403,-0.0916 l -4.066,-3.13198 v 3.18882 h -1.1128 v -4.17704 q 0,-0.12629 0.0942,-0.22732 0.0984,-0.10419 0.24823,-0.15471 0.15837,-0.0473 0.32529,-0.0221 0.16691,0.0221 0.28675,0.11366 l 4.066,3.12883 v -3.18882 h 1.1128 z m 6.33868,-1.49969 h -3.51388 v -0.8272 h 3.51388 z m 0.50075,1.85014 h -4.01463 q -0.23112,0 -0.50503,-0.0599 -0.27393,-0.06 -0.50933,-0.19574 -0.23112,-0.13892 -0.38949,-0.35677 -0.15407,-0.22101 -0.15407,-0.53989 v -2.96149 q 0,-0.0852 0.0428,-0.16102 0.0428,-0.0758 0.1155,-0.13261 0.0771,-0.0568 0.17976,-0.0884 0.10269,-0.0316 0.22256,-0.0316 h 5.01187 v 0.82088 h -4.45975 v 2.55422 q 0,0.16101 0.1155,0.24626 0.11561,0.0852 0.33812,0.0852 h 4.00607 z m 10.04088,-2.63314 q 0,0.281 -0.0942,0.502 -0.0942,0.22101 -0.2568,0.3915 -0.15835,0.16733 -0.36808,0.28731 -0.20972,0.11998 -0.44084,0.19575 -0.22683,0.0758 -0.46223,0.1105 -0.23113,0.0347 -0.43657,0.0347 h -2.51663 v -0.82088 h 2.51663 q 0.214,-0.0126 0.3852,-0.0631 0.17548,-0.0537 0.2996,-0.14208 0.12413,-0.0884 0.1926,-0.21154 0.0685,-0.12629 0.0685,-0.28415 v -0.37255 q -0.0214,-0.15471 -0.0899,-0.28415 -0.0685,-0.12945 -0.18831,-0.22101 -0.1155,-0.0916 -0.28248,-0.14207 -0.16692,-0.0537 -0.3852,-0.0537 h -2.50807 q -0.22256,0 -0.33813,0.0853 -0.11562,0.0852 -0.11562,0.24625 v 3.3751 h -1.1128 v -3.3751 q 0,-0.31572 0.15409,-0.53673 0.15836,-0.221 0.38947,-0.35676 0.2354,-0.13576 0.50933,-0.19575 0.27391,-0.0631 0.50504,-0.0631 h 2.51663 q 0.37664,0 0.67624,0.0727 0.2996,0.0695 0.52644,0.18943 0.23112,0.11682 0.38949,0.27153 0.16263,0.1547 0.26535,0.3252 0.107,0.16732 0.15409,0.34097 0.047,0.1705 0.047,0.32205 z m 7.39155,0.80194 q 0,0.4136 -0.1926,0.76089 -0.1926,0.3473 -0.535,0.59988 -0.3424,0.25258 -0.8132,0.39465 -0.46652,0.13893 -1.01863,0.13893 h -1.50657 q -0.55211,0 -1.02291,-0.13893 -0.4708,-0.14207 -0.8132,-0.39465 -0.3424,-0.25258 -0.53929,-0.59988 -0.1926,-0.34729 -0.1926,-0.76089 v -0.86509 q 0,-0.41044 0.1926,-0.75773 0.19689,-0.35045 0.53929,-0.59988 0.3424,-0.25258 0.8132,-0.39466 0.4708,-0.14207 1.02291,-0.14207 h 1.50657 q 0.55211,0 1.01863,0.14207 0.4708,0.14208 0.8132,0.39466 0.3424,0.24943 0.535,0.59988 0.1926,0.34729 0.1926,0.75773 z m -1.1128,-0.86509 q 0,-0.2431 -0.107,-0.43885 -0.10269,-0.19891 -0.29532,-0.33782 -0.18831,-0.14208 -0.45796,-0.21786 -0.26535,-0.0789 -0.58635,-0.0789 h -1.50657 q -0.32527,0 -0.59491,0.0789 -0.26536,0.0758 -0.45796,0.21786 -0.1926,0.13891 -0.2996,0.33782 -0.10269,0.19575 -0.10269,0.43885 v 0.86509 q 0,0.24311 0.10269,0.44202 0.107,0.19574 0.2996,0.33782 0.1926,0.13891 0.45796,0.21785 0.26964,0.0757 0.59491,0.0757 h 1.498 q 0.32528,0 0.59064,-0.0757 0.26964,-0.0789 0.46224,-0.21785 0.1926,-0.14208 0.29532,-0.33782 0.107,-0.19891 0.107,-0.44202 z m 8.23471,2.69629 h -1.11279 v -1.11134 h -3.91192 v 1.11134 h -1.11279 v -2.26374 q 0,-0.49569 0.23111,-0.91245 0.23112,-0.41675 0.642,-0.71669 0.41088,-0.29994 0.97156,-0.46727 0.56068,-0.16734 1.22408,-0.16734 h 2.50808 q 0.1155,0 0.21827,0.0316 0.1027,0.0316 0.17976,0.0884 0.0771,0.0569 0.11984,0.13261 0.0428,0.0757 0.0428,0.16102 z m -5.02471,-1.93223 h 3.91192 v -1.77437 h -1.95596 q -0.0513,0 -0.21828,0.0126 -0.16265,0.009 -0.38092,0.0537 -0.214,0.0442 -0.45368,0.13576 -0.23968,0.0916 -0.44085,0.25258 -0.20115,0.16102 -0.33383,0.40413 -0.1284,0.23995 -0.1284,0.58409 z m 13.46059,1.93223 h -1.12137 v -2.69629 l -1.97307,2.56053 q -0.0728,0.0979 -0.20544,0.14839 -0.1284,0.0505 -0.2782,0.0505 -0.14552,0 -0.27392,-0.0505 -0.12412,-0.0505 -0.19688,-0.14839 l -1.98164,-2.56053 v 2.69629 h -1.1128 v -4.17703 q 0,-0.14208 0.11131,-0.25258 0.1155,-0.1105 0.2996,-0.14839 0.0899,-0.0158 0.17976,-0.009 0.0899,0.003 0.1712,0.0284 0.0856,0.0221 0.15408,0.0663 0.0685,0.041 0.1155,0.10103 l 2.53375,3.24881 2.53376,-3.24881 q 0.0985,-0.11998 0.26964,-0.17049 0.17549,-0.0505 0.3638,-0.0158 0.17976,0.0379 0.29533,0.14839 0.1155,0.1105 0.1155,0.25258 z m 10.16499,0 h -1.1128 v -1.11134 h -3.91192 v 1.11134 h -1.1128 v -2.26374 q 0,-0.49569 0.23112,-0.91245 0.23112,-0.41675 0.642,-0.71669 0.41088,-0.29994 0.97156,-0.46727 0.56068,-0.16734 1.22408,-0.16734 h 2.50807 q 0.11562,0 0.21829,0.0316 0.10269,0.0316 0.17976,0.0884 0.0771,0.0569 0.11984,0.13261 0.0428,0.0757 0.0428,0.16102 z m -5.02472,-1.93223 h 3.91192 v -1.77437 h -1.95596 q -0.0513,0 -0.21828,0.0126 -0.16264,0.009 -0.38092,0.0537 -0.214,0.0442 -0.45368,0.13576 -0.23968,0.0916 -0.44084,0.25258 -0.20116,0.16102 -0.33384,0.40413 -0.1284,0.23995 -0.1284,0.58409 z m 12.33068,1.51863 q 0,0.0884 -0.0428,0.16418 -0.0428,0.0757 -0.11984,0.13261 -0.0771,0.0537 -0.17976,0.0853 -0.10269,0.0316 -0.21828,0.0316 h -2.50808 q -0.35525,0 -0.71905,-0.0569 -0.36379,-0.0569 -0.70619,-0.17365 -0.33812,-0.11997 -0.63772,-0.3031 -0.2996,-0.18311 -0.52644,-0.43254 -0.22256,-0.25257 -0.35096,-0.57461 -0.1284,-0.3252 -0.1284,-0.72301 v -2.26375 h 1.1128 v 2.26375 q 0,0.3473 0.1284,0.58725 0.13269,0.23995 0.33384,0.40096 0.20116,0.16103 0.44084,0.25258 0.23968,0.0916 0.45368,0.13577 0.21828,0.0442 0.38092,0.0569 0.16692,0.009 0.21828,0.009 h 1.95596 v -3.70661 h 1.1128 z m 6.83942,-3.293 h -2.45243 v 3.7066 h -1.1128 v -3.7066 h -2.45672 v -0.82089 h 6.02195 z m 7.17328,1.8754 q 0,0.4136 -0.1926,0.76089 -0.1926,0.3473 -0.535,0.59988 -0.3424,0.25258 -0.8132,0.39465 -0.46651,0.13893 -1.01864,0.13893 h -1.50656 q -0.55211,0 -1.02291,-0.13893 -0.4708,-0.14207 -0.8132,-0.39465 -0.3424,-0.25258 -0.53928,-0.59988 -0.1926,-0.34729 -0.1926,-0.76089 v -0.86509 q 0,-0.41044 0.1926,-0.75773 0.19688,-0.35045 0.53928,-0.59988 0.3424,-0.25258 0.8132,-0.39466 0.4708,-0.14207 1.02291,-0.14207 h 1.50656 q 0.55213,0 1.01864,0.14207 0.4708,0.14208 0.8132,0.39466 0.3424,0.24943 0.535,0.59988 0.1926,0.34729 0.1926,0.75773 z m -1.1128,-0.86509 q 0,-0.2431 -0.107,-0.43885 -0.10269,-0.19891 -0.29532,-0.33782 -0.18832,-0.14208 -0.45796,-0.21786 -0.26536,-0.0789 -0.58636,-0.0789 h -1.50656 q -0.32528,0 -0.59491,0.0789 -0.26537,0.0758 -0.45797,0.21786 -0.1926,0.13891 -0.2996,0.33782 -0.10269,0.19575 -0.10269,0.43885 v 0.86509 q 0,0.24311 0.10269,0.44202 0.107,0.19574 0.2996,0.33782 0.1926,0.13891 0.45797,0.21785 0.26963,0.0757 0.59491,0.0757 h 1.498 q 0.32529,0 0.59064,-0.0757 0.26964,-0.0789 0.46224,-0.21785 0.1926,-0.14208 0.29532,-0.33782 0.107,-0.19891 0.107,-0.44202 z m 9.35607,2.69629 h -1.12136 v -2.69629 l -1.97308,2.56053 q -0.0728,0.0979 -0.20544,0.14839 -0.1284,0.0505 -0.2782,0.0505 -0.14551,0 -0.27391,-0.0505 -0.12413,-0.0505 -0.19689,-0.14839 l -1.98164,-2.56053 v 2.69629 h -1.1128 v -4.17703 q 0,-0.14208 0.11131,-0.25258 0.1155,-0.1105 0.2996,-0.14839 0.0899,-0.0158 0.17976,-0.009 0.0899,0.003 0.1712,0.0284 0.0856,0.0221 0.15408,0.0663 0.0685,0.041 0.1155,0.10103 l 2.53376,3.24881 2.53375,-3.24881 q 0.0984,-0.11998 0.26964,-0.17049 0.17549,-0.0505 0.3638,-0.0158 0.17976,0.0379 0.29533,0.14839 0.11562,0.1105 0.11562,0.25258 z m 7.31451,0 h -1.1128 v -1.11134 h -3.91191 v 1.11134 h -1.1128 v -2.26374 q 0,-0.49569 0.23112,-0.91245 0.23112,-0.41675 0.642,-0.71669 0.41088,-0.29994 0.97156,-0.46727 0.56068,-0.16734 1.22408,-0.16734 h 2.50808 q 0.1155,0 0.21827,0.0316 0.10269,0.0316 0.17977,0.0884 0.0771,0.0569 0.11983,0.13261 0.0428,0.0757 0.0428,0.16102 z m -5.02471,-1.93223 h 3.91191 v -1.77437 h -1.95595 q -0.0514,0 -0.21828,0.0126 -0.16264,0.009 -0.38092,0.0537 -0.214,0.0442 -0.45368,0.13576 -0.23968,0.0916 -0.44084,0.25258 -0.20115,0.16102 -0.33384,0.40413 -0.1284,0.23995 -0.1284,0.58409 z m 11.86416,-1.77437 h -2.45244 v 3.7066 h -1.1128 v -3.7066 h -2.45673 v -0.82089 h 6.02197 z m 1.93882,3.7066 h -1.11279 v -4.52749 h 1.11279 z m 7.74252,-1.8312 q 0,0.4136 -0.1926,0.76089 -0.1926,0.3473 -0.535,0.59988 -0.3424,0.25258 -0.8132,0.39465 -0.46652,0.13893 -1.01864,0.13893 h -1.50655 q -0.55213,0 -1.02293,-0.13893 -0.4708,-0.14207 -0.8132,-0.39465 -0.3424,-0.25258 -0.53927,-0.59988 -0.1926,-0.34729 -0.1926,-0.76089 v -0.86509 q 0,-0.41044 0.1926,-0.75773 0.19687,-0.35045 0.53927,-0.59988 0.3424,-0.25258 0.8132,-0.39466 0.4708,-0.14207 1.02293,-0.14207 h 1.50655 q 0.55212,0 1.01864,0.14207 0.4708,0.14208 0.8132,0.39466 0.3424,0.24943 0.535,0.59988 0.1926,0.34729 0.1926,0.75773 z m -1.1128,-0.86509 q 0,-0.2431 -0.107,-0.43885 -0.10269,-0.19891 -0.29532,-0.33782 -0.18832,-0.14208 -0.45796,-0.21786 -0.26536,-0.0789 -0.58636,-0.0789 h -1.50655 q -0.32529,0 -0.59493,0.0789 -0.26536,0.0758 -0.45796,0.21786 -0.1926,0.13891 -0.2996,0.33782 -0.10269,0.19575 -0.10269,0.43885 v 0.86509 q 0,0.24311 0.10269,0.44202 0.107,0.19574 0.2996,0.33782 0.1926,0.13891 0.45796,0.21785 0.26964,0.0757 0.59493,0.0757 h 1.498 q 0.32527,0 0.59064,-0.0757 0.26963,-0.0789 0.46223,-0.21785 0.1926,-0.14208 0.29532,-0.33782 0.107,-0.19891 0.107,-0.44202 z m 8.34599,2.34584 q 0,0.0884 -0.047,0.16417 -0.0428,0.0757 -0.11985,0.13261 -0.0728,0.0537 -0.17547,0.0852 -0.10269,0.0316 -0.21828,0.0316 -0.10269,0 -0.20972,-0.0284 -0.10269,-0.0284 -0.18404,-0.0916 l -4.066,-3.13198 v 3.18882 h -1.11279 v -4.17704 q 0,-0.12629 0.0942,-0.22732 0.0985,-0.10419 0.24824,-0.15471 0.15836,-0.0473 0.32528,-0.0221 0.16692,0.0221 0.28676,0.11366 l 4.066,3.12883 v -3.18882 h 1.1128 z m 9.59576,-3.35615 h -2.45244 v 3.7066 h -1.1128 v -3.7066 h -2.45672 v -0.82089 h 6.02196 z m 7.17327,1.8754 q 0,0.4136 -0.1926,0.76089 -0.1926,0.3473 -0.535,0.59988 -0.3424,0.25258 -0.8132,0.39465 -0.46652,0.13893 -1.01864,0.13893 h -1.50656 q -0.55211,0 -1.02291,-0.13893 -0.4708,-0.14207 -0.8132,-0.39465 -0.3424,-0.25258 -0.53928,-0.59988 -0.1926,-0.34729 -0.1926,-0.76089 v -0.86509 q 0,-0.41044 0.1926,-0.75773 0.19688,-0.35045 0.53928,-0.59988 0.3424,-0.25258 0.8132,-0.39466 0.4708,-0.14207 1.02291,-0.14207 h 1.50656 q 0.55212,0 1.01864,0.14207 0.4708,0.14208 0.8132,0.39466 0.3424,0.24943 0.535,0.59988 0.1926,0.34729 0.1926,0.75773 z m -1.1128,-0.86509 q 0,-0.2431 -0.107,-0.43885 -0.10269,-0.19891 -0.29532,-0.33782 -0.18832,-0.14208 -0.45795,-0.21786 -0.26537,-0.0789 -0.58637,-0.0789 h -1.50656 q -0.32527,0 -0.59491,0.0789 -0.26536,0.0758 -0.45796,0.21786 -0.1926,0.13891 -0.2996,0.33782 -0.10269,0.19575 -0.10269,0.43885 v 0.86509 q 0,0.24311 0.10269,0.44202 0.107,0.19574 0.2996,0.33782 0.1926,0.13891 0.45796,0.21785 0.26964,0.0757 0.59491,0.0757 h 1.498 q 0.32529,0 0.59064,-0.0757 0.26964,-0.0789 0.46224,-0.21785 0.1926,-0.14208 0.29532,-0.33782 0.107,-0.19891 0.107,-0.44202 z m 8.65416,0.86509 q 0,0.4136 -0.1926,0.76089 -0.1926,0.3473 -0.535,0.59988 -0.3424,0.25258 -0.8132,0.39465 -0.46651,0.13893 -1.01864,0.13893 h -1.50656 q -0.55211,0 -1.02291,-0.13893 -0.4708,-0.14207 -0.8132,-0.39465 -0.3424,-0.25258 -0.53928,-0.59988 -0.1926,-0.34729 -0.1926,-0.76089 v -0.86509 q 0,-0.41044 0.1926,-0.75773 0.19688,-0.35045 0.53928,-0.59988 0.3424,-0.25258 0.8132,-0.39466 0.4708,-0.14207 1.02291,-0.14207 h 1.50656 q 0.55213,0 1.01864,0.14207 0.4708,0.14208 0.8132,0.39466 0.3424,0.24943 0.535,0.59988 0.1926,0.34729 0.1926,0.75773 z m -1.1128,-0.86509 q 0,-0.2431 -0.107,-0.43885 -0.10269,-0.19891 -0.29532,-0.33782 -0.18832,-0.14208 -0.45795,-0.21786 -0.26537,-0.0789 -0.58637,-0.0789 h -1.50656 q -0.32528,0 -0.59491,0.0789 -0.26537,0.0758 -0.45797,0.21786 -0.1926,0.13891 -0.2996,0.33782 -0.10269,0.19575 -0.10269,0.43885 v 0.86509 q 0,0.24311 0.10269,0.44202 0.107,0.19574 0.2996,0.33782 0.1926,0.13891 0.45797,0.21785 0.26963,0.0757 0.59491,0.0757 h 1.498 q 0.32529,0 0.59064,-0.0757 0.26965,-0.0789 0.46224,-0.21785 0.1926,-0.14208 0.29532,-0.33782 0.107,-0.19891 0.107,-0.44202 z m 7.84952,2.69629 h -5.07608 q -0.11984,0 -0.22256,-0.0316 -0.10269,-0.0316 -0.17977,-0.0853 -0.0728,-0.0569 -0.11561,-0.13261 -0.0428,-0.0758 -0.0428,-0.16418 v -4.11388 h 1.1128 v 3.7066 h 4.52396 z"
              />
            </g>
          </svg>
        </a>
        <svg
          width="50"
          height="50"
          viewBox="0 0 50 50"
          xmlns="http://www.w3.org/2000/svg"
          class="layout-topbar-icon"
        >
          <defs>
            <linearGradient id="smallLogoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color: var(--p-primary-color); stop-opacity: 0.3" />
              <stop offset="50%" style="stop-color:var(--p-primary-color);stop-opacity:1" />
              <stop offset="100%" style="stop-color: var(--p-primary-color); stop-opacity: 0.3" />
            </linearGradient>
          </defs>
          <g transform="translate(-3.302224,-3.9882715)">
            <path
              style="fill: url(#smallLogoGradient);"
              d="m 14.933922,37.160222 c 0,1.084606 -0.245473,3.90592 0.922643,4.762711 0.763323,0.831603 1.526349,0.878532 2.665414,0.878532 h 32.053338 l 2e-5,8.459927 h -32.05334 c -0.820127,0 -1.708597,-0.08676 -2.665414,-0.260325 -0.934034,-0.195201 -1.868069,-0.488054 -2.802104,-0.87851 C 12.143224,49.732112 11.266145,49.23318 10.423236,48.625799 9.5803238,47.996727 8.8285412,47.248348 8.1678815,46.380661 7.5300033,45.491285 6.9109864,44.471759 6.6301439,43.322076 6.2428821,42.150704 6.0504787,38.613597 6.0504787,37.160222 M 6.0291056,20.836449 c 0,-0.780919 0.027698,-3.811743 0.1846619,-4.750305 C 6.4188193,15.175077 6.7263521,14.2857 7.1364117,13.418017 7.5464712,12.52864 8.0818374,11.682644 8.7424971,10.880038 9.4031569,10.077431 10.189108,9.3724371 11.100363,8.7650577 12.034398,8.135988 13.105123,7.6370704 14.312532,7.2683003 15.519945,6.899536 16.886823,6.7151531 18.413172,6.7151531 H 50.466506 V 15.175077 H 18.413172 c -1.161851,0 -2.278816,0.202944 -2.665413,0.878532 -1.00533,1.756836 -0.922645,3.677677 -0.922645,4.827355"
            />
            <path
              style="fill: var(--p-primary-color); stroke: var(--p-primary-color); stroke-width:0.25;"
              d="m 16.703243,29.688271 h -3.002037 v -1.25 h 3.002037 z m -3.115142,5.10723 H 6.6607205 c -0.1772464,0 -0.3692633,-0.02132 -0.5760508,-0.06397 C 5.8828058,34.683541 5.6809418,34.611565 5.4790777,34.515598 5.2821372,34.419631 5.0925821,34.297006 4.9104122,34.147725 4.7282422,33.993111 4.5657664,33.809175 4.4229845,33.595915 4.2851262,33.377326 4.1743471,33.126746 4.0906475,32.844178 4.0069479,32.556278 3.965098,32.233722 3.965098,31.876511 v -5.630047 c 0,-0.191934 0.019693,-0.397197 0.059082,-0.615788 0.044312,-0.223921 0.1107797,-0.442512 0.1994021,-0.655771 0.088623,-0.218591 0.2043259,-0.42652 0.3471076,-0.623784 0.1427818,-0.197264 0.3126431,-0.370538 0.5095836,-0.519821 0.2018638,-0.154612 0.4332689,-0.277236 0.6942151,-0.367871 0.260946,-0.09064 0.5563567,-0.135954 0.886232,-0.135954 H 13.5881 v 2.079279 H 6.6607205 c -0.2510991,0 -0.4431161,0.07197 -0.5760508,0.215927 -0.1329348,0.143949 -0.1994023,0.357209 -0.1994023,0.639777 v 5.614053 c 0,0.266574 0.066467,0.474503 0.1994023,0.623784 0.1378583,0.143951 0.3298751,0.215926 0.5760508,0.215926 h 6.9273805 z m 15.389536,-6.66991 c 3e-6,0.474502 -0.05416,0.898356 -0.162476,1.27156 -0.108317,0.373204 -0.256022,0.703756 -0.443115,0.991656 -0.18217,0.28257 -0.393882,0.525152 -0.635132,0.727747 -0.241253,0.202597 -0.494814,0.367873 -0.760685,0.495828 -0.260945,0.127956 -0.526814,0.221257 -0.797608,0.279904 -0.265868,0.05866 -0.516967,0.08798 -0.753295,0.08798 h -4.342539 v -2.079277 h 4.342539 c 0.246174,-0.02133 0.467731,-0.07465 0.664672,-0.159944 0.201864,-0.09064 0.374187,-0.210596 0.51697,-0.359877 0.142781,-0.149281 0.253562,-0.327887 0.332338,-0.535814 0.07878,-0.213258 0.118163,-0.453175 0.118163,-0.71975 v -0.943677 c -0.02462,-0.261244 -0.07631,-0.501161 -0.15509,-0.719749 -0.07878,-0.218592 -0.187095,-0.405195 -0.324952,-0.559808 -0.132936,-0.154613 -0.295413,-0.274572 -0.487429,-0.359876 -0.192017,-0.09064 -0.413573,-0.135952 -0.664672,-0.135952 h -4.327769 c -0.256022,0 -0.450502,0.07197 -0.583435,0.215926 -0.132935,0.143949 -0.199403,0.351878 -0.199403,0.623783 v 8.549038 h -1.920168 v -8.549038 c 0,-0.533148 0.08862,-0.986324 0.265869,-1.359529 0.18217,-0.373204 0.40619,-0.674435 0.672059,-0.903687 0.270793,-0.229253 0.563743,-0.394531 0.878848,-0.495829 0.315103,-0.106628 0.60559,-0.159943 0.87146,-0.159943 h 4.342539 c 0.433267,0 0.822225,0.06131 1.16687,0.183937 0.344647,0.117292 0.647442,0.277237 0.908388,0.479832 0.26587,0.197264 0.48989,0.426518 0.672059,0.687762 0.187094,0.261242 0.339724,0.535813 0.457889,0.823714 0.123086,0.282569 0.211709,0.570469 0.265869,0.8637 0.05416,0.287901 0.08123,0.559808 0.08123,0.815719 z m 12.0306,6.669689 h -1.920168 v -2.815024 h -6.750135 v 2.815024 h -1.92017 v -5.734013 c 0,-0.837044 0.132934,-1.607443 0.398806,-2.311199 0.265869,-0.703756 0.63513,-1.308879 1.107787,-1.81537 0.472659,-0.506493 1.031478,-0.901022 1.676457,-1.183589 0.64498,-0.28257 1.349041,-0.423855 2.112187,-0.423855 h 4.327766 c 0.132935,0 0.258485,0.02666 0.376649,0.07997 0.118164,0.05331 0.221558,0.127955 0.310182,0.223922 0.08862,0.09596 0.157551,0.20793 0.206787,0.335885 0.04924,0.127954 0.07386,0.263907 0.07386,0.407857 z m -8.670303,-4.894303 h 6.750135 v -4.494444 h -3.375068 c -0.05908,0 -0.18463,0.01066 -0.376649,0.032 -0.187093,0.016 -0.40619,0.06131 -0.657288,0.135955 -0.246177,0.07464 -0.507122,0.189267 -0.782839,0.343878 -0.275716,0.154614 -0.529277,0.367874 -0.760682,0.639781 -0.231404,0.271905 -0.423422,0.61312 -0.576051,1.023643 -0.147705,0.405194 -0.221558,0.898356 -0.221558,1.479488 z M 52.809897,25.406533 H 48.578139 V 34.79528 H 46.65797 v -9.388747 h -4.239143 v -2.079279 h 10.39107 z"
            />
          </g>
        </svg>
      </div>

      <ul class="topbar-items">
        <li>
          <cpat-search></cpat-search>
        </li>
        <li>
          <button type="button" class="topbar-item" (click)="toggleDarkMode()">
            <i class="pi" [ngClass]="{ 'pi-moon': isDarkMode(), 'pi-sun': !isDarkMode() }"></i>
          </button>
        </li>
        <li *ngIf="showConfigurator" class="relative">
          <button
            type="button"
            class="topbar-item relative overflow-hidden !border-transparent"
            enterActiveClass="animate-scalein"
            enterFromClass="hidden"
            leaveActiveClass="animate-fadeout"
            leaveToClass="hidden"
            pStyleClass="@next"
            [hideOnOutsideClick]="true"
          >
            <span
              style="animation-duration: 2s; background: conic-gradient(from 90deg, #f97316, #f59e0b, #eab308, #84cc16, #22c55e, #10b981, #14b8a6, #06b6d4, #0ea5e9, #3b82f6, #6366f1, #8b5cf6, #a855f7, #d946ef, #ec4899, #f43f5e)"
              class="absolute -top-5 -left-5 w-20 h-20 animate-spin"
            ></span>
            <span
              style="inset: 1px; border-radius: 4px"
              class="absolute z-2 bg-surface-0 dark:bg-surface-900 transition-all"
            ></span>
            <i class="pi pi-palette z-10"></i>
          </button>
          <cpat-configurator></cpat-configurator>
        </li>
        <li>
          <button
            type="button"
            class="topbar-item"
            (click)="op.toggle($event)"
            (keyup.enter)="op.toggle($event)"
          >
            <i class="pi pi-bell"></i>
            <span
              *ngIf="notificationCount > 0"
              class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 rounded-full bg-primary-500 text-black dark:text-white text-xs flex items-center justify-center px-1 animate-pulse"
            >
              {{ notificationCount }}
            </span>
          </button>
          <p-popover #op class="overlay" [dismissable]="true">
            <cpat-notifications-popover [overlayPanel]="op"></cpat-notifications-popover>
          </p-popover>
        </li>
      </ul>
    </div>
  </div>`,
})
export class AppTopBarComponent implements OnInit, OnDestroy {
  @Input({ transform: booleanAttribute }) showConfigurator = true;
  scrollListener: VoidFunction | null = null;
  private window: Window;
  notificationCount: number | null = null;
  private destroy$ = new Subject<void>();
  readonly user$ = inject(AuthService).user$;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private userService: UsersService,
    private el: ElementRef,
    private renderer: Renderer2,
    private configService: AppConfigService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.window = this.document.defaultView as Window;

    afterNextRender(() => {
      this.bindScrollListener();
    });
  }

  isDarkMode = computed(() => this.configService.appState().darkTheme);

  ngOnInit(): void {
    this.setupNotifications();
  }

  private setupNotifications(): void {
    const navigationEvents$ = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    );

    this.user$.pipe(
      filter((user): user is NonNullable<typeof user> => !!user && user.accountStatus === 'ACTIVE'),
      switchMap(() => merge(
        of(null),
        navigationEvents$
      ).pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(() => this.fetchNotificationCount())
      )),
      takeUntil(this.destroy$)
    ).subscribe({
      next: count => {
        this.notificationCount = count > 0 ? count : null;
      },
      error: error => {
        console.error('Error getting notification count:', error);
        this.notificationCount = null;
      }
    });
  }

  private fetchNotificationCount(): Observable<number> {
    return this.notificationService.getUnreadNotificationCount().pipe(
      map((response: unknown): number => {
        if (typeof response === 'number') {
          return response;
        }
        if (Array.isArray(response)) {
          return response.length;
        }
        const parsed = parseInt(String(response), 10);
        return !isNaN(parsed) ? parsed : 0;
      }),
      catchError(error => {
        console.error('Error fetching notification count:', error);
        return of(0);
      })
    );
  }

  toggleDarkMode() {
    this.configService.appState.update(state => ({ ...state, darkTheme: !state.darkTheme }));
    this.saveUserPreferences();
  }

  saveUserPreferences() {
    this.userService.getCurrentUser().pipe(
      take(1),
      switchMap(user => {
        if (!user) throw new Error('No user found');

        const currentState = this.configService.appState();
        const preferences = {
          userId: user.userId,
          defaultTheme: JSON.stringify({
            preset: currentState.preset,
            primary: currentState.primary,
            surface: currentState.surface,
            darkTheme: currentState.darkTheme,
            rtl: currentState.RTL,
          })
        };

        return this.userService.updateUserTheme(preferences);
      })
    ).subscribe({
      error: (error) => console.error('Error saving user preferences:', error)
    });
  }

  private bindScrollListener(): void {
    if (!this.scrollListener) {
      this.scrollListener = this.renderer.listen(this.window, 'scroll', () => {
        const topbarElement = this.el.nativeElement.children[0];
        if (!topbarElement) return;

        const shouldBeSticky = this.window.scrollY > 0;
        topbarElement.classList.toggle('layout-topbar-sticky', shouldBeSticky);
      });
    }
  }

  private unbindScrollListener(): void {
    if (this.scrollListener) {
      this.scrollListener();
      this.scrollListener = null;
    }
  }

  ngOnDestroy(): void {
    this.unbindScrollListener();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
