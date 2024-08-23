import { AfterViewChecked, Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core'
import { MAT_DIALOG_DATA } from '@angular/material/dialog'
import { faCalendarDay } from '@fortawesome/free-solid-svg-icons'
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerI18n } from '@ng-bootstrap/ng-bootstrap'
import { DateTime } from 'luxon'
import { CartPizza } from 'src/app/cart-pizza'
import { CartRequestType } from 'src/app/cart-request-type'
import { CartType } from 'src/app/cart-type'
import { CupomType } from 'src/app/cupom'
import { CartService } from 'src/app/services/cart/cart.service'
import { ContextService } from 'src/app/services/context/context.service'
import { CustomAdapter, CustomDateParserFormatter, CustomDatepickerI18n, I18n } from 'src/app/services/ngb-datepicker/ngb-datepicker.service'
import { TranslateService } from 'src/app/translate.service'

interface CalendarComponentData {
  packageHours: { [key: string]: Array<{ time: string; quantity: number }[]> }
  cartRequest: CartRequestType
  cart: CartType[]
  cartPizza: CartPizza[]
  client: any
  cupom: CupomType | null
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  providers: [
    I18n,
    { provide: NgbDatepickerI18n, useClass: CustomDatepickerI18n },
    { provide: NgbDateAdapter, useClass: CustomAdapter },
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter },
  ],
  styleUrls: ['./calendar.component.scss', '../pdv.component.scss', '../../../styles/modals.scss'],
})
export class CalendarComponent implements OnInit, AfterViewChecked {
  @Output('changePackageCalendar') changePackageCalendar = new EventEmitter()
  @Input('dataObject') dataObject

  addressId: number | null
  cupom: CupomType | null = null
  startDate: any
  endDate: any
  packageHour: string
  packageCalendar: string
  hourFilter = ''

  faCalendarDay = faCalendarDay

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CalendarComponentData,
    public context: ContextService,
    public cartService: CartService,
    public translate: TranslateService
  ) {}

  ngOnInit(): void {
    if (this.dataObject.packageHours) {
      if (typeof Worker !== 'undefined') {
        const worker = new Worker(new URL('../../workers/package-hours.worker.ts', import.meta.url))
        worker.onmessage = ({ data }) => {
          const { packageHours, packageCalendar } = data
          this.dataObject.packageHours = packageHours
          this.dataObject.packageCalendar = packageCalendar
          // this.packageCalendar = packageCalendar
          this.setPackageHour()
          worker.terminate()
        }
        worker.postMessage(
          JSON.stringify({ context: this.context, packageHours: this.dataObject.packageHours, dateFormat: this.translate.masks().date_mask })
        )
      } else {
        this.setPackageHour()
      }
    }
    const start = DateTime.local().plus({ days: this.context.profile?.options.package.distanceDays.start }).toObject()
    this.startDate = {
      day: start.day,
      month: start.month,
      year: start.year,
    }
    const end = DateTime.local().plus({ days: this.context.profile?.options.package.distanceDays.end }).toObject()
    this.endDate = {
      day: end.day,
      month: end.month,
      year: end.year,
    }
  }

  ngAfterViewChecked(): void {}

  public filteredPeriod(hour: { time: string; quantity: number }[]): { time: string; quantity: number }[] {
    if (this.daysDiff()) {
      return hour
    }
    return hour.filter((h) => {
      return (
        h.time.includes(this.hourFilter.replace(/(\d{2})(\d{1,2})/, '$1:$2')) && h.time > DateTime.local().plus({ minutes: 30 }).toFormat('HH:mm')
      )
    })
  }

  public setPackageHour(): void {
    if (this.dataObject.packageHours && this.dataObject.packageHours[this.packageCalendar]) {
      const availableTimesForDate = this.dataObject.packageHours[this.packageCalendar].find((period) => this.filteredPeriod(period).length > 0)
      if (availableTimesForDate) {
        this.packageHour = this.filteredPeriod(availableTimesForDate)[0].time
      }
      // this.dataObject.packageHour = time;
      // this.packageHour = time;

      this.changePackageCalendar.emit({
        packageCalendar: this.packageCalendar,
        packageHour: this.packageHour,
      })
    }
  }

  public onChange(data: string, type: 'date' | 'time') {
    this.packageCalendar = type === 'date' ? data : this.packageCalendar
    this.packageHour = type === 'time' ? data : this.packageHour
    this.changePackageCalendar.emit({
      packageCalendar: this.packageCalendar,
      packageHour: this.packageHour,
    })
  }

  public daysDiff() {
    if (this.packageCalendar) {
      return DateTime.fromFormat(this.packageCalendar, this.translate.masks().date_mask).diffNow('days').days > 0
    }
  }
}
