import { currency } from "@utils/wm-functions"
import { Table } from "react-bootstrap"

interface ClientTableProps {
  clients: any[],
  onClientClick: (client: any) => void
}

export const ClientTable = ({ clients, onClientClick }: ClientTableProps) => {
  return (
    <div className="table-responsive no-more-tables">
      <Table
        style={{ minHeight: '480px' }}
        className={`${window.innerWidth <= 768 ? 'col-sm-12 table-bordered table-striped table-condensed cf' : 'table responsive table-striped'} m-0`}
      >
        <thead className="cf">
          <tr>
            <th className="fs-7 fw-600">
              <span> Nº de Pedidos </span>
            </th>
            <th className="fs-7 fw-600">
              <span> Cliente </span>
            </th>
            <th className="fs-7 fw-600">
              <span> Valor Total</span>
            </th>
            <th className="fs-7 fw-600">
              <span> Ticket Médio </span>
            </th>
          </tr>
        </thead>
        {
          <tbody>
            {clients.map((client: any, index: number) =>
              (
                <tr key={index} className="fs-7 fs-md-5" onClick={() => onClientClick(client)}>
                  <td className="ps-2 pt-2 text-md-center">
                    <span className="fw-bold d-md-none">Nº de Pedidos: </span>
                    <span>{client.controls?.requests?.quantity}</span>
                  </td>
                  <td className="ps-2">
                    <span className="fw-bold d-md-none">Nome: </span>
                    <span>{client.name}</span>
                  </td>
                  <td className="ps-2">
                    <span className="fw-bold d-md-none">Total Gasto: </span>
                    <span>{currency({ value: client.controls?.requests?.total })}</span>
                  </td>
                  <td className="ps-2 pb-2">
                    <span className="fw-bold d-md-none">Ticket Médio: </span>
                    <span>{currency({ value: client.controls?.requests?.total / client.controls?.requests?.quantity })}</span>
                    </td>
                </tr>
              ) 
            )}
          </tbody>
        }
      </Table>
    </div>
  )
}
