/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';
import { Classification } from '../../common/models/classification.model';
import { SharedService } from '../../common/services/shared.service';

@Component({
  selector: 'cpat-classification',
  standalone: true,
  template: `
    @if (isClassificationActive) {
      <div class="layout-classification">
        <div class="layout-classification-content" [style.background-color]="classification?.classificationColorCode">
          <span class="layout-classification-text">{{ classification?.classificationText }}</span>
        </div>
      </div>
    }
  `,
  imports: [FormsModule]
})
export class AppClassificationComponent implements OnInit {
  private sharedService = inject(SharedService);

  classification: Classification | undefined;
  isClassificationActive: boolean = false;

  ngOnInit() {
    this.sharedService
      .getApiConfig()
      .pipe(take(1))
      .subscribe({
        next: (apiConfig) => {
          if (apiConfig && typeof apiConfig === 'object' && 'classification' in apiConfig) {
            const apiClassification = (apiConfig as { classification: string }).classification;

            this.classification = new Classification(apiClassification);
            this.isClassificationActive = true;
          } else {
            console.error('Invalid API configuration response');
          }
        },
        error: (error) => {
          console.error('Error retrieving API configuration:', error);
        }
      });
  }
}
