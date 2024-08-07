import { currency } from "@utils/wm-functions";
import Bartender from "../../types/bartender";
import { Card, Table } from "react-bootstrap";

interface CashierReportTableProps {
  bartender: { name: string; cashiers: Bartender['cashiers'] };
}

export const CashierReportTable = ({ bartender }: CashierReportTableProps) => {
  return (
    <Card className="m-0" style={{ flexBasis: '48%' }}>
      <Card.Header className="text-center">
        <h3>{bartender.name}</h3>
      </Card.Header>
      <Card.Body className="d-flex flex-column">
        <div className="mx-auto">
          <p style={{ color: '#AAA' }}>RESUMO CAIXAS</p>
        </div>
        <Table className="text-center" bordered striped>
          <thead>
            <tr>
              <th>#</th>
              <th>Qntd.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Entradas</td>
              <td>
                {bartender.cashiers
                  .flatMap((cashier) => cashier.transactions)
                  .filter((transaction) => transaction.type === 'income' && transaction.obs && !transaction.obs.includes('Encerramento mesa'))
                  .length + bartender.cashiers.filter((cashier) => cashier.initialValue > 0).length}
              </td>
              <td>
                {currency({
                  value: bartender.cashiers.reduce(
                    (total, cashier) => (total += cashier.getTotalTransactions({ type: 'income', onlyTransactions: true })),
                    0
                  ),
                })}
              </td>
            </tr>
            <tr>
              <td>Pedidos (Mesa)</td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.transactions)
                    .filter((transaction) => transaction.obs && transaction.obs.includes('Encerramento mesa')).length
                }
              </td>
              <td>
                {currency({ value: bartender.cashiers.reduce((total, transaction) => (total += transaction.getOnlyTableClousres()), 0) })}
              </td>
            </tr>
            <tr>
              <td>Pedidos (Balcão)</td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .filter((cart) => cart.type === 'D' && !cart.addressId && cart.status != 'canceled').length
                }
              </td>

              <td>
                {currency({
                  value: bartender.cashiers
                    .flatMap((cashier) => cashier.carts.filter((cart) => cart.type === 'D'))
                    .reduce((total, cashier) => (total += !cashier.addressId && cashier.status != 'canceled' ? cashier.total : 0), 0),
                })}
              </td>
            </tr>
            <tr>
              <td>Pedidos (Encomenda)</td>
              <td>{bartender.cashiers.flatMap((cashier) => cashier.carts).filter((cart) => cart.type === 'P').length}</td>
              <td>
                {currency({
                  value: bartender.cashiers.reduce(
                    (total, cashier) => (total += cashier.getTotalCartsValue({ type: 'P', withPayments: false })),
                    0
                  ),
                })}
              </td>
            </tr>
            <tr>
              <td>Pedidos (Delivery)</td>
              <td>
                {
                  bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .filter((cart) => cart.type === 'D' && cart.addressId && cart.status != 'canceled').length
                }
              </td>
              <td>
                {currency({
                  value: bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .reduce((total, cashier) => (total += cashier.addressId && cashier.type === "D" && cashier.status != 'canceled' ? cashier.getTotalValue('total') : 0), 0),
                })}
              </td>
            </tr>
            <tr>
              <td>Pedidos (Cancelados)</td>
              <td>{bartender.cashiers.flatMap((cashier) => cashier.carts).filter((cart) => cart.status === 'canceled').length}</td>
              <td>
                {currency({
                  value: bartender.cashiers
                    .flatMap((cashier) => cashier.carts)
                    .filter((cart) => cart.status === 'canceled')
                    .reduce((total, cart) => (total += cart.getTotalValue('total')), 0),
                })}
              </td>
            </tr>
            <tr>
              <td>Saídas</td>
              <td>
                {bartender.cashiers.flatMap((cashier) => cashier.transactions).filter((transaction) => transaction.type === 'outcome').length}
              </td>
              <td>
                {currency({
                  value: bartender.cashiers.reduce((total, cashier) => (total += cashier.getTotalTransactions({ type: 'outcome' })), 0),
                })}
              </td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

