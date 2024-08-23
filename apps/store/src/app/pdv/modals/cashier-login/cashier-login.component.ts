import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { faArrowLeft, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from 'src/app/services/api/api.service';
import { ContextService } from 'src/app/services/context/context.service';
import { ToastService } from 'src/app/services/ngb-toast/toast.service';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-cashier-login',
  templateUrl: './cashier-login.component.html',
  styleUrls: ['./cashier-login.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss'],
})

export class CashierLoginComponent implements OnInit {
  bartenderId = this.context.profile?.bartenders.filter(b => b.controls.type !== 'default')[0]?.id
  password: string

  faArrowLeft = faArrowLeft
  faChevronDown = faChevronDown
  constructor(
    @Inject(MatDialogRef) private dialogRef,
    @Inject(MAT_DIALOG_DATA) public data,
    private matDialog: MatDialog,
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService,
    public translate: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  public async close(event: any) {
    if (event) {
      event.preventDefault()
      const button = document.querySelector('button[type="submit"]') as HTMLButtonElement
      if (button) {
        button.disabled = true
      }
      try {
        const { bartender } = await this.api.authBartender({
          bartenderId: this.bartenderId,
          password: this.password,
          type: 'pdv'
        });
        if (bartender) {
          sessionStorage.setItem('bartenderId', bartender.id)
          this.context.activeBartender = bartender
          this.context.activeBartender.controls.activeCashier = bartender.activeCashier
          this.context.activeCashier = bartender.activeCashier
        }
      } catch (error) {
        return this.toastService.show(error.error.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
      } finally {
        button.disabled = false
      }
    }
    this.dialogRef.close({ open: true })
  }
}
