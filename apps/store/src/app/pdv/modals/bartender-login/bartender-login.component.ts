import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from 'src/app/services/api/api.service';
import { ContextService } from 'src/app/services/context/context.service';
import { ToastService } from 'src/app/services/ngb-toast/toast.service';
import { TranslateService } from 'src/app/translate.service';
import Table from 'src/classes/table';

@Component({
  selector: 'app-bartender-login',
  templateUrl: './bartender-login.component.html',
  styleUrls: ['./bartender-login.component.scss', '../../../../styles/modals.scss']
})
export class BartenderLoginComponent implements OnInit {
  bartenderId: Number
  password: string

  faArrowLeft = faArrowLeft

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { tableId: number },
    @Inject(MatDialogRef) private dialogRef,
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService,
    public translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.bartenderId = this.context.profile?.bartenders[0].id
  }

  public close(data?: any) {
    this.dialogRef.close(data)
  }

  // API

  /** Autentifica o garçom no servidor e salva na sessionStorage caso persistBartender seja true */
  public async authBartender(): Promise<void> {
    try {
      const { bartender, table } = await this.api.authBartender({
        bartenderId: Number(this.bartenderId || 0),
        password: this.password,
        tableId: this.data.tableId,
        type: 'bartender'
      });
      let haveTable = this.context.tables.find(t => t.id === table.id)
      if (haveTable) {
        haveTable = new Table(table)
      }

      if (this.context.profile.options.table.persistBartender) {
        sessionStorage.setItem('bartenderId', bartender.id)
        this.context.activeBartender = bartender
      } else {
        sessionStorage.removeItem('bartenderId')
      }
      this.dialogRef.close({ authenticated: true, table });
    } catch (error) {
      console.error(error);
      this.toastService.show(error.error?.message || 'Algo inesperado ocorreu, tente novamente', { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 });
    }
  };
}
