import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { faArrowLeft, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { ApiService } from 'src/app/services/api/api.service';
import { ContextService } from 'src/app/services/context/context.service';
import { ToastService } from 'src/app/services/ngb-toast/toast.service';
import { TranslateService } from 'src/app/translate.service';

@Component({
  selector: 'app-cashier-transactions',
  templateUrl: './cashier-transactions.component.html',
  styleUrls: ['./cashier-transactions.component.scss', '../../pdv.component.scss', '../../../../styles/modals.scss']
})
export class CashierTransactionsComponent implements OnInit {
  finality: 'payment' | 'deposit' | null
  obs: string
  value: number

  faArrowLeft = faArrowLeft
  faChevronDown = faChevronDown

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    @Inject(MatDialogRef) private dialogRef,
    public api: ApiService,
    public context: ContextService,
    public toastService: ToastService,
    public translate: TranslateService,
  ) { }

  ngOnInit(): void {
    if (this.data.type === 'outcome') {
      this.finality = 'deposit'
    }
  }

  public close(): void {
    this.dialogRef.close({})
  }

  public async addTransaction(event: any): Promise<void> {
    event.preventDefault()
    const button = document.querySelector('button[type="submit"]') as HTMLButtonElement
    if (button) {
      button.disabled = true
    }
    try {
      const { cashier } = await this.api.addTransaction({
        bartenderId: this.context.activeBartender?.id,
        slug: this.context.profile.slug,
        finality: this.finality,
        obs: this.obs,
        value: this.value,
        type: this.data.type,
        cashierId: this.context.activeCashier.id
      })
      this.dialogRef.close({ cashier })
    } catch (error) {
      console.error(error);
      return this.toastService.show(error.error.message, { classname: 'bg-danger text-light text-center pos middle-center', delay: 3000 })
    } finally {
      button.disabled = false
    }
  }
}
