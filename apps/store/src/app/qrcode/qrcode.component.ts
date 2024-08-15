import { ApiService } from '../services/api/api.service';
import { Component, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA,MatDialog } from '@angular/material/dialog';
import { AlertComponent } from '../modals/alert/alert.component';
import { TranslateService } from '../translate.service';

@Component({
  selector: 'app-qrcode',
  templateUrl: './qrcode.component.html',
  styleUrls: ['./qrcode.component.scss']
})
export class QrcodeComponent implements OnInit {

  constructor(private router: Router, public translate: TranslateService, private route: ActivatedRoute, private api: ApiService, @Inject(MAT_DIALOG_DATA) private data, public dialogRef: MatDialogRef<any>, private matDialog: MatDialog) { }

  scanResult: string = '';
  clientData: any;

  ngOnInit(): void {
    this.clientData = this.data.clientData
  }
  
  onCodeResult(result: string) {
    this.scanResult = result
    this.dialogRef.afterClosed().subscribe(() => {
      sessionStorage.removeItem(`@whatsmenu-${this.clientData.slug}:tableOpenedId`)
      window.location.href = this.scanResult.includes(window.location.protocol) ? this.scanResult : `${window.location.protocol}//${this.scanResult}`
    })
    this.dialogRef.close()
  }

  errorMessage() {
    this.matDialog.open(AlertComponent, {
      closeOnNavigation: true,
      data: {
        title: 'Ops',
        message: `Desculpe algo inesperado aconteceu, por favor tente novamente.`,
      }
    })
  }

  failureMessage() {
    this.matDialog.open(AlertComponent, {
      closeOnNavigation: true,
      data: {
        title: 'QRCode Inválido',
        message: `Desculpe, não foi possível ler o qrcode.`,
      }
    })
  }
}

