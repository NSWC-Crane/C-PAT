/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

export class Classification {
  public showBanner: boolean;
  public classificationText?: string;
  public classificationColorCode?: string;

  constructor(apiClassification: string) {
    this.showBanner = true;

    switch (apiClassification) {
      case 'U':
        this.classificationText = 'UNCLASSIFIED';
        this.classificationColorCode = '#007a33';
        break;
      case 'CUI':
      case 'FOUO':
        this.classificationText = 'CUI';
        this.classificationColorCode = '#502b85';
        break;
      case 'C':
        this.classificationText = 'CONFIDENTIAL';
        this.classificationColorCode = '#0033a0';
        break;
      case 'S':
        this.classificationText = 'SECRET';
        this.classificationColorCode = '#c8102e';
        break;
      case 'TS':
        this.classificationText = 'TOP SECRET';
        this.classificationColorCode = '#ff8c00';
        break;
      case 'SCI':
        this.classificationText = 'TOP SECRET // SCI';
        this.classificationColorCode = '#fce83a';
        break;
      case 'NONE':
      default:
        this.showBanner = false;
        break;
    }
  }
}
