import { WeekType } from './week.js'

export type ProductDisponibility = {
  store: {
    delivery: boolean
    table: boolean
    package: boolean
  }
  week: WeekType
}
