import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-confirm-order',
  templateUrl: './confirm-order.component.html',
  styleUrls: ['./confirm-order.component.scss']
})

export class ConfirmOrderComponent {
  constructor(
    public dialogRef: MatDialogRef<any>,
    public translate: TranslateService,
  ){}

  ngOnInit(): void {}

  close() {
    this.dialogRef.close()
  }
}
