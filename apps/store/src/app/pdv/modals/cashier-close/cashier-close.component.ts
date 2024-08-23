import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faArrowLeft, faLock } from '@fortawesome/free-solid-svg-icons';
import { ClosedValue } from 'src/app/formpayment-type';
import { ApiService } from 'src/app/services/api/api.service';
import { ContextService } from 'src/app/services/context/context.service';
import { ToastService } from 'src/app/services/ngb-toast/toast.service';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-cashier-close',
  templateUrl: './cashier-close.component.html',
  styleUrls: ['./cashier-close.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss']
})

export class CashierCloseComponent implements OnInit {
  closedValues: ClosedValue[] = []

  faArrowLeft = faArrowLeft
  faLock = faLock

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) private dialogRef,
    public context: ContextService,
    public api: ApiService,
    public toastService: ToastService,
    public translate: TranslateService,
  ) { }

  async ngOnInit(): Promise<void> {
    if (this.context.profile.options.pdv.cashierManagement) {
      this.context.profile?.formsPayment.forEach(({ label, flags, payment }) => {
        if (flags && flags.length) {
          flags.forEach(flag => {
            this.closedValues.push({ label, payment, value: 0, flag: flag.name })
          })
        } else {
          this.closedValues.push({ label, payment, value: 0 })
        }
      })
    } else {
      await this.closeCashier()
    }
  }

  public async closeCashier(event?: any): Promise<void> {
    event?.preventDefault()
    const button = document.querySelector('button[type="submit"]#closeCashier') as HTMLButtonElement
    if (button) {
      button.disabled = true
    }
    try {
      const { cashier } = await this.api.closeCashier({
        bartenderId: this.context.activeBartender?.id ?? null,
        cashierId: this.context.activeCashier.id,
        slug: this.context.profile?.slug,
        closedValues: this.closedValues
      })
      this.dialogRef.close({ cashier })
    } catch (error) {
      console.error(error);
      return this.toastService.show(error.error.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      if (button) {
      button.disabled = false
    }
    }
  }

  public close(): void {
    this.dialogRef.close({})
  }
}
