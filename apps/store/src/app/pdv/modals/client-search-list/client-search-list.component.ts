import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { ContextService } from 'src/app/services/context/context.service';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-client-search-list',
  templateUrl: './client-search-list.component.html',
  styleUrls: ['./client-search-list.component.scss', '../../../../styles/modals.scss']
})
export class ClientSearchListComponent implements OnInit {

  faArrowLeft = faArrowLeft

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) private dialogRef,
    public context: ContextService,
    public translate: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  public close() {
    this.dialogRef.close({})
  }

  public selectClient(client: any) {
    this.dialogRef.close({ client })
  }

}
