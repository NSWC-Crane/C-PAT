import { Classification } from '../../common/models/classification.model';
import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../common/services/shared.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-classification',
  templateUrl: './app.classification.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
})
export class AppClassificationComponent implements OnInit {
  classification: Classification | undefined;
  isClassificationActive: boolean = false;

  constructor(private sharedService: SharedService) {}

  public async ngOnInit() {
    try {
      const apiConfig = await this.sharedService.getApiConfig().toPromise();
      if (
        apiConfig &&
        typeof apiConfig === 'object' &&
        'classification' in apiConfig
      ) {
        const apiClassification = (apiConfig as { classification: string })
          .classification;
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
