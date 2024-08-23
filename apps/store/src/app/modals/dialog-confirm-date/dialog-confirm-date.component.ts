import { AlertComponent } from './../alert/alert.component'
import { Component, OnInit, Inject, AfterViewChecked, OnChanges } from '@angular/core'
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog'
import { faArrowLeft, faChevronDown, faCalendarDay } from '@fortawesome/free-solid-svg-icons'
import { DateTime, DateTimeOptions } from 'luxon'
import * as moment from 'moment-timezone'
import { ToastService } from 'ng-metro4'
import { ClientType, Package } from 'src/app/client-type'
import { ApiService } from 'src/app/services/api/api.service'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { TranslateService } from 'src/app/translate.service'

@Component({
  selector: 'app-dialog-confirm-date',
  templateUrl: './dialog-confirm-date.component.html',
  styleUrls: ['./dialog-confirm-date.component.scss'],
})
export class DialogConfirmDateComponent implements OnInit, AfterViewChecked {
  format = '%d/%m/%Y'
  clientData: ClientType
  package: Package
  localStorageDate = localStorage.getItem('packageDate')
  timeHour = moment([])
  time = (this.localStorageDate && moment(new Date(this.localStorageDate))) || moment([])
  hour: any
  minDate: moment.Moment
  maxDate: moment.Moment
  // days: Array<{ active: string, name: string }>;
  shipping: string
  timeZoneDiff: boolean = false
  messageDuplicate: string
  dataDuplicate: string
  notVacancies: boolean = false
  // weekDayName: string = this.time.format('dddd').toLowerCase();
  weekProfileOpen: { code: string; open: string; close: string }[] = []
  message: string
  includeDates: moment.Moment[] = []
  excludeDates: moment.Moment[] = []
  startDate: any
  endDate: any
  packageCalendar: string
  packageHour: string
  packageDate: string
  hourFilter = ''

  faArrowLeft = faArrowLeft
  faChevronDown = faChevronDown
  faCalendarDay = faCalendarDay

  //Hour Config
  datesAndHours = {}
  hourSelect: any
  hourOptions = {}
  hoursOptionsLength: number
  hourBlock: string
  dateBlock: string //MMDD
  errorType: number | string
  timeHourSet
  timeDiff: number
  today: DateTime = DateTime.local()
  dataToPackageCalendar: any
  dateChoiced: DateTime

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    private toastservice: ToastService,
    @Inject(MatDialogRef) private dialogRef,
    @Inject(MatDialog) private matDialog,
    public cartService: CartService,
    public context: ContextService,
    public translate: TranslateService
  ) {
    this.clientData = data.clientData
    this.package = data.clientData.options.package
    this.errorType = this.data.errorType
    this.dateChoiced = this.data.dateChoiced
    this.time = data.clientData.options.package.weekDays
    this.shipping = data.clientData.options.package.shipping
    this.messageDuplicate = data.messageDuplicate
    this.dataDuplicate = data.dataDuplicate
    this.hour = null

    if (data.packageHours) {
      this.dataToPackageCalendar = {
        packageHours: data.packageHours,
      }
    }
    if (data.message) {
      this.message = data.message
    }

    if (data.hour) {
      this.hourBlock = data.hour
    }

    if (data.timeHourSet) {
      this.time = data.timeHourSet
      this.dateBlock = data.timeHourSet.toFormat('MMdd')
    }

    if (data.clientData.timeZone !== moment.tz.guess()) {
      this.timeZoneDiff = true
    }

    if (data.datesAndHours) {
      this.datesAndHours = data.datesAndHours
    }

    if (this.data.dates) {
      this.clientData.options.package.specialsDates.push(...this.data.dates)
    }
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    // console.log(this.dataToPackageCalendar)
  }

  applyTime() {
    if (window.confirm(`A data da sua entrega é: ${this.packageCalendar} ${this.packageHour}`)) {
      this.dialogRef.close(DateTime.fromFormat(`${this.packageCalendar} ${this.packageHour}`, `${this.translate.masks().date_mask} HH:mm`))
    }
  }

  sendWhatsapp() {
    window.open(
      encodeURI(
        `https://api.whatsapp.com/send/?phone=${this.clientData.whatsapp}&text=Olá, ${this.clientData.name}, não há mais vagas disponíveis para encomendas.`
      ),
      '_blank'
    )
  }

  parse(el: any) {
    if (typeof el === 'string') {
      return JSON.parse(el)
    }
  }

  public setPackageHour(): void {
    if (this.data.packageHours && this.data.packageHours[this.packageCalendar]) {
      this.packageHour = this.filteredPeriod(this.data.packageHours[this.packageCalendar][0])[0].time
    }
  }

  public filteredPeriod(hour: { time: string; quantity: number }[]): { time: string; quantity: number }[] {
    return hour.filter((h) => {
      return (
        h.time.includes(this.hourFilter.replace(/(\d{2})(\d{1,2})/, '$1:$2')) && h.time > DateTime.local().plus({ minutes: 30 }).toFormat('HH:mm')
      )
    })
  }

  public updatePackageCalendar(data: { packageCalendar: string; packageHour: string }) {
    this.packageCalendar = data.packageCalendar
    this.packageHour = data.packageHour
  }

  public havePackageHours() {
    return !!Object.values(this.dataToPackageCalendar.packageHours).length
  }
}
