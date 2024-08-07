import { CashierReportModal } from '@components/Modals/CashierReportModal'
import { apiRoute, currency } from '@utils/wm-functions'
import { BarElement, CategoryScale, ChartData, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js'
import { DateTime } from 'luxon'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, Form, Table } from 'react-bootstrap'
import { Bar } from 'react-chartjs-2'
import Bartender, { BartenderType } from '../../../types/bartender'
import Cashier from '../../../types/cashier'
import { HelpVideos } from '@components/Modals/HelpVideos'
import { CashierReportTable } from '@components/CashierReportTable'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface CashierReportProps {
  bartenders: BartenderType[]
}

export const CashierReport = (props: CashierReportProps) => {
  const { data: session } = useSession()
  const formRef = useRef<HTMLFormElement>(null)

  const [bartenders, setBartenders] = useState<Bartender[]>(props.bartenders?.map((bartender) => new Bartender(bartender)))
  const [filter, setFilter] = useState<'daily' | 'monthly'>('daily')
  const [bartenderFilter, setBartenderFilter] = useState<string | number>('all')
  const [month, setMonth] = useState<number>(DateTime.local().month)
  const [year, setYear] = useState<number>(DateTime.local().year)
  const [date, setDate] = useState(DateTime.local().toISODate())

  const [modalData, setModalData] = useState<{ show: boolean; cashier?: Cashier; bartender?: Bartender }>({ show: false })

  const days = Array(DateTime.fromObject({ month }).daysInMonth)
    .fill('-')
    .map((_, index) => String(index + 1).padStart(2, '0'))

  const handleFetchCashiers = useCallback(async () => {
    try {
      const { data } = await apiRoute(`/dashboard/report/cashier?notValidate=true`, session, 'POST', { date, filter })
      setBartenders(data.bartenders?.map((bartender: BartenderType) => new Bartender(bartender)))
    } catch (error) {
      console.error(error)
    }
  }, [date, filter, session])

  const data: ChartData<'bar', number[]> = {
    labels: filter === 'daily' ? bartenders?.map((bartender) => bartender.name) : days,
    datasets: [
      {
        data: bartenders?.flatMap((b) =>
          b.cashiers.reduce((total, cashier) => (total += cashier.getTotalTransactions({ type: 'income', onlyTransactions: true })), 0)
        ),
        backgroundColor: '#42CE5C',
        label: 'Entradas',
      },
      {
        data: bartenders?.flatMap((b) => b.cashiers.reduce((total, transaction) => (total += transaction.getOnlyTableClousres()), 0)),
        backgroundColor: '#9400d3',
        label: 'Pedidos (Mesa)',
      },
      {
        data: bartenders?.flatMap((b) =>
          b.cashiers.flatMap((cashier) => cashier.carts).reduce((total, cashier) => (total += !cashier.addressId ? cashier.getTotalValue('total') : 0), 0)
        ),
        backgroundColor: '#ff00cd',
        label: 'Pedidos (Balcão)',
      },
      {
        data: bartenders?.flatMap((b) =>
          b.cashiers.reduce((total, cashier) => (total += cashier.getTotalCartsValue({ type: 'P', withPayments: false })), 0)
        ),
        backgroundColor: '#ff0',
        label: 'Pedidos (Encomenda)',
      },
      {
        data: bartenders?.flatMap((b) =>
          b.cashiers.flatMap((cashier) => cashier.carts).reduce((total, cashier) => (total += cashier.addressId ? cashier.getTotalValue('total') : 0), 0)
        ),
        backgroundColor: '#00f',
        label: 'Pedidos (Delivery)',
      },
      {
        data: bartenders?.flatMap((b) => b.cashiers.reduce((total, cashier) => (total += cashier.getTotalTransactions({ type: 'outcome' })), 0)),
        backgroundColor: '#FF0500',
        label: 'Saidas',
      },
    ],
  }

  useEffect(() => {
    if (filter === 'daily') {
      setMonth(DateTime.fromISO(date).month)
      setYear(DateTime.fromISO(date).year)
    } else {
      setDate(DateTime.fromObject({ year, month }).toISODate())
    }
    handleFetchCashiers()
  }, [date, filter, month, year, handleFetchCashiers])

  return (
    <>
      <Card>
        <Card.Header className="d-flex gap-3">
          <h4 className="">Relatório</h4>
          <div className="vr"></div>
          <HelpVideos.Trigger urls={[{ src: 'https://www.youtube.com/embed/-rtskl9XiVI', title: 'Relatório de Caixa' }]} />
        </Card.Header>
        <Card.Body>
          <Form ref={formRef} className="d-flex align-items-end gap-3">
            <div className="flex-grow-1 d-flex flex-column">
              <Form.Select value={filter} onChange={(e) => setFilter(e.target.value as any)}>
                <option value="daily">Diário</option>
                <option value="monthly">Mensal</option>
              </Form.Select>
            </div>
            <div>
              {filter === 'daily' ? (
                <Form.Control type="date" className="flex-grow-0" value={date} onChange={(e) => setDate(e.target.value)} />
              ) : (
                <div className="d-flex gap-3">
                  <div>
                    <Form.Label>Mês:</Form.Label>
                    <Form.Select className="flex-grow-0" onChange={(e) => setMonth(Number(e.target.value))} value={month}>
                      {Array(12)
                        .fill(0)
                        .map((_, index) => {
                          return (
                            <option key={index} value={index + 1}>
                              {DateTime.fromObject({ month: index + 1 }).toFormat('MM')}
                            </option>
                          )
                        })}
                    </Form.Select>
                  </div>
                  <div>
                    <Form.Label>Ano:</Form.Label>
                    <Form.Select className="flex-grow-0" onChange={(e) => setYear(Number(e.target.value))}>
                      <option value={2023}>{DateTime.local().toFormat('yyyy')}</option>
                    </Form.Select>
                  </div>
                </div>
              )}
            </div>

          </Form>
          <Bar
            options={{
              plugins: {
                title: {
                  display: true,
                  text: `Encerramento de Caixas - ${DateTime.fromISO(date, { locale: 'pt-BR' }).toFormat(filter === 'daily' ? 'DDDD' : 'MMMM yyyy')}`,
                },
              },
            }}
            data={data}
            style={{ maxHeight: '18rem' }}
          />
        </Card.Body>
      </Card>

      {/* BARTENDERS */}
      <h2>Operadadores caixas</h2>
      <div className="d-flex flex-column flex-md-row gap-3 flex-wrap justify-content-center">
        {bartenders?.map((bartender) => (
          <CashierReportTable key={bartender.id} bartender={bartender} />
        ))}
        <CashierReportTable bartender={{ name: 'Total', cashiers: bartenders?.flatMap((b) => b.cashiers).map(cashier => new Cashier(cashier)) || [] }} />
      </div>

      {/* LISTAGEM DE CAIXAS */}
      <Card className="mt-3 ">
        <Card.Header className="d-flex align-items-end justify-content-between">
          <h3>Listagem de Caixas</h3>
          <div className="d-flex aligns-items-center gap-2">
            <Form.Label className="fw-bold m-auto">Operador</Form.Label>
            <Form.Select value={bartenderFilter} onChange={(e) => setBartenderFilter(Number(e.target.value))}>
              <option value="all">Todos</option>
              {bartenders?.map((bartender) => (
                <option key={bartender.id} value={bartender.id}>
                  {bartender.name}
                </option>
              ))}
            </Form.Select>
          </div>
        </Card.Header>
        <Card.Body className="overflow-auto">
          <Table className="text-center" bordered striped>
            <thead>
              <tr>
                <th>#</th>
                <th>Operador</th>
                <th>Saldo inicial</th>
                <th>Entradas (Total)</th>
                <th>Saídas</th>
                <th>Data de Abertura</th>
                <th>Status</th>
                <th>Data de encerramento</th>
              </tr>
            </thead>
            <tbody>
              {bartenders
                ?.filter((bartender) => (bartenderFilter !== 'all' ? bartender.id === bartenderFilter : true))
                .flatMap((bartenders) => bartenders.cashiers)
                .map((cashier, index) => {
                  const bartender: Bartender | undefined = bartenders.find((bartender) => bartender.id === cashier.bartenderId)
                  return (
                    <tr className="cursor-pointer" key={cashier.id} onClick={() => setModalData({ show: true, cashier, bartender })}>
                      <td>{index + 1}</td>
                      <td>{bartender?.name}</td>
                      <td>{currency({ value: cashier.initialValue })}</td>
                      <td>
                        {currency({
                          value:
                            cashier.getTotalTransactions({ type: 'income', withInitialValue: false, onlyTransactions: false }) +
                            cashier.carts
                              .filter((c) => c.type !== 'T')
                              .filter((c) => c.status !== 'canceled')
                              .reduce((totalCart, cart) => (totalCart += cart.getTotalValue('total')), 0) || 0,
                        })}
                      </td>
                      <td>{currency({ value: cashier.getTotalTransactions({ type: 'outcome' }) || 0 })}</td>
                      <td>{DateTime.fromSQL(cashier.created_at).toFormat('dd/MM/yyyy HH:mm')}</td>
                      <td>{cashier.closed_at ? 'Fechado' : 'Aberto'}</td>
                      <td>{cashier.closed_at ? DateTime.fromISO(cashier.closed_at).toFormat('dd/MM/yyyy HH:mm') : '-'}</td>
                    </tr>
                  )
                })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      {modalData.bartender && modalData.cashier && (
        <CashierReportModal
          show={modalData.show}
          cashier={modalData.cashier}
          bartender={modalData.bartender}
          onHide={() => setModalData((state) => ({ ...state, show: false }))}
        />
      )}
    </>
  )
}
