import { DisponibilityType } from './inventory.js'
import { WeekType } from './week.js'

export type ProductDisponibility = {
  store: DisponibilityType
  week: WeekType
}
