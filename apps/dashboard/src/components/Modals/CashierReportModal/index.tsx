import Bartender from '../../../types/bartender'
import Cashier from '../../../types/cashier'
import { Modal, Table } from 'react-bootstrap'
import { useContext } from 'react'
import { AppContext } from '@context/app.ctx'
import { useTranslation } from 'react-i18next'

interface CashierReportModalProps {
  show: boolean
  cashier: Cashier
  bartender: Bartender
  onHide: () => void
}

export const CashierReportModal = ({
  show,
  cashier,
  onHide,
}: CashierReportModalProps) => {
  const { t } = useTranslation()
  const { profile, currency } = useContext(AppContext)

  return (
    <Modal show={show} centered onHide={onHide}>
      <Modal.Header closeButton>
        <h4 className="m-0">{t('cash_detail')}</h4>
      </Modal.Header>
      <Modal.Body className="flex">
        <Table className="flex-grow-1 text-center" striped>
          <thead>
            <tr>
              <th>{t('payment_method')}</th>
              <th>{t('operator')}</th>
              <th>{t('system')}</th>
            </tr>
          </thead>
          <tbody>
            {profile.formsPayment.map((formsPayment, index) => {
              const closedValueSystemTotal =
                cashier.closedValues_system?.reduce(
                  (total, closedSystemValue) =>
                    (total +=
                      closedSystemValue.payment === formsPayment.payment
                        ? closedSystemValue.total
                        : 0),
                  0
                ) || 0
              const closedValueUserTotal =
                cashier.closedValues_user?.reduce(
                  (value, closedUserValue) =>
                    (value +=
                      closedUserValue.payment === formsPayment.payment
                        ? closedUserValue.value
                        : 0),
                  0
                ) || 0
              return (
                <tr key={index}>
                  <td>{formsPayment.label}</td>
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
