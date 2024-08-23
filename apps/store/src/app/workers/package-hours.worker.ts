/// <reference lib="webworker" />

import { DateTime } from 'luxon'
import { DayType } from 'src/app/client-type'

addEventListener('message', ({ data }) => {
  const { context, packageHours, dateFormat } = JSON.parse(data)
  let dayCounter = context.profile.options.package.distanceDays.start

  while (dayCounter <= context.profile.options.package.distanceDays.end) {
    const now = DateTime.local()
    let date = DateTime.local().plus({ days: dayCounter })
    const weekday: DayType[] = context.profile.options.package.week[date.setLocale('en-US').weekdayLong.toLowerCase()]
    if (weekday.length) {
      packageHours[date.toFormat(dateFormat)] = weekday.map((period) => {
        const periodResult = []
        const [openHour, openMinute] = period.open.split(':')
        const [closeHour, closeMinute] = period.close.split(':')

        const openDate = date.set({ hour: Number(openHour), minute: Number(openMinute) })
        const closeDate = date.set({ hour: Number(closeHour), minute: Number(closeMinute) })
        if (now.toFormat(dateFormat) === openDate.toFormat(dateFormat)) {
          while (Number(date.toFormat('mm')) % context.profile.options.package.intervalTime !== 0) {
            date = date.plus({ minute: 1 })
          }
        }
        let intervalCounter = dayCounter > 0 || openDate > date ? openDate.minus({ minutes: context.profile.options.package.intervalTime }) : date
        while (intervalCounter < closeDate) {
          intervalCounter = intervalCounter.plus({ minutes: context.profile.options.package.intervalTime })
          const time = intervalCounter.toFormat('HH:mm')
          let quantity = context.profile.options.package.maxPackageHour

          if (context.profile.options.package.hoursBlock) {
            context.profile.options.package.hoursBlock[date.toFormat('MMdd')]?.hours.some((blockedHour) => {
              if (blockedHour.hour === time) {
                quantity -= blockedHour.quantity
                return blockedHour.quantity >= context.profile.options.package.maxPackageHour
              }
            })
          }
          periodResult.push({ time, quantity })
        }
        return periodResult
      })
    }
    dayCounter++
  }
  const days = context.profile.options.package.distanceDays.start
  let calendarDate = DateTime.local().plus({ days })
  context.profile.options.package.specialsDates.forEach((date, _, arr) => {
    if (arr.some((d) => DateTime.fromISO(d).toFormat('MMdd') === calendarDate.toFormat('MMdd'))) {
      calendarDate = calendarDate.plus({ days: 1 })
    }
  })
  const packageCalendar = calendarDate.toFormat(dateFormat)
  postMessage({ packageHours, packageCalendar })
})
