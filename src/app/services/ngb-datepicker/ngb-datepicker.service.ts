import { Injectable } from '@angular/core'
import { NgbDateAdapter, NgbDateParserFormatter, NgbDatepickerI18n, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap'
import { TranslateService } from 'src/app/translate.service'

@Injectable()
export class I18n {
  constructor(public translate: TranslateService) {}
  language = this.translate.language()
}
@Injectable()
export class CustomDatepickerI18n extends NgbDatepickerI18n {
  constructor(private _i18n: I18n, public translate: TranslateService) {
    super()
  }

  getWeekdayLabel(weekday: number): string {
    return this.translate.calendar().weekdays[weekday - 1]
  }

  getWeekdayShortName(weekday: number): string {
    return this.translate.calendar().weekdays[weekday - 1]
  }
  getMonthShortName(month: number): string {
    return this.translate.calendar().months[month - 1]
  }
  getMonthFullName(month: number): string {
    return this.getMonthShortName(month)
  }

  getDayAriaLabel(date: NgbDateStruct): string {
    return `${date.day}-${date.month}-${date.year}`
  }
}

@Injectable()
export class CustomAdapter extends NgbDateAdapter<string> {
  constructor(public translate: TranslateService) {
    super()
  }

  readonly DELIMITER = '/'

  fromModel(value: string | null): NgbDateStruct | null {
    if (!value) return null
    let date = value.split(this.DELIMITER)
    switch (this.translate.language()) {
      case 'pt-BR':
        return {
          day: parseInt(date[0], 10),
          month: parseInt(date[1], 10),
          year: parseInt(date[2], 10),
        }

      case 'en-US':
        return {
          month: parseInt(date[0], 10),
          day: parseInt(date[1], 10),
          year: parseInt(date[2], 10),
        }

      default:
        return null
    }
  }

  toModel(date: NgbDateStruct | null): string | null {
    if (!date) return null
    switch (this.translate.language()) {
      case 'pt-BR':
        return date.day.toString().padStart(2, '0') + this.DELIMITER + date.month.toString().padStart(2, '0') + this.DELIMITER + date.year

      case 'en-US':
        return date.month.toString().padStart(2, '0') + this.DELIMITER + date.day.toString().padStart(2, '0') + this.DELIMITER + date.year
    }
  }
}

@Injectable()
export class CustomDateParserFormatter extends NgbDateParserFormatter {
  constructor(public translate: TranslateService) {
    super()
  }

  readonly DELIMITER = '/'

  parse(value: string): NgbDateStruct | null {
    if (!value) return null
    let date = value.split(this.DELIMITER)
    switch (this.translate.language()) {
      case 'pt-BR':
        return {
          day: parseInt(date[0], 10),
          month: parseInt(date[1], 10),
          year: parseInt(date[2], 10),
        }

      case 'en-US':
        return {
          month: parseInt(date[0], 10),
          day: parseInt(date[1], 10),
          year: parseInt(date[2], 10),
        }

      default:
        return null
    }
  }

  format(date: NgbDateStruct | null): string {
    if (!date) return ''

    switch (this.translate.language()) {
      case 'pt-BR':
        return date.day.toString().padStart(2, '0') + this.DELIMITER + date.month.toString().padStart(2, '0') + this.DELIMITER + date.year

      case 'en-US':
        return date.month.toString().padStart(2, '0') + this.DELIMITER + date.day.toString().padStart(2, '0') + this.DELIMITER + date.year
      default:
        return ''
    }
  }
}
