import { Dialog } from '@angular/cdk/dialog';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-moreinfo',
  templateUrl: './moreinfo.component.html',
  styleUrls: ['./moreinfo.component.scss', '../../home/home.component.scss']
})
export class MoreinfoComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data, private matDialog: MatDialogRef<any>) {
  }
 
  close(){
    this.matDialog.close({teste: "tste"})
  }

  isLastIndex(index: number): boolean {
    return index === this.data.clientData.formsPayment.length - 1;
  }
}