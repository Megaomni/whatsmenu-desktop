import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-confirm',
  templateUrl: './dialog-confirm.component.html',
  styleUrls: ['./dialog-confirm.component.scss']
})
export class DialogConfirmComponent implements OnInit {

  title: string;
  text: string;
  button_ok: string;
  button_cancel: string;

  constructor(@Inject (MAT_DIALOG_DATA) private data) { }

  ngOnInit(): void {
    this.title = this.data.title
    this.text = this.data.message
    this.button_ok = this.data.button_ok
    this.button_cancel = this.data.button_cancel
  }

}
