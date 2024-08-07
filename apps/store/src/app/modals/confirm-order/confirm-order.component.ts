import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-order',
  templateUrl: './confirm-order.component.html',
  styleUrls: ['./confirm-order.component.scss']
})

export class ConfirmOrderComponent {
  constructor(
    public dialogRef: MatDialogRef<any>,
  ){}

  ngOnInit(): void {}

  close() {
    this.dialogRef.close()
  }
}
