import { DateTime } from 'luxon'
import { hash } from '../utils/wm-functions'
import { t } from 'i18next'
import i18n from 'i18n'

export interface DateType {
  code: string
  open: string
  close: string
  active: boolean
  weekDay: number
}

export interface WeekType {
  [day: string]: DateType[] // sunday, monday, tuesday, wednesday, thursday, friday, saturday, sunday
}

export default class Week {
  [day: string]: DateType[] | any
  sunday: DateType[]
  monday: DateType[]
  tuesday: DateType[]
  wednesday: DateType[]
  thursday: DateType[]
  friday: DateType[]
  saturday: DateType[]

  constructor(week?: WeekType) {
    if (!week) {
      week = {
        sunday: [{ code: hash(), open: '00:00', close: '23:59', weekDay: 7, active: true }],
        monday: [{ code: hash(), open: '00:00', close: '23:59', weekDay: 1, active: true }],
        tuesday: [{ code: hash(), open: '00:00', close: '23:59', weekDay: 2, active: true }],
        wednesday: [{ code: hash(), open: '00:00', close: '23:59', weekDay: 3, active: true }],
        thursday: [{ code: hash(), open: '00:00', close: '23:59', weekDay: 4, active: true }],
        friday: [{ code: hash(), open: '00:00', close: '23:59', weekDay: 5, active: true }],
        saturday: [{ code: hash(), open: '00:00', close: '23:59', weekDay: 6, active: true }],
      }
    }
    this.sunday = week.sunday
    this.monday = week.monday
    this.tuesday = week.tuesday
    this.wednesday = week.wednesday
    this.thursday = week.thursday
    this.friday = week.friday
    this.saturday = week.saturday

    Object.keys(week).forEach((day: string) => {
      this[day].map((date: DateType) => {
        if (!date.weekDay) {
          switch (day) {
            case 'monday':
              date.weekDay = 1
              break
            case 'tuesday':
              date.weekDay = 2
              break
            case 'wednesday':
              date.weekDay = 3
              break
            case 'thursday':
              date.weekDay = 4
              break
            case 'friday':
              date.weekDay = 5
              break
            case 'saturday':
              date.weekDay = 6
              break
            case 'sunday':
              date.weekDay = 7
              break
          }
        }
      })
    })
  }

  static label = (weekDay: number) => {
    switch (weekDay) {
      case 1:
        return i18n.t('monday')
      case 2:
        return i18n.t('tuesday')
      case 3:
        return i18n.t('wednesday')
      case 4:
        return i18n.t('thursday')
      case 5:
        return i18n.t('friday')
      case 6:
        return i18n.t('saturday')
      case 7:
        return i18n.t('sunday')
    }
  }
}
