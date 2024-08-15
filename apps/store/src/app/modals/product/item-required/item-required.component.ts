import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-item-required',
  templateUrl: './item-required.component.html',
  styleUrls: ['./item-required.component.scss', '../../../bartender/bartender.component.scss']
})
export class ItemRequiredComponent implements OnInit {

  itens: string[] = [];
  bartenderStyle = false

  constructor(private dialogRef: MatDialogRef<any>, public translate: TranslateService,  @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit(): void {
    this.itens = this.data.itens;
    this.bartenderStyle = this.data.bartenderStyle
  }

}
