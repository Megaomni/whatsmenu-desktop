import { AppContext } from '@context/app.ctx'
import { useInfiniteScroll } from '@hooks/useInfiniteScroll'
import { apiRoute, currency } from '@utils/wm-functions'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { useSession } from 'next-auth/react'
import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react'
import { Card, Col, Container, Nav, Row, Tab, Table } from 'react-bootstrap'
import { Pie } from 'react-chartjs-2'
import { useReactToPrint } from 'react-to-print'
import Cart from '../../types/cart'
import { ClientTable } from './ClientTable'
import { SearchForm } from './SearchForm'

type ClientPagination = {
  data: any[]
  lastPage: number
  page: number
  perPage: number
  total: number
}

interface ClientReportProps {
  clients: ClientPagination
  setClients: Dispatch<SetStateAction<ClientPagination>>
  isValid: true
}

export const ClientReport = ({ clients, setClients }: ClientReportProps) => {
  ChartJS.register(ArcElement, Tooltip, Legend)
  const { handleShowToast, setRequestsToPrint } = useContext(AppContext)
  const { data: session } = useSession()
  const [clientSelected, setClientSelected] = useState<any | null>(null)
  const [carts, setCarts] = useState<{
    data: any[]
    lastPage: number
    page: number
    perPage: number
    total: number
  }>({
    data: [],
    lastPage: 1,
    page: 1,
    perPage: 30,
    total: 0,
  })
  const [top10, setTop10] = useState<{ clientsMaxTotal: any[]; clientsMaxQuantity: any[] } | null>(null)

  const [activeTab, setActiveTab] = useState<'all' | 'top10' | string>('all')

  const ref = useRef(null)

  const fetchCarts = async () => {
    if (clientSelected && (carts.page === 1 || carts.page <= carts.lastPage)) {
      try {
        const { data } = await apiRoute(`/dashboard/report/client/carts/${carts.page}?notValidate=true`, session, 'POST', {
          clientId: clientSelected.id,
        })
        setCarts((state) => {
          return {
            ...data.carts,
            page: state.page + 1,
            data: data.carts.page === 1 ? data.carts.data : [...(state ? state.data : []), ...data.carts.data],
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const fetchClients = async () => {
    if (clients.page <= clients.lastPage) {
      try {
        const { data: clientsPaginate } = await apiRoute(`/dashboard/report/client/${clients?.page || 1}?notValidate=true`, session, 'POST')
        setClients((state) => {
          return {
            ...clientsPaginate,
            page: clients.page + 1,
            data: [...state.data, ...clientsPaginate.data],
          }
        })
      } catch (error) {
        console.error(error)
      }
    }
  }

  const fetchTop10 = async () => {
    if (!top10) {
      try {
        const { data } = await apiRoute(`/dashboard/report/client/top10?notValidate=true`, session, 'POST')
        setTop10(data)
      } catch (error) {
        console.error(error)
      }
    }
  }
  const clientsNameQuantity = top10?.clientsMaxQuantity?.map((client: any) => client.name) || []
  const maxValueQuantity = top10?.clientsMaxQuantity?.map((client: any) => client.controls?.requests?.quantity) || []
  const pizzaMaxQuantity = {
    labels: clientsNameQuantity,
    datasets: [
      {
        label: 'Total de pedidos',
        data: maxValueQuantity,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(50, 205, 50, 0.2)',
          'rgba(255, 69, 0, 0.2)',
          'rgba(70, 130, 180, 0.2)',
          'rgba(218, 165, 32, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(50, 205, 50, 1)',
          'rgba(255, 69, 0, 1)',
          'rgba(70, 130, 180, 1)',
          'rgba(218, 165, 32, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }
  const quantitiesTotal = top10?.clientsMaxTotal?.map((client: any) => client.controls?.requests?.total) || []
  const clientsNameTotal = top10?.clientsMaxTotal?.map((client: any) => client.name) || []

  const pizzaMaxTotal = {
    labels: clientsNameTotal,
    datasets: [
      {
        label: 'Valor total gasto',
        data: quantitiesTotal,
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
          'rgba(50, 205, 50, 0.2)',
          'rgba(255, 69, 0, 0.2)',
          'rgba(70, 130, 180, 0.2)',
          'rgba(218, 165, 32, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(50, 205, 50, 1)',
          'rgba(255, 69, 0, 1)',
          'rgba(70, 130, 180, 1)',
          'rgba(218, 165, 32, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const handlePrint = useReactToPrint({
    content: () => ref.current,
    pageStyle: `
        .notPrint {
          display: none !important;
        }
        table {
          width: 100%;
          margin-left: -2.5rem;
        }
        table tr {
          text-align: center;
        }
        table td {
          padding: 7px 0;
        }
        h6 {
          font-size: 1.5rem;
        }
        #printReport {
          margin-left: 2.5rem
        }
      `,
    copyStyles: false,
  })

  useInfiniteScroll({ callback: activeTab === 'top10' || clientSelected ? fetchCarts : fetchClients })

  useEffect(() => {
    if (clientSelected) {
      fetchCarts()
    }
  }, [clientSelected])

  return (
    <>
      <Card>
        <Card.Header>
          <SearchForm
            onSelectClient={(client) => {
              setClientSelected(client)
              setCarts((state) => ({ ...state, page: 1 }))
            }}
            client={clientSelected}
          />
        </Card.Header>
      </Card>

      {clientSelected && (
        <>
          <div className="d-flex">
            <Container fluid className="p-0">
              <Row className="text-center border bg-white p-3">
                <Col xs={12} md className={`${window.innerWidth >= 768 ? 'border-end' : 'mb-3'} d-flex flex-column justify-content-center`}>
                  <h1 className={`text-danger align-middle mb-0 ${window.innerWidth >= 768 ? 'fs-3' : 'fs-6'}`}>{clientSelected?.name}</h1>
                  <h6 className="fw-bold">Cliente</h6>
                </Col>
                <Col xs={4} md className="border-end d-flex flex-column justify-content-center">
                  <h1 className={`text-danger align-middle mb-0 ${window.innerWidth >= 768 ? 'fs-3' : 'fs-6'}`}>
                    {clientSelected?.controls.requests?.quantity}
                  </h1>
                  <h6 className="fw-bold">Qtd. de Pedidos</h6>
                </Col>
                <Col xs={4} md className="border-end d-flex flex-column justify-content-center">
                  <h1 className={`text-danger align-middle mb-0 ${window.innerWidth >= 768 ? 'fs-3' : 'fs-6'}`}>
                    {currency({ value: clientSelected?.controls.requests?.total })}
                  </h1>
                  <h6 className="fw-bold">Total Pedidos</h6>
                </Col>
                <Col xs={4} md className=" d-flex flex-column justify-content-center">
                  <h1 className={`text-danger align-middle mb-0 ${window.innerWidth >= 768 ? 'fs-3' : 'fs-6'}`}>
                    {currency({ value: clientSelected?.controls.requests?.total / clientSelected?.controls.requests?.quantity })}
                  </h1>
                  <h6 className="fw-bold">Ticket Médio</h6>
                </Col>
              </Row>
              <h1 className="fs-4 mb-4 mt-4"> Histórico de Pedidos</h1>

              <Card className="table-responsive no-more-tables">
                <Table
                  className={
                    window.innerWidth <= 768 ? 'col-sm-12 table-bordered table-striped table-condensed cf' : 'table responsive table-striped'
                  }
                >
                  <thead>
                    <tr>
                      <th className="fs-7 fw-600">
                        <span> Cod. Pedido </span>
                      </th>
                      <th className="fs-7 fw-600">
                        <span> Total </span>
                      </th>
                      <th className="fs-7 fw-600">
                        <span> Forma de Pagamento </span>
                      </th>
                      <th className="fs-7 fw-600">
                        <span> Troco para </span>
                      </th>
                      <th className="fs-7 fw-600">
                        <span> Troco </span>
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {carts?.data.map((cart: any, index: number) => (
                      <tr
                        key={index}
                        onClick={() => {
                          setRequestsToPrint({
                            carts: [new Cart({ ...cart, client: clientSelected })],
                            report: true,
                            show: true,
                            command: null,
                          })
                        }}
                      >
                        <td className="ps-2 p-0 p-md-2 text-md-center">
                          <span className="fw-bold d-md-none">Cod. Pedido: </span>
                          <span>{cart.code}</span>
                        </td>

                        <td className="ps-2 p-0 p-md-2">
                          <span className="fw-bold d-md-none">Total: </span>
                          <span>{currency({ value: cart.total })}</span>
                        </td>

                        <td className="ps-2 p-0 p-md-2">
                          <span className="fw-bold d-md-none">Pagamento: </span>
                          <span>{cart.formsPayment[0].label}</span>
                        </td>

                        <td className="ps-2 p-0 p-md-2">
                          <span className="fw-bold d-md-none">Troco para: </span>
                          <span>{currency({ value: cart.formsPayment[0].change })}</span>
                        </td>

                        <td className="ps-2 p-0 p-md-2">
                          <span className="fw-bold d-md-none">Troco: </span>
                          <span>{currency({ value: cart.formsPayment[0].change - cart.formsPayment[0].value })}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </Container>
          </div>
        </>
      )}

      {!clientSelected && (
        <Tab.Container defaultActiveKey={activeTab} onSelect={(tab) => setActiveTab(tab!)}>
          <Nav variant="tabs" className="flex-column flex-md-row">
            <Nav.Item>
              <Nav.Link eventKey="all" className="m-0 p-3 text-center">
                Todos Clientes
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="top-10" className="m-0 p-3 text-center" onClick={fetchTop10}>
                TOP 10
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="all">
              <Card>
                <ClientTable onClientClick={(client) => setClientSelected(client)} clients={clients?.data || []} />
              </Card>
            </Tab.Pane>

            <Tab.Pane eventKey="top-10">
              <>
                <section ref={ref} id="printReport">
                  <Container fluid className="mx-0 p-0">
                    <Row>
                      <Col xs={{ order: 1, offset: '12' }} md={{ order: 1, span: '6' }}>
                        <Card className="notPrint" style={{ height: window.innerWidth >= 768 ? '480px' : 'auto' }}>
                          <Card.Body>
                            <Card.Title className="p-0">Volume de Pedidos</Card.Title>
                            <Pie
                              data={pizzaMaxQuantity}
                              style={{ maxHeight: '400px' }}
                              options={{
                                plugins: {
                                  legend: {
                                    position: window.innerWidth >= 768 ? 'left' : 'top',
                                    maxHeight: 200,
                                  },
                                },
                              }}
                            />
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col xs={{ order: 3, offset: '12' }} md={{ order: 3, span: '6' }}>
                        <Card className="notPrint" style={{ height: window.innerWidth >= 768 ? '480px' : 'auto' }}>
                          <Card.Body>
                            <Card.Title className="p-0">Valor Consumido</Card.Title>
                            <Pie
                              data={pizzaMaxTotal}
                              style={{ maxHeight: '400px' }}
                              options={{
                                plugins: {
                                  legend: {
                                    position: window.innerWidth >= 768 ? 'left' : 'top',
                                    maxHeight: 200,
                                  },
                                },
                              }}
                            />
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col xs={{ order: 2, offset: '12' }} md={{ order: 2, span: '6' }}>
                        <Card>
                          <ClientTable
                            onClientClick={(client) => setClientSelected(client)}
                            clients={top10?.clientsMaxQuantity || []}
                          />
                        </Card>
                      </Col>

                      <Col xs={{ order: 4, offset: '12' }} md={{ order: 4, span: '6' }}>
                        <Card>
                          <ClientTable
                            onClientClick={(client) => setClientSelected(client)}
                            clients={top10?.clientsMaxTotal || []}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </Container>
                </section>
              </>
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      )}
    </>
  )
}
