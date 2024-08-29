import { WeekType } from '#types/week'
import { randomUUID } from 'node:crypto'

export const generateWeekDisponibility = (): WeekType => {
  const day = {
    code: randomUUID().slice(0, 6),
    close: '23:59',
    open: '00:00',
  }
  return {
    monday: [{ weekDay: 1, ...day }],
    tuesday: [{ weekDay: 2, ...day }],
    wednesday: [{ weekDay: 3, ...day }],
    thursday: [{ weekDay: 4, ...day }],
    friday: [{ weekDay: 5, ...day }],
    saturday: [{ weekDay: 6, ...day }],
    sunday: [{ weekDay: 7, ...day }],
  }
}
