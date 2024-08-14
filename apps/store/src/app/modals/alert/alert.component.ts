import { QrcodeComponent } from './../../qrcode/qrcode.component';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientType } from './../../client-type';
import { ApiService } from '../../services/api/api.service';
import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss']
})

export class AlertComponent implements OnInit {

  title = `${ this.translate.text().attention }`;
  message: string;
  textButton = 'OK';
  secondTextButton: string;
  table: boolean;
  clientData: ClientType;
  noReload = false;
  constructor(
    public translate: TranslateService,
    private dialogRef: MatDialogRef<any>,
    public api: ApiService,
    @Inject(MAT_DIALOG_DATA) public data,
    private matDialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private routes: Router
  ) { }

  ngOnInit(): void {

    this.message = this.data.message;

    if (this.data.title) {
      this.title = this.data.title;
    }

    if (this.data.textButton) {
      this.textButton = this.data.textButton;
    }

    if (this.data.secondTextButton) {
      this.secondTextButton = this.data.secondTextButton;
    }

    if (this.data.table) {
      this.table = this.data.table;
    }

    if (this.data.clientData) {
      this.clientData = this.data.clientData;
    }

    if (this.data.noReload) {
      this.noReload = true;
    }
  }

  public async close() {
    const button = document.getElementById('alertCloseButton') as HTMLButtonElement
    if (button) {
      button.disabled = true
      this.dialogRef.close()
      button.disabled = false
    }
  }
  
  closeCallback() {
  
  }
  goToAnotherCommand() {
    this.clientData = this.data.clientData;
    this.matDialog.open(QrcodeComponent, {
      data: {
        clientData: this.clientData
      },
      maxWidth: '100vw',
      width: window.innerWidth < 700 ? '100vw' : 'auto',
      height: window.innerWidth < 700 ? '100vh' : 'auto',
      id: 'qr-code-modal',
      disableClose: true,
      closeOnNavigation: true,
    });

  }

  goToDelivery() {
    this.api.deleteCookie('table');
    location.replace(`https://${location.host}/${this.clientData.slug}`)
  }

  reloadPage() {
    if (this.noReload) {
      return null;
    }
    if (location.href.includes('#')) {
      location.assign(location.href.slice(0, location.href.indexOf('#')));
    } else {
      location.reload();
    }
  }
}

