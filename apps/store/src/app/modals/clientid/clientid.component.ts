import { AfterViewChecked, Component, Inject, OnInit } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap'
import { DateTime } from 'luxon'
import { CustomerType } from 'src/app/customer-type'
import { ProfileType } from 'src/app/profile-type'
import { ApiService } from 'src/app/services/api/api.service'
import { ContextService } from 'src/app/services/context/context.service'
import { CustomAdapter, CustomDateParserFormatter, CustomDatepickerI18n, I18n } from 'src/app/services/ngb-datepicker/ngb-datepicker.service'
import { TranslateService } from 'src/app/translate.service'

@Component({
  selector: 'app-clientid',
  templateUrl: './clientid.component.html',
  providers: [
    I18n,
    { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n },
    { provide: NgbDateAdapter, useClass: CustomAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
  styleUrls: ['./clientid.component.scss'],
})
export class ClientidComponent implements OnInit, AfterViewChecked {
  birthdayDateAlert: string
  today: DateTime
  todayInfo: { year: number; month: number; day: number }
  showLoading = false
  hasFetchedCostumer = false
  customer: Pick<CustomerType, 'name' | 'whatsapp' | 'birthday_date'>
  // Icons
  arrowLeft = faArrowLeft

  // Local Storage
  checkLocalStorage = JSON.parse(localStorage.getItem(`${this.data.clientData.slug}-clientInfo`))

  constructor(
    public translate: TranslateService,
    public api: ApiService,
    public dialogRef: MatDialogRef<any>,
    public context: ContextService,
    @Inject(MAT_DIALOG_DATA) public data: { clientData: ProfileType; customer: CustomerType; deliveryButton: boolean; targetModal?: string }
  ) {}

  ngOnInit(): void {
    if (!this.data.customer) {
      this.customer = {
        birthday_date: '',
        name: '',
        whatsapp: '',
      }
    } else {
      this.customer = {
        name: this.data.customer.name,
        whatsapp: this.data.customer.whatsapp,
        birthday_date: this.data.customer.birthday_date ? this.formatToDatePicker(this.data.customer.birthday_date, 'fromISO') : '',
      }
    }
    const today = DateTime.now()
    this.todayInfo = { year: today.year, month: today.month, day: today.day }
  }

  ngAfterViewChecked(): void {
    if (this.customer.whatsapp.length < 11) {
      this.hasFetchedCostumer = false
    }
  }

  public safariTrash() {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.indexOf('safari') !== -1) {
      if (ua.indexOf('chrome') > -1) {
        return false // Chrome
      } else if (ua.indexOf('edg') > -1) {
        return false // Edge
      } else if (ua.indexOf('opr') > -1) {
        return false // Opera
      } else {
        //  SAFARI
        if (ua.indexOf('iphone') > -1) {
          return true // Safari IPhone
        } else {
          return false // Safari Desktop
        }
      }
    }
    return false
  }

  async saveCustomerId(type: 'update' | 'create') {
    localStorage.removeItem(`${this.data.clientData.slug}`)

    if (this.customer.birthday_date) {
      this.customer.birthday_date = DateTime.fromFormat(this.customer.birthday_date, this.translate.masks().date_mask).toFormat('yyyy-MM-dd HH:mm:ss')
    }

    if (this.customer?.whatsapp !== this.data.customer?.whatsapp) {
      type = 'create'
    }

    try {
      if (type === 'create') {
        const { client } = await this.api.clientRegister({ slug: this.data.clientData.slug, client: { ...this.customer }, addresses: [] })
        this.data.customer = client
      }
      if (type === 'update') {
        const { client } = await this.api.clientUpdate({
          slug: this.data.clientData.slug,
          client: { ...this.customer },
          clientId: this.data.customer.id,
          addresses: [],
          clientAddresses: this.data.customer.addresses,
        })
        this.data.customer = { ...this.data.customer, ...client }
      }
      this.data.customer.birthday_date = this.formatToDatePicker(this.data.customer.birthday_date, 'fromSQL')
    } catch (error) {
      console.error(error)
    }

    localStorage.setItem(`${this.data.clientData.slug}-clientInfo`, JSON.stringify({ id: this.data.customer.id }))
    const customerInfo = this.data.customer

    this.dialogRef.close({
      targetModal: this.data.targetModal ? this.data.targetModal : this.data.deliveryButton ? 'listAddress' : 'formPayment',
      customerInfo,
    })
  }

  async getClientByWhatsapp(event?: KeyboardEvent) {
    if (!this.hasFetchedCostumer) {
      if ((event && event.key !== 'Enter') || this.customer.whatsapp.length < 10) {
        return
      }
      try {
        this.showLoading = true
        const client = await this.api.clientFindClient({ slug: this.data.clientData.slug, whatsapp: this.customer.whatsapp })
        this.customer = {
          name: client.name,
          birthday_date: this.formatToDatePicker(client.birthday_date, 'fromISO'),
          whatsapp: client.whatsapp,
        }
        this.data.customer = client
      } catch (error) {
        console.error(error)
      } finally {
        this.showLoading = false
        this.hasFetchedCostumer = true
      }
    }
  }

  public backButton() {
    this.dialogRef.close({ targetModal: 'back' })
  }

  validateUserContact() {
    if (!this.customer) {
      return this.translate.alert().enter_your_details
    }
    if (!this.customer?.name) {
      return this.translate.text().enter_your_name
    }
    if (!this.customer?.whatsapp || this.customer?.whatsapp.length < 10) {
      return this.translate.alert().enter_your_whatsapp
    }
    if (this.customer && !this.customer.birthday_date && this.data.clientData.options.pdv?.clientConfig?.required) {
      return this.translate.alert().enter_your_date_of_birth
    }
    return false
  }

  closeModal() {
    this.dialogRef.close()
  }

  public formatToDatePicker(date: string, format: 'fromSQL' | 'fromISO' | 'dd-MM-yyyy' | 'MM/dd/yyyy') {
    let formatedDate: DateTime

    switch (format) {
      case 'dd-MM-yyyy':
        formatedDate = DateTime.fromFormat(date, format, { zone: this.data.clientData.timeZone })
        break
      case 'fromISO':
        formatedDate = DateTime.fromISO(date, { zone: this.data.clientData.timeZone })
        break
      case 'fromSQL':
        formatedDate = DateTime.fromSQL(date, { zone: this.data.clientData.timeZone })
        break
      default:
        break
    }
    if (!formatedDate.isValid) {
      return date
    }
    return formatedDate.toFormat(this.translate.masks().date_mask)
  }
}
