import { currency } from '@utils/wm-functions'
import Bartender from '../../../types/bartender'
import Cashier from '../../../types/cashier'
import { Modal, Table } from 'react-bootstrap'
import { useContext } from 'react'
import { AppContext } from '@context/app.ctx'

interface CashierReportModalProps {
  show: boolean
  cashier: Cashier
  bartender: Bartender
  onHide: () => void
}

export const CashierReportModal = ({ show, cashier, onHide }: CashierReportModalProps) => {
  const { profile } = useContext(AppContext)

  return (
    <Modal show={show} centered onHide={onHide}>
      <Modal.Header closeButton>
        <h4 className="m-0">Detalhamento caixa</h4>
      </Modal.Header>
      <Modal.Body className="flex">
        <Table className="text-center flex-grow-1" striped>
          <thead>
            <tr>
              <th>Forma de Pagamento</th>
              <th>Operador</th>
              <th>Sistema</th>
            </tr>
          </thead>
          <tbody>
            {profile.formsPayment.map((formPayment, index) => {
              const closedValueSystemTotal =
                cashier.closedValues_system?.reduce(
                  (total, closedSystemValue) => (total += closedSystemValue.payment === formPayment.payment ? closedSystemValue.total : 0),
                  0
                ) || 0
              const closedValueUserTotal =
                cashier.closedValues_user?.find((cvs) => cvs.payment === formPayment.label || cvs.payment === formPayment.payment)?.total ?? 0
              return (
                <tr key={index}>
                  <td>{formPayment.label}</td>
                  <td>{currency({ value: closedValueUserTotal })}</td>
                  <td>{currency({ value: closedValueSystemTotal })}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Modal.Body>
    </Modal>
  )
}
