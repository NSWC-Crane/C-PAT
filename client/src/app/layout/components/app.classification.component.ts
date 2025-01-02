/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { Classification } from '../../common/models/classification.model';
import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../common/services/shared.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'cpat-classification',
  standalone: true,
  template: `
    <div *ngIf="isClassificationActive" class="layout-classification">
      <div
        class="layout-classification-content"
        [style.background-color]="classification?.classificationColorCode"
      >
        <span class="layout-classification-text">{{ classification?.classificationText }}</span>
      </div>
    </div>
  `,
  imports: [CommonModule, FormsModule],
})
export class AppClassificationComponent implements OnInit {
  classification: Classification | undefined;
  isClassificationActive: boolean = false;

  constructor(private sharedService: SharedService) {}

  public async ngOnInit() {
    try {
      const apiConfig = await this.sharedService.getApiConfig().toPromise();
      if (apiConfig && typeof apiConfig === 'object' && 'classification' in apiConfig) {
        const apiClassification = (apiConfig as { classification: string }).classification;
        this.classification = new Classification(apiClassification);
        this.isClassificationActive = true;
      } else {
        console.error('Invalid API configuration response');
      }
    } catch (error) {
      console.error('Error retrieving API configuration:', error);
    }
  }
}
