import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-control-dialog-flavors',
  templateUrl: './control-dialog-flavors.component.html',
  styleUrls: ['./control-dialog-flavors.component.scss']
})
export class ControlDialogFlavorsComponent implements OnInit {

  flavors = 0;

  constructor(private matDialogRef: MatDialogRef<any>, public translate: TranslateService, @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit(): void {
    this.flavors = this.data.flavors;
  }

}
