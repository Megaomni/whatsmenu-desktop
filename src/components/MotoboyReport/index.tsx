import { Title } from '@components/Partials/title'
import { CartsContext } from '@context/cart.ctx'
import { apiRoute, currency } from '@utils/wm-functions'
import { useSession } from 'next-auth/react'
import { ChangeEvent, useCallback, useContext, useEffect, useState, useRef } from 'react'
import { Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap'
import { useReactToPrint } from 'react-to-print'

import { useInfiniteScroll } from '@hooks/useInfiniteScroll'
import { DateTime } from 'luxon'
import { CartType } from '../../types/cart'

export type ReportType = 'motoboys'

interface MotoboyReportProps {
  data?: any
  isValid: true
  setData: any
  report: ReportType
  resume: { total: number; sumTaxDelivery: number }
}

export const MotoboyReport = ({ data, isValid, report, setData, ...props }: MotoboyReportProps) => {
  const { motoboys, updateMotoboyId } = useContext(CartsContext)

  // const [showMotoboyReport, setShowMotoboyReport] = useState(false)//

  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState<string>(today)
  const [endDate, setEndDate] = useState<string>(today)
  const [motoboyId, setMotoboyId] = useState<number>(data?.motoboy?.id)
  const [loading, setLoading] = useState<boolean>()
  const [page, setPage] = useState<number>(1)
  const [lastPage, setLastPage] = useState<number>(1)
  const [alreadyFetched, setAlreadyFetched] = useState(false)
  const [resume, setResume] = useState(props.resume)

  const { data: session } = useSession()
  const ref = useRef(null)

  const fetchData = async (initialPage: number) => {
    try {
      const body: any = {
        startDate,
        endDate,
        motoboyId,
        notValidate: isValid,
      }
      if (report === 'motoboys') {
        body.startDate = startDate
        body.endDate = endDate
      }

      if (alreadyFetched && (initialPage || page) > lastPage) {
        return
      }

      setAlreadyFetched(true)

      const { data: dataFetched } = await apiRoute(`/dashboard/report/motoboys/${initialPage || page}`, session, 'POST', { ...body })

      if (dataFetched) {
        setData((prevData: any) => {
          if (page === 1) {
            return dataFetched
          }

          if (!prevData.motoboy) {
            return prevData
          }

          const newData = {
            ...dataFetched,
            motoboy: {
              ...dataFetched.motoboy,
              carts: {
                ...dataFetched.motoboy.carts,
                data: dataFetched.motoboy.carts.data.filter(
                  (newCart: any) => !prevData.motoboy.carts.data.some((existingCart: any) => existingCart.id === newCart.id)
                ),
              },
            },
          }

          const updatedData = {
            ...prevData,
            motoboy: {
              ...prevData.motoboy,
              carts: {
                ...prevData.motoboy.carts,
                data: alreadyFetched ? [...prevData.motoboy.carts.data, ...newData.motoboy.carts.data] : newData.motoboy.carts.data,
              },
            },
          }

          return updatedData
        })
        setPage((prevPage) => prevPage + 1)
        setLastPage(dataFetched.motoboy?.carts?.lastPage)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useInfiniteScroll({ callback: fetchData })

  const handleButtonClick = async (cartId: number, motoboyId: number, session: any) => {
    try {
      setLoading(true)
      setMotoboyId(motoboyId)
      const { data } = await apiRoute(`/dashboard/report/motoboys/report/resume`, session, 'POST', {
        motoboyId,
        endDate,
        startDate,
        notValidate: isValid,
      })
      setResume(data)

      const isExistingCart = data?.motoboy?.carts?.data?.some((existingCart: any) => existingCart.id === cartId)
      if (!isExistingCart) {
        await fetchData(1)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!motoboyId) {
      setMotoboyId(motoboys[0]?.id)
    }
  }, [motoboys, motoboyId])

  useEffect(() => {
    setPage(1)
    setAlreadyFetched(false)
  }, [motoboyId, startDate, endDate])

  useEffect(() => {
    if (data && data.motoboy) {
      fetchData(page)
    }
  }, [data, page])

  return (
    <>
      <Title title="Relatório de Entregadores" componentTitle="Relatório de Entregadores" className="mb-4" />
      <Card>
        <Card.Header className="d-flex">
          <div className="me-2">
            <label htmlFor="datePicker">Data Inicial</label>
            <input
              type="date"
              className="form-control"
              id="datePicker"
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              value={startDate}
            />
          </div>
          <div className="me-2">
            <label htmlFor="datePicker">Data Final</label>
            <input
              type="date"
              className="form-control"
              id="datePicker"
              onChange={(e) => setEndDate(e.target.value)}
              // max={today}
              min={startDate}
              value={endDate}
            />
          </div>
          <div className="me-2">
            <label>Entregador</label>
            <Form.Select value={motoboyId} onChange={(e) => setMotoboyId(parseInt(e.target.value))}>
              {motoboys.map(
                (motoboy: any) => (
                    <option key={motoboy.id} value={motoboy.id}>
                      {motoboy.name}
                    </option>
                  )
              )}
            </Form.Select>
          </div>
          <div className="mt-auto">
            <Button variant="success" type="button" onClick={() => handleButtonClick(data?.motoboy?.carts?.data[0]?.id, motoboyId, session)}>
              Buscar
            </Button>
          </div>
          <div className="mt-auto ms-auto d-flex align-items-center gap-2">
            {/* <Button variant="primary" onClick={() => handlePrint()}>
              Imprimir
            </Button>
            <Button variant="success">Exportar para Planilha</Button> */}
          </div>
        </Card.Header>
      </Card>

      <Card>
        {motoboyId !== undefined && (
          <Card.Body className="d-flex">
            <Container fluid>
              <Row className="text-center">
                <Col>
                  <h1 className="text-danger fs-3 align-middle mb-0">{data?.motoboy?.name}</h1>
                  <h6 className="fw-bold">Entregador</h6>
                </Col>
                <Col>
                  <h1 className="text-danger fs-3 align-middle mb-0">{resume?.total}</h1>
                  <h6 className="fw-bold">Qtd. Entregas</h6>
                </Col>
                <Col>
                  <h1 className="text-danger fs-3 align-middle mb-0">{currency({ value: resume?.sumTaxDelivery })}</h1>
                  <h6 className="fw-bold">Total Taxas de Entregas</h6>
                </Col>
              </Row>
            </Container>
          </Card.Body>
        )}
      </Card>
      <section ref={ref} id="printReport" className="position-relative">
        {motoboyId !== undefined && (
          <>
            <div id="printThis">
              <h1 className="fs-3 align-middle text-uppercase mb-3"> Relatório de Entregas </h1>
              <Card>
                <div id="no-more-tables" className="table-responsive">
                  <Table
                    striped
                    bordered
                    responsive
                    className={window.innerWidth <= 768 ? 'col-sm-12 table-bordered table-striped table-condensed cf' : 'table responsive'}
                  >
                    <thead className="">
                      <tr>
                        <th className="fs-7 fw-600">
                          <span> Cod. Pedido </span>
                        </th>
                        <th className="fs-7 fw-600">
                          <span> Cliente </span>
                        </th>
                        <th className="fs-7 fw-600">
                          <span> Data </span>
                        </th>
                        <th className="fs-7 fw-600">
                          <span> Valor </span>
                        </th>
                        <th className="fs-7 fw-600">
                          <span> Taxa </span>
                        </th>
                      </tr>
                    </thead>
                    {
                      <tbody>
                        {data?.motoboy?.carts?.data &&
                          data?.motoboy.carts.data.map((cart: CartType, index: any) => (
                            <tr key={index}>
                              <td>
                                wm{cart.code}-{cart.type}
                              </td>
                              <td>{cart.client.name}</td>
                              <td>
                                {(cart.type === 'P' ? DateTime.fromISO(cart.packageDate) : DateTime.fromSQL(cart.created_at)).toFormat(
                                  'dd/MM/yyyy hh:mm:ss'
                                )}
                              </td>
                              <td>R$ {cart.formsPayment[0].value.toFixed(2)}</td>
                              <td>R$ {cart.taxDelivery.toFixed(2)}</td>
                            </tr>
                          ))}
                      </tbody>
                    }
                  </Table>
                </div>
              </Card>
            </div>
          </>
        )}
      </section>
    </>
  )
}
