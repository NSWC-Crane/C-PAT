/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, ElementRef, OnDestroy, OnInit, Renderer2, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';
import { SharedService } from '../../common/services/shared.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { CollectionsService } from '../../pages/admin-processing/collection-processing/collections.service';
import { UsersService } from '../../pages/admin-processing/user-processing/users.service';
import { AppClassificationComponent } from './app.classification.component';
import { AppFooterComponent } from './app.footer.component';
import { AppLayoutComponent } from './app.layout.component';
import { AppTopBarComponent } from './app.topbar.component';

@Component({
  selector: 'cpat-navigation',
  template: `
    <div class="landing">
      <cpat-classification />
      <cpat-topbar />
      <cpat-layout />
      <cpat-footer />
    </div>
  `,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppClassificationComponent, AppTopBarComponent, AppLayoutComponent, AppFooterComponent]
})
export class AppNavigationComponent implements OnInit, OnDestroy {
  private readonly document = inject<Document>(DOCUMENT);
  private readonly renderer = inject(Renderer2);
  private readonly authService = inject(AuthService);
  private readonly collectionsService = inject(CollectionsService);
  private readonly sharedService = inject(SharedService);
  private readonly userService = inject(UsersService);
  private readonly destroyRef = inject(DestroyRef);
  el = inject(ElementRef);

  scrollListener: VoidFunction | null;

  private readonly window: Window;

  readonly user = signal<any>(null);

  constructor() {
    this.window = this.document.defaultView;

    afterNextRender(() => {
      this.bindScrollListener();
    });
  }

  ngOnInit() {
    this.authService.user$
      .pipe(
        filter((user) => !!user),
        take(1)
      )
      .subscribe((user) => {
        this.user.set(user);
        this.getCollections();
      });
  }

  bindScrollListener() {
    if (!this.scrollListener) {
      this.scrollListener = this.renderer.listen(this.window, 'scroll', () => {
        if (this.window.scrollY > 0) {
          this.el.nativeElement.children[0].classList.add('layout-topbar-sticky');
        } else {
          this.el.nativeElement.children[0].classList.remove('layout-topbar-sticky');
        }
      });
    }
  }

  unbindScrollListener() {
    if (this.scrollListener) {
      this.scrollListener();
      this.scrollListener = null;
    }
  }

  private getCollections() {
    this.collectionsService
      .getCollections()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const user = this.user();

          if (user?.lastCollectionAccessedId) {
            this.resetWorkspace(user.lastCollectionAccessedId);
          }
        },
        error: (error) => console.error('Error loading collections:', error)
      });
  }

  resetWorkspace(selectedCollectionId: number) {
    this.sharedService.setSelectedCollection(selectedCollectionId);

    const user = this.user();

    if (user?.lastCollectionAccessedId !== selectedCollectionId) {
      const userUpdate = {
        userId: user.userId,
        lastCollectionAccessedId: selectedCollectionId
      };

      this.userService
        .updateUserLastCollection(userUpdate)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (result) => {
            if (result) {
              globalThis.location.pathname = `${CPAT.Env.basePath ?? ''}home`;
            }
          },
          error: (error) => console.error('Error updating user:', error)
        });
    }
  }

  ngOnDestroy() {
    this.unbindScrollListener();
  }
}
