import { HttpClient } from '@angular/common/http'
import { Component, Inject } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog'
import { ApiService } from 'src/app/services/api/api.service'
import { TranslateService } from 'src/app/translate.service'

@Component({
  selector: 'app-latest-requests',
  templateUrl: './latest-requests.component.html',
  styleUrls: ['./latest-requests.component.scss'],
})
export class LatestRequestsComponent {
  constructor(public translate: TranslateService, public dialogRef: MatDialogRef<any>, @Inject(MAT_DIALOG_DATA) public data) {}

  customerReverse() {
    return this.data.customer.last_requests.slice().reverse()
  }
  openRequestStatus(code: number) {
    window.open(`${window.location.protocol}//${window.location.host}/${this.data.clientData.slug}/status/${code}`)
  }

  calculateTotal(request) {
    let valorCupom: number = 0
    let valorFrete: number = 0
    let total: number = 0

    switch (request.cupom?.type) {
      case 'value':
        valorCupom = request.cupom.value
        break
      case 'percent':
        valorCupom = request.total * (request.cupom.value / 100)
        break
      case 'freight':
        valorFrete = request.taxDelivery
        break
      default:
        valorCupom = 0
        break
    }
    const valueTotal = request.total - valorCupom < 0 ? 0 : request.total - valorCupom

    if (request.formsPayment.length > 0) {
      if (request.formsPayment[0].addon.status) {
        let addonValue = request.formsPayment[0].addon.value
        if (request.formsPayment[0].addon.type === 'fee') {
          if (request.formsPayment[0].addon.valueType === 'percentage') {
            addonValue = request.total * (addonValue / 100)
          }
          total = valueTotal + addonValue + request.taxDelivery - valorFrete
        }

        if (request.formsPayment[0].addon.type === 'discount') {
          if (request.formsPayment[0].addon.valueType === 'percentage') {
            addonValue = request.total * (addonValue / 100)
          }
          total = valueTotal - addonValue + request.taxDelivery - valorFrete
        }
      } else {
        total = valueTotal + request.taxDelivery - valorFrete
      }
    }

    return total === 0 ? request.total : total
  }

  close() {
    this.dialogRef.close()
  }
}
