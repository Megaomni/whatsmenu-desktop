import { DateTime } from 'luxon'
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Button, Card, OverlayTrigger, Popover, Table } from 'react-bootstrap'
import { IoTicket } from 'react-icons/io5'
import { AppContext } from '../../../context/app.ctx'
import { currency, maskedPhone, textPackage } from '../../../utils/wm-functions'
import TableClass from '../../../types/table'
import { RiFileExcel2Fill } from 'react-icons/ri'
import { useDownloadExcel } from 'react-export-table-to-excel'
import { SheetExportModal } from '../../Modals/SheetExport'
import Cart from '../../../types/cart'
import { useSession } from 'next-auth/react'
import { CartsContext } from '../../../context/cart.ctx'

interface ReportListProps {
  filter: 'delivery' | 'table' | 'package'
  title: string
  type: string
  columnType?: 'created_at' | 'packageDate'
  carts: {
    data: Cart[]
    lastPage: number
    page: number
    perPage: number
    total: number
  }
  tables: {
    data: TableClass[]
    lastPage: number
    page: number
    perPage: number
    total: number
  }
  date: string
  payment: string
  fetchAll: boolean
  setFetchAll: Dispatch<SetStateAction<boolean>>
  getReports: (page?: number, spinner?: boolean) => Promise<void>
}

export function ReportList({ filter, type, title, tables, carts, columnType, date, payment, getReports, setFetchAll, fetchAll }: ReportListProps) {
  const tableElement = document.querySelector('table')
  const { data: session } = useSession()
  const { setRequestsToPrint, profile, handleShowToast, user } = useContext(AppContext)

  const [printType, setPrintType] = useState<'command' | 'table'>()
  const [controlFetch, setControlFetch] = useState(false)
  const [onDownloadSheet, setOnDownloadSheet] = useState<boolean>(false)

  const tableRef = useRef<HTMLTableElement>(null)

  const getPlanName = () => {
    switch (filter) {
      case 'delivery':
        return 'Delivery'
      case 'table':
        return 'Mesa'
      case 'package':
        return textPackage(profile.options.package.label2)
      default:
        return ''
    }
  }

  const sheetTitle = `${title}-${date}-${getPlanName()}${payment !== 'any' ? `-${payment}` : ''}`

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: sheetTitle,
    sheet: 'Pedidos',
  })

  const handleDownloadSheet = async () => {
    await getReports(1)
    setOnDownloadSheet(true)
    setFetchAll(true)
  }

  window.onscroll = () => {
    if (!fetchAll) {
      if (
        !controlFetch &&
        (filter === 'table' ? tables?.data?.length % tables.perPage === 0 : carts?.data?.length % carts?.perPage === 0) &&
        (tableElement?.getBoundingClientRect()?.height as number) - 190 - window.scrollY < 0
      ) {
        setControlFetch(true)
      }
    }
  }

  const fetchReports = useCallback(() => {
    setTimeout(() => {
      if (controlFetch && (filter === 'table' ? tables?.page < tables?.lastPage : carts?.page < carts?.lastPage)) {
        getReports((filter === 'table' ? tables?.page : carts?.page) + 1).finally(() => {
          setControlFetch(false)
        })
      }
    }, 100)
  }, [controlFetch, filter, getReports, carts?.lastPage, carts?.page, tables?.lastPage, tables?.page])

  useEffect(() => {
    fetchReports()
  }, [controlFetch, fetchReports])

  useEffect(() => {
    carts.data = carts?.data?.map((cart) => new Cart(cart))
  }, [carts])
  return (
    <>
      <Card>
        <Card.Header className="notPrint d-flex gap-2 align-items-center justify-content-between">
          <h4 className="m-0">Resultado Pedidos {title} </h4>
          {columnType && <p className="m-0">Exibindo pedidos por data de {columnType === 'created_at' ? 'criação' : 'entrega'}</p>}
          <Button
            variant="success"
            disabled={fetchAll}
            onClick={(e) => {
              ;(e.target as HTMLButtonElement).disabled = true
              handleDownloadSheet()
            }}
          >
            <RiFileExcel2Fill /> Exportar para planilha
          </Button>
        </Card.Header>
        <Card.Body>
          {filter === 'delivery' && (
            <Table ref={tableRef} responsive striped bordered hover>
              <thead>
                <tr id="resume-header">
                  <th>Cód. Pedido</th>
                  <th>Nome</th>
                  <th>Tel</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {carts?.data?.map(
                  (cart) =>
                    cart.type === 'D' && (
                      <tr
                        key={cart.code}
                        onClick={() => {
                          setRequestsToPrint({
                            carts: [cart],
                            report: true,
                            show: true,
                            command: null,
                          })
                        }}
                        className={cart.status === 'canceled' ? 'table-danger text-red-500' : ''}
                      >
                        <td className={cart.status === 'canceled' ? 'text-red-500' : ''}>
                          <span className="d-flex gap-2">
                            <span>
                              wm-{cart.code}-{cart.type}
                            </span>
                            {cart.cupomId && (
                              <OverlayTrigger
                                placement="auto-start"
                                overlay={
                                  <Popover id="popover-basic">
                                    <Popover.Body className="text-center">
                                      <p className="fw-bold mb-1">Cupom</p>
                                      <span>{cart.cupom?.code}</span>
                                    </Popover.Body>
                                  </Popover>
                                }
                              >
                                <div className="my-auto">
                                  <IoTicket />
                                </div>
                              </OverlayTrigger>
                            )}
                          </span>
                        </td>
                        <td>{cart.client?.name}</td>
                        <td>{maskedPhone(cart.client?.whatsapp ?? '')}</td>
                        <td>{currency({ value: cart.getTotalValue('total') })}</td>
                        <td>{Array.from(new Set(cart.formsPayment.map(formPayment => formPayment.label))).join(', ')}</td>
                      </tr>
                    )
                )}
                <tr>
                  <td colSpan={3}>Pedidos: {carts?.data?.length}</td>
                  <td colSpan={2}>
                    Total:{' '}
                    {currency({
                      value: carts?.data?.reduce((total, cart) => {
                        if (cart.status !== 'canceled') {
                          total += cart.getTotalValue('total')
                        } 
                        return total
                      }, 0),
                      currency: user?.controls?.currency,
                    })}
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
          {filter === 'table' && (
            <Table ref={tableRef} responsive striped bordered hover>
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Comandas</th>
                  <th>Abertura</th>
                  <th>Permanência</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {tables?.data?.map((table) => {
                  return table.tablesOpened?.map((opened) => {
                    return opened.commands.length ? (
                      <tr
                        key={opened.id}
                        onClick={() => {
                          table.opened = opened
                          setRequestsToPrint({
                            carts: opened.getCarts(),
                            type: 'table',
                            onHide: () => {
                              setPrintType(undefined)
                            },
                            show: true,
                            table,
                            report: true,
                            command: null,
                          })
                        }}
                      >
                        <td>{table.deleted_at ? table.name.replace(table.name.substring(table.name.length - 25), ' (Desativada)') : table.name}</td>
                        <td>{opened.commands.length}</td>
                        <td>
                          {type === 'daily'
                            ? DateTime.fromSQL(opened.created_at).toFormat('HH:mm')
                            : DateTime.fromSQL(opened.created_at).toFormat("'Dia' dd - HH:mm")}
                        </td>
                        <td>{opened.perm}</td>
                        <td>{currency({ value: opened.getTotalValue('tableFee'), currency: user?.controls?.currency })}</td>
                        <td>{Array.from(new Set(opened.formsPayment.map((formPayment) => formPayment.label))).join(', ')}</td>
                      </tr>
                    ) : null
                  })
                })}
                <tr>
                  <td colSpan={4}>Mesas: {tables?.data.flatMap((t) => t.tablesOpened).filter((t) => t?.commands.length).length}</td>
                  <td colSpan={2}>
                    Total:{' '}
                    {currency({
                      value: tables?.data
                        .flatMap((t) => t.tablesOpened)
                        .filter((t) => t?.commands.length)
                        .reduce((total, opened) => (opened ? (total += opened.getTotalValue('tableFee')) : total), 0),
                      currency: user?.controls?.currency,
                    })}
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
          {filter === 'package' && (
            <Table ref={tableRef} responsive striped bordered hover>
              <thead>
                <tr>
                  <th>Cód. Pedido</th>
                  <th>Nome</th>
                  <th>Tel</th>
                  <th style={{ color: columnType === 'created_at' ? 'green' : '' }}>Data Pedido</th>
                  <th style={{ color: columnType === 'packageDate' ? 'green' : '' }}>Data Entrega</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {carts?.data?.map(
                  (cart) =>
                    cart.type === 'P' && (
                      <tr
                        key={cart.code}
                        onClick={() => {
                          setRequestsToPrint({
                            carts: [cart],
                            report: true,
                            show: true,
                            command: null,
                          })
                        }}
                        className={cart.status === 'canceled' ? 'table-danger text-red-500' : ''}
                      >
                        <td className={cart.status === 'canceled' ? 'text-red-500' : ''}>
                          <span className="d-flex gap-2">
                            <span>
                              wm-{cart.code}-{cart.type}
                            </span>
                            {cart.cupomId && <IoTicket className="my-auto" />}
                          </span>
                        </td>
                        <td>{cart.client?.name}</td>
                        <td>{maskedPhone(cart.client?.whatsapp)}</td>
                        <td>{DateTime.fromSQL(cart.created_at).toFormat('dd/MM/yyyy HH:mm')}</td>
                        <td>{cart.date().formatted}</td>
                        <td>{currency({ value: cart.getTotalValue('total'), currency: user.controls.currency })}</td>
                        <td>{Array.from(new Set(cart.formsPayment.map(formPayment => formPayment.label))).join(', ')}</td>
                      </tr>
                    )
                )}
                <tr>
                  <td colSpan={5}>Pedidos: {carts?.data?.length}</td>
                  <td colSpan={2}>
                    Total:{' '}
                    {currency({
                      value: carts?.data?.reduce((total, cart) => {
                        if (cart.status !== 'canceled') {
                          total += cart.getTotalValue('total')
                        } 
                        return total
                      }, 0),
                      currency: user?.controls?.currency,
                    })}
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      <SheetExportModal
        show={fetchAll}
        page={filter === 'table' ? tables?.page : carts?.page}
        lastPage={filter === 'table' ? tables?.lastPage : carts?.lastPage}
        onExited={() => {
          if (onDownloadSheet) {
            if (filter === 'table' ? tables?.data.length : carts?.data.length) {
              onDownloadSheet && onDownload()
              handleShowToast({ type: 'success', title: 'Pronto!', content: `Planilha ${sheetTitle}.xls gerada com sucesso!` })
            } else {
              handleShowToast({ type: 'alert', title: 'Vazio', content: 'Nenhum pedido encontrado' })
            }
            setOnDownloadSheet(false)
          }
        }}
      />
    </>
  )
}
