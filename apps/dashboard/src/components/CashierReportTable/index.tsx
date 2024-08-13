import Bartender from '../../types/bartender'
import { Card, Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import i18n from 'i18n'
import { useContext } from 'react'
import { AppContext } from '../../context/app.ctx'

interface CashierReportTableProps {
  bartender: { name: string; cashiers: Bartender['cashiers'] }
}

export const CashierReportTable = ({ bartender }: CashierReportTableProps) => {
  const { currency } = useContext(AppContext)
  const { t } = useTranslation()
  return (
    <Card className="m-0" style={{ flexBasis: '48%' }}>
      <Card.Header className="text-center">
        <h3>{bartender.name}</h3>
      </Card.Header>
      <Card.Body className="d-flex flex-column">
        <div className="mx-auto">
          <p style={{ color: '#AAA' }}>{t('cash_summary')}</p>
        </div>
        <Table className="text-center" bordered striped>
          <thead>
            <tr>
              <th>#</th>
              <th>{t('qty')}</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{t('incomes')}</td>
              <td>
                {bartender.cashiers
                  .flatMap((cashier) => cashier.transactions)
                  .filter(
                    (transaction) =>
                      transaction.type === 'income' &&
                      transaction.obs &&
                      !transaction.obs.includes(i18n.t('table_closing'))
                  ).length +
                  bartender.cashiers.filter(
                    (cashier) => cashier.initialValue > 0
                  ).length}
              </td>
              <td>
                {currency({
                  value: bartender.cashiers.reduce(
                    (total, cashier) =>
                      (total += cashier.getTotalTransactions({
                        type: 'income',
                        onlyTransactions: true,
                      })),
                    0
                  ),
                })}
              </td>
            </tr>
            <tr>
              <td>
                {t('orders')} ({t('table')})
              </td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.transactions)
                    .filter(
                      (transaction) =>
                        transaction.obs &&
                        transaction.obs.includes(t('table_closing'))
                    ).length
                }
              </td>
              <td>
                {currency({
                  value: bartender.cashiers.reduce(
                    (total, transaction) =>
                      (total += transaction.getOnlyTableClousres()),
                    0
                  ),
                })}
              </td>
            </tr>
            <tr>
              <td>
                {t('orders')} ({t('counter')})
              </td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .filter(
                      (cart) =>
                        cart.type === 'D' &&
                        !cart.addressId &&
                        cart.status != 'canceled'
                    ).length
                }
              </td>

              <td>
                {currency({
                  value: bartender.cashiers
                    .flatMap((cashier) =>
                      cashier.carts.filter((cart) => cart.type === 'D')
                    )
                    .reduce(
                      (total, cashier) =>
                        (total +=
                          !cashier.addressId && cashier.status != 'canceled'
                            ? cashier.total
                            : 0),
                      0
                    ),
                })}
              </td>
            </tr>
            <tr>
              <td>
                {t('orders')} ({t('request')})
              </td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .filter((cart) => cart.type === 'P').length
                }
              </td>
              <td>
                {currency({
                  value: bartender.cashiers.reduce(
                    (total, cashier) =>
                      (total += cashier.getTotalCartsValue({
                        type: 'P',
                        withPayments: false,
                      })),
                    0
                  ),
                })}
              </td>
            </tr>
            <tr>
              <td>{t('orders')} (Delivery)</td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .filter(
                      (cart) =>
                        cart.type === 'D' &&
                        cart.addressId &&
                        cart.status != 'canceled'
                    ).length
                }
              </td>
              <td>
                {currency({
                  value: bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .reduce(
                      (total, cashier) =>
                        (total +=
                          cashier.addressId &&
                          cashier.type === 'D' &&
                          cashier.status != 'canceled'
                            ? cashier.getTotalValue('total')
                            : 0),
                      0
                    ),
                })}
              </td>
            </tr>
            <tr>
              <td>
                {t('orders')} ({t('cancelled')})
              </td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .filter((cart) => cart.status === 'canceled').length
                }
              </td>
              <td>
                {currency({
                  value: bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .filter((cart) => cart.status === 'canceled')
                    .reduce(
                      (total, cart) => (total += cart.getTotalValue('total')),
                      0
                    ),
                })}
              </td>
            </tr>
            <tr>
              <td>{t('outflows')}</td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.transactions)
                    .filter((transaction) => transaction.type === 'outcome')
                    .length
                }
              </td>
              <td>
                {currency({
                  value: bartender.cashiers.reduce(
                    (total, cashier) =>
                      (total += cashier.getTotalTransactions({
                        type: 'outcome',
                      })),
                    0
                  ),
                })}
              </td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  )
}
