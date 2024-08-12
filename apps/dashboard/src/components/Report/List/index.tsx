import { DateTime } from 'luxon'
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Button, Card, OverlayTrigger, Popover, Table } from 'react-bootstrap'
import { IoTicket } from 'react-icons/io5'
import { AppContext } from '../../../context/app.ctx'
import { maskedPhone, textPackage } from '../../../utils/wm-functions'
import TableClass from '../../../types/table'
import { RiFileExcel2Fill } from 'react-icons/ri'
import { useDownloadExcel } from 'react-export-table-to-excel'
import { SheetExportModal } from '../../Modals/SheetExport'
import Cart from '../../../types/cart'
import { useSession } from 'next-auth/react'
import { CartsContext } from '../../../context/cart.ctx'
import { useTranslation } from 'react-i18next'
import i18n from 'i18n'

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
  const { t } = useTranslation()
  const tableElement = document.querySelector('table')
  const { data: session } = useSession()
  const { setRequestsToPrint, profile, handleShowToast, user, currency } = useContext(AppContext)

  const [printType, setPrintType] = useState<'command' | 'table'>()
  const [controlFetch, setControlFetch] = useState(false)
  const [onDownloadSheet, setOnDownloadSheet] = useState<boolean>(false)

  const tableRef = useRef<HTMLTableElement>(null)

  const getPlanName = () => {
    switch (filter) {
      case 'delivery':
        return 'Delivery'
      case 'table':
        return t('detail_table')
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
    sheet: t('orders'),
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
          <h4 className="m-0">
            {t('order_results')} {title}{' '}
          </h4>
          {columnType && (
            <p className="m-0">
              {t('displaying_orders_date_from')} {columnType === 'created_at' ? t('creation') : t('delivery_m')}
            </p>
          )}
          <Button
            variant="success"
            disabled={fetchAll}
            onClick={(e) => {
              ;(e.target as HTMLButtonElement).disabled = true
              handleDownloadSheet()
            }}
          >
            <RiFileExcel2Fill /> {t('export_spreadsheet')}
          </Button>
        </Card.Header>
        <Card.Body>
          {filter === 'delivery' && (
            <Table ref={tableRef} responsive striped bordered hover>
              <thead>
                <tr id="resume-header">
                  <th>{t('order_code')}</th>
                  <th>{t('name')}</th>
                  <th>{t('ph')}</th>
                  <th>Total</th>
                  <th>{t('payment')}</th>
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
                                      <p className="fw-bold mb-1">{t('coupon')}</p>
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
                        <td>{Array.from(new Set(cart.formsPayment.map((formPayment) => i18n.t(formPayment.payment)))).join(', ')}</td>
                      </tr>
                    )
                )}
                <tr>
                  <td colSpan={3}>
                    {t('orders')}: {carts?.data?.length}
                  </td>
                  <td colSpan={2}>
                    Total:{' '}
                    {currency({
                      value: carts?.data?.reduce((total, cart) => {
                        if (cart.status !== 'canceled') {
                          total += cart.getTotalValue('total')
                        }
                        return total
                      }, 0),
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
                  <th>{t('table')}</th>
                  <th>{t('order_slips')}</th>
                  <th>{t('opening')}</th>
                  <th>{t('duration')}</th>
                  <th>Total</th>
                  <th>{t('payment')}</th>
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
                        <td>{table.deleted_at ? table.name.replace(table.name.substring(table.name.length - 25), t('disabled')) : table.name}</td>
                        <td>{opened.commands.length}</td>
                        <td>
                          {type === 'daily'
                            ? DateTime.fromSQL(opened.created_at).toFormat('HH:mm')
                            : DateTime.fromSQL(opened.created_at).toFormat(`${t('day')} dd - HH:mm`)}
                        </td>
                        <td>{opened.perm}</td>
                        <td>{currency({ value: opened.getTotalValue('tableFee') })}</td>
                        <td>{Array.from(new Set(opened.formsPayment.map((formPayment) => formPayment.label))).join(', ')}</td>
                      </tr>
                    ) : null
                  })
                })}
                <tr>
                  <td colSpan={4}>
                    {t('tables')}: {tables?.data.flatMap((t) => t.tablesOpened).filter((t) => t?.commands.length).length}
                  </td>
                  <td colSpan={2}>
                    Total:{' '}
                    {currency({
                      value: tables?.data
                        .flatMap((t) => t.tablesOpened)
                        .filter((t) => t?.commands.length)
                        .reduce((total, opened) => (opened ? (total += opened.getTotalValue('tableFee')) : total), 0),
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
                  <th>{t('code_order')}</th>
                  <th>{t('name')}</th>
                  <th>{t('ph')}</th>
                  <th style={{ color: columnType === 'created_at' ? 'green' : '' }}>{t('order_date')}</th>
                  <th style={{ color: columnType === 'packageDate' ? 'green' : '' }}>{t('delivery_date')}</th>
                  <th>Total</th>
                  <th>{t('payment')}</th>
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
                        <td>{DateTime.fromSQL(cart.created_at).toFormat(`${t('date_format')} HH:mm`)}</td>
                        <td>{cart.date().formatted}</td>
                        <td>{currency({ value: cart.getTotalValue('total') })}</td>
                        <td>{Array.from(new Set(cart.formsPayment.map((formPayment) => formPayment.label))).join(', ')}</td>
                      </tr>
                    )
                )}
                <tr>
                  <td colSpan={5}>
                    {t('orders')}: {carts?.data?.length}
                  </td>
                  <td colSpan={2}>
                    Total:{' '}
                    {currency({
                      value: carts?.data?.reduce((total, cart) => {
                        if (cart.status !== 'canceled') {
                          total += cart.getTotalValue('total')
                        }
                        return total
                      }, 0),
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
              handleShowToast({
                type: 'success',
                title: `${t('ready')}!`,
                content: `${t('spreadsheet')} ${sheetTitle}.xls ${t('successfully_generated')}!`,
              })
            } else {
              handleShowToast({ type: 'alert', title: t('empty'), content: t('no_orders_found') })
            }
            setOnDownloadSheet(false)
          }
        }}
      />
    </>
  )
}
