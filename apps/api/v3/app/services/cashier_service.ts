import Cashier from '#models/cashier'
import Profile from '#models/profile'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
export default class CashierService {
  async generateClosedValues(cashier: Cashier, profile: Profile) {
    const closedDate = (cashier.closed_at ? cashier.closed_at : DateTime.local()).toFormat(
      '"yyyy-MM-dd HH:mm:ss"'
    )
    try {
      const closedValues_system = await db.rawQuery(
        `
        SELECT sum(value) as total, payment, flag, created_at, profileId, status
        FROM carts,
          JSON_TABLE(
            formsPayment,
            '$[*]' COLUMNS(
                    value FLOAT PATH '$.value',
                    payment VARCHAR(20) PATH '$.payment',
                    flag VARCHAR(20) PATH '$.flag.name'
                  )
          ) AS paymentSummary WHERE created_at BETWEEN ${cashier.created_at.toFormat('"yyyy-MM-dd HH:mm:ss"')} AND ${closedDate} AND profileId = ${
            profile.id
          } AND (status <> "canceled" OR status IS NULL)  GROUP BY total, payment, flag, created_at, profileId, status;
      `
      )
      console.log(closedValues_system)

      const formsPayment = profile.formsPayment.filter((formPayment) => formPayment.status)

      const cashierClosedSystemValues = formsPayment.reduce((acc: any[], formPayment) => {
        const { payment, label } = formPayment
        const baseClosedValue = { payment, label, total: 0 }
        switch (formPayment.payment) {
          case 'card':
          case 'credit':
          case 'debit':
          case 'food':
          case 'snack':
            formPayment.flags.forEach((flag: any) => {
              acc.push({
                ...baseClosedValue,
                flag: flag.name,
                total: closedValues_system[0].reduce(
                  (total: number, closedSystemValue: any) =>
                    (total +=
                      closedSystemValue.payment === payment && closedSystemValue.flag === flag.name
                        ? closedSystemValue.total
                        : 0),
                  0
                ),
              })
            })
            break
          default:
            acc.push({
              ...baseClosedValue,
              flag: null,
              total: closedValues_system[0].reduce(
                (total: number, closedSystemValue: any) =>
                  (total += closedSystemValue.payment === payment ? closedSystemValue.total : 0),
                0
              ),
            })
            break
        }
        return acc
      }, [])

      return cashierClosedSystemValues
    } catch (error) {
      throw error
    }
  }
}
