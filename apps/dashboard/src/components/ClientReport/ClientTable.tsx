import { Table } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { useContext } from 'react'
import { AppContext } from '@context/app.ctx'

interface ClientTableProps {
  clients: any[]
  onClientClick: (client: any) => void
}

export const ClientTable = ({ clients, onClientClick }: ClientTableProps) => {
  const { currency } = useContext(AppContext)
  const { t } = useTranslation()
  return (
    <div className="table-responsive no-more-tables">
      <Table
        style={{ minHeight: '480px' }}
        className={`${window.innerWidth <= 768 ? 'col-sm-12 table-bordered table-striped table-condensed cf' : 'responsive table-striped table'} m-0`}
      >
        <thead className="cf">
          <tr>
            <th className="fs-7 fw-600">
              <span> {t('n_orders')} </span>
            </th>
            <th className="fs-7 fw-600">
              <span> {t('client')} </span>
            </th>
            <th className="fs-7 fw-600">
              <span> {t('total_amount')}</span>
            </th>
            <th className="fs-7 fw-600">
              <span> {t('average_ticket')} </span>
            </th>
          </tr>
        </thead>
        {
          <tbody>
            {clients.map((client: any, index: number) => (
              <tr
                key={index}
                className="fs-7 fs-md-5"
                onClick={() => onClientClick(client)}
              >
                <td className="text-md-center ps-2 pt-2">
                  <span className="fw-bold d-md-none">{t('n_orders')}: </span>
                  <span>{client.controls?.requests?.quantity}</span>
                </td>
                <td className="ps-2">
                  <span className="fw-bold d-md-none">{t('name')}: </span>
                  <span>{client.name}</span>
                </td>
                <td className="ps-2">
                  <span className="fw-bold d-md-none">
                    {t('total_spent')}:{' '}
                  </span>
                  <span>
                    {currency({ value: client.controls?.requests?.total })}
                  </span>
                </td>
                <td className="pb-2 ps-2">
                  <span className="fw-bold d-md-none">
                    {t('average_ticket')}:{' '}
                  </span>
                  <span>
                    {currency({
                      value:
                        client.controls?.requests?.total /
                        client.controls?.requests?.quantity,
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        }
      </Table>
    </div>
  )
}
