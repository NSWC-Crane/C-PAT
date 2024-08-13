import { Component, OnInit } from '@angular/core';
import { ConfirmationDialogOptions } from '../../../common/components/confirmation-dialog/confirmation-dialog.component';


@Component({
  selector: 'cpat-tenable-import',
  templateUrl: './tenable-import.component.html',
  styleUrls: ['./tenable-import.component.scss']
})
export class TenableImportComponent implements OnInit {

  constructor(
  ) { }

  async ngOnInit() {
  }

  showPopup(message: string) {
    const dialogOptions: ConfirmationDialogOptions = {
      header: 'Alert',
      body: message,
      button: { text: 'OK', status: 'info' },
      cancelbutton: 'false'
    };
  }
}
