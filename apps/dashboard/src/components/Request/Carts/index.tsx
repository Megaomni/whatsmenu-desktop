import { DateTime } from 'luxon'

import { useSession } from 'next-auth/react'
import Image from 'next/legacy/image'
import Link from 'next/link'
import { MouseEvent, useContext, useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, Col, Container, Form, FormGroup, Row } from 'react-bootstrap'
import { BsGearFill, BsPrinter } from 'react-icons/bs'
import { AppContext } from '../../../context/app.ctx'
import { CartsContext } from '../../../context/cart.ctx'
import { TableContext } from '../../../context/table.ctx'
import Cart from '../../../types/cart'
import { currency } from '../../../utils/wm-functions'
import { SendStatusMessageForm } from '../../SendStatusMessageForm'

export function Carts(data: any) {
  const { data: session } = useSession()

  const { carts, motoboys, setCart, updateMotoboyId, ifoodOrders, modalNewPlacedIfood, setModalNewPlacedIfood } = useContext(CartsContext)
  const { profile } = useContext(AppContext)

  // const [selectedMotoboys, setSelectedMotoboys] = useState(Number)
  // const [renderTrigger, setRenderTrigger] = useState(Boolean)

  const { setRequestsToPrint, door, possibleMobile, lastRequestDate } = useContext(AppContext)

  const waitMillis = localStorage.getItem('waitMillis') ? Number(localStorage.getItem('waitMillis')) : 7000

  const { tables } = useContext(TableContext)
  //Profile Enviroments

  const [filterSelected, setFilterSelected] = useState<string>('all')
  const motoboySelectRef = useRef(null)
  const [modalNewPlaced, setModalNewPlaced] = useState(false)

  const cartStyle = (cart: Cart) => {
    let style = 'lh wm-request'
    if (cart?.status === 'canceled') {
      style += '-canceled'
      return style
    }
    if (cart?.type === 'T') {
      style += '-table'
      return style
    }
    if (cart?.type === 'D') {
      style += '-delivery'
      return style
    }

    return style
  }

  const handlePrintCart = (event: MouseEvent<HTMLElement>, cart: Cart, directPrint = false) => {
    if (directPrint) {
      event.stopPropagation()
    }

    const { command } = cart
    const table =
      tables.find((t) => t.tablesOpened?.some((o) => o.id === command?.tableOpenedId)) ?? tables.find((t) => t.opened?.id === command?.tableOpenedId)

    if (door && DateTime.local().toMillis() - lastRequestDate > 5000) {
      setRequestsToPrint({
        carts: [cart],
        table,
        command,
        directPrint,
        type: cart.type,
        show: !directPrint,
        onHide: (c: Cart) => {
          setCart(c)
        },
      })
    }
  }

  let filteredCart
  let cartOrder
  if (ifoodOrders.orders?.length) {
    if (ifoodOrders.orders.length) {
      cartOrder = ifoodOrders.orders.concat(carts)
    }

    const sortedCarts = cartOrder?.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    let cartsIdNoRepeat = cartOrder?.filter((order, index, self) =>
      index === self.findIndex((indexOrder) => indexOrder.id === order.id))



    filteredCart = cartsIdNoRepeat?.reverse().filter((cart: any) => {
      if (filterSelected !== 'all') {
        switch (filterSelected) {
          case 'local':
            return !cart?.addressId && cart?.type !== 'T'
          case 'delivery':
            return !!cart?.address
          case 'table':
            return cart?.type === 'T'
          case 'canceled':
            return cart?.status === 'canceled' || cart?.status === 'CANCELLED'
          case 'ifood':
            return cart?.origin === 'ifood'
        }
      }
      return cart
    })
  } else {
    filteredCart = carts.reverse().filter((cart: any) => {
      if (filterSelected !== 'all') {
        switch (filterSelected) {
          case 'local':
            return !cart.addressId && cart.type !== 'T'
          case 'delivery':
            return !!cart.address
          case 'table':
            return cart.type === 'T'
          case 'canceled':
            return cart.status === 'canceled' || cart?.status === 'CANCELLED'
          case 'ifood':
            return cart.orderId
        }
      }
      return cart
    })
  }

  const formPaymentOrderIfoodOfCart = (cart: Cart) => {
    let formPayment
    switch (cart.formsPayment[0].label) {
      case 'CASH':
        formPayment = 'Dinheiro'
        break
      case 'CREDIT':
        formPayment = 'Credito'
        break
      case 'DEBIT':
        formPayment = 'Debito'
        break
      case 'MEAL_VOUCHER':
        formPayment = 'Vale Refeição'
        break
      case 'PIX':
        formPayment = 'Pix'
        break
      case 'DIGITAL_WALLET':
        formPayment = 'Carteira Digital'
        break
      default:
        formPayment = cart.formsPayment[0].label
        break
    }
    return formPayment
  }

  return (
    <>
      <section>
        <Container fluid className="mx-0 p-0">
          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <Row className="align-items-baseline mb-3">
                    <Col md="6">
                      <FormGroup className="fs-6 d-flex align-items-center justify-content-start gap-2 w-100">
                        <div className="d-block d-md-flex gap-2 flex-grow-1">
                          <Form.Label className="fs-7 m-0 d-block">Legenda:</Form.Label>
                          {[
                            ['Delivery / Retirada', 'wm-request-delivery'],
                            ['Mesa', 'wm-request-table'],
                            ['Cancelado', 'wm-request-canceled'],
                          ].map((element, index) => {
                            return (
                              <label className="d-block my-2 my-md-0" key={index}>
                                <span className={`badge d-block d-md-inline border-1 rounded-pill small fw-normal ${element[1]}`}>{element[0]}</span>
                              </label>
                            )
                          })}
                        </div>
                      </FormGroup>
                    </Col>
                    <Col md="6" className="d-flex gap-2 text-nowrap justify-content-end">
                      <FormGroup className="fs-6 px-2 pe-0 d-flex gap-2 align-items-baseline justify-content-end">
                        <Form.Label className="fs-7">Filtro:</Form.Label>
                        <Form.Select className="w-50" onChange={(e) => setFilterSelected(e.target.value)}>
                          {[
                            ['Todos', 'all'],
                            ['Delivery', 'delivery'],
                            ['Retirada', 'local'],
                            ['Mesas', 'table'],
                            ['Cancelados', 'canceled'],
                            ['Ifood', 'ifood'],
                          ].map((item, index) => {
                            return (
                              <option key={item[1]} value={item[1]}>
                                {item[0]}
                              </option>
                            )
                          })}
                        </Form.Select>
                        <Link href="/dashboard/settings">
                          <Button variant="outline-secondary" className="fw-bold text-uppercase px-2" as="a">
                            <BsGearFill size="20" />
                          </Button>
                        </Link>
                      </FormGroup>
                    </Col>
                  </Row>
                  <div className="table-responsive no-more-tables">
                    <table className={window.innerWidth <= 768 ? 'col-sm-12 table-bordered table-striped table-condensed cf' : 'table responsive'}>
                      <thead className="cf">
                        <tr>
                          <th className="fs-7 fw-600">
                            <span> Impr </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Cod. Pedido </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Origem </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Nome </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Telefone </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Total </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Pagamento </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Troco Para: </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Troco </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Entregador </span>
                          </th>
                          <th className="fs-7 fw-600 col-2 text-start">
                            <span> Status </span>
                          </th>
                        </tr>
                      </thead>
                      <tfoot>
                        <tr>
                          <td colSpan={10} className="text-end">
                            {!filteredCart ?
                              <div>
                                Loading
                              </div>
                              :
                              `Exibindo ${filteredCart.length} de ${filteredCart.length}`
                            }
                          </td>
                        </tr>
                      </tfoot>
                      <tbody>
                        {filteredCart?.map((cart) => {
                          return (
                            <tr
                              key={`${cart.code}-${cart.id}`}
                              className={cartStyle(cart)}
                              style={{ lineHeight: '2.5rem' }}
                              title={`${!door ? 'Aguarde o pedido ser impresso' : ''}`}
                            >
                              <td
                                className="py-2 aling-middle text-center print-td"
                                id="print-button"
                                onClick={(event) => handlePrintCart(event, cart, true)}
                                // style={{ pointerEvents: cartsNotPrinted.length ? "none" : "initial" }}
                                width={10}
                                data-title="Imprimir"
                              >
                                <div
                                  className="position-relative cursor-pointer"
                                  title={`${cart?.print ? 'Pedido já foi impresso' : 'Pedido não impresso'}`}
                                >
                                  <BsPrinter size={25} color={`${cart.print ? '' : 'red'}`} />
                                  {possibleMobile && !cart.print && <span className="fs-8 d-inline-block ms-1 fw-bold">&lt;- Aperte</span>}
                                </div>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={50}
                                data-title="Cód. Pedido: "
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <span className="align-middle fs-7">{cart.code ? `wm${cart.code}-${cart.type}` : `wm${cart.displayId}`}</span>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={50}
                                data-title="Origem: "
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <div className='d-md-flex h-100 align-items-center'>
                                  {cart.origin === 'whatsmenu' && (
                                    <Image
                                      src="/images/logoWhatsVertical.png"
                                      width={window.innerWidth <= 768 ? 27.5 : 55}
                                      height={window.innerWidth <= 768 ? 16.5 : 33}
                                      alt="Logo WhatsMenu"
                                    />
                                  )}
                                  {cart.origin === 'ifood' && !!cart.origin && (
                                    <Image
                                      src="/images/ifoodLogo.png"
                                      width={window.innerWidth <= 768 ? 27.5 : 55}
                                      height={window.innerWidth <= 768 ? 26.5 : 53}
                                      alt="Logo IFood"
                                    />
                                  )}
                                </div>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={100}
                                data-title="Nome: "
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <span className="align-middle fs-7">
                                  {cart.type ? (cart.type === 'T' ? cart.command : cart.client)?.name : cart.customer.name}
                                </span>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={100}
                                data-title="Telefone:"
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <span className="align-middle fs-7">
                                  {cart.code ? cart?.returnMaskedContact() : cart.customer.phone.number}
                                </span>
                              </td>
                              <td
                                className="setPrint text-center align-text-left"
                                width={50}
                                data-title="Total:"
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <span className="align-middle fs-7">{cart.type && cart.origin !== 'ifood' ? currency({ value: cart.getTotalValue('total') }) :
                                  currency({ value: cart.formsPayment[0].value })}</span>
                              </td>
                              {/* <td
                                className="setPrint align-text-left"
                                width={110}
                                data-title="Pagamento:"
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <span className="align-middle fs-7">
                                  {cart.type === 'T'
                                    ? '-'
                                    : Array.from(new Set(cart.formsPayment.map((formPayment) => formPayment.label))).join(', ')}
                                </span>
                              </td> */}
                              {/* <td
                                className="setPrint align-text-left"
                                width={100}
                                data-title="Troco Para:"
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <span className="align-middle fs-7">{currency({ value: cart.getTotalValue('total') })}</span>
                              </td> */}
                              <td
                                className="setPrint align-text-left"
                                width={110}
                                data-title="Pagamento:"
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <span className="align-middle fs-7 d-flex flex-row gap-2 align-items-center">
                                  {cart.type
                                    ? cart.type === 'T'
                                      ? '-'
                                      : cart.origin !== 'ifood' ? Array.from(new Set(cart.formsPayment.map((formPayment: any) => formPayment.label))).join(', ')
                                        : formPaymentOrderIfoodOfCart(cart) : ''}
                                  {cart.statusPayment ? cart.statusPayment === 'paid' && <Badge className="bg-success p-2">Online</Badge> : ''}
                                </span>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={100}
                                data-title="Troco Para:"
                                onClick={(event) => handlePrintCart(event, cart)}
                              >
                                <span className="align-middle fs-7">
                                  {cart.formsPayment.some((formPayment: any) => formPayment.payment === 'money')
                                    ? currency({ value: cart.transshipment() })
                                    : cart.formsPayment[0].change}
                                </span>
                              </td>
                              <td className="setPrint align-text-left" width={50} data-title="Troco:">
                                <span className="align-middle fs-7">
                                  {cart.transshipment() > 0 ? currency({ value: cart.transshipment() - cart.getTotalValue('total') })
                                    : cart.formsPayment[0].change ? currency({ value: cart.formsPayment[0].change - cart.formsPayment[0].value }) : '-'}
                                </span>
                              </td>

                              <td className="setPrint align-text-left" width={100} data-title="Entregador:">
                                {cart.addressId && cart.type !== 'T' ? (
                                  <Form.Select
                                    ref={motoboySelectRef}
                                    value={cart.motoboyId || ''}
                                    onChange={(e) =>
                                      cart.setMotoboyId(parseInt(e.target.value), () => {
                                        setCart(cart)
                                        if (session) {
                                          updateMotoboyId(cart.id, parseInt(e.target.value), session)
                                        }
                                      })
                                    }
                                  >
                                    <option>Selecione</option>
                                    {motoboys.map(
                                      (motoboy) =>
                                        motoboy.status && (
                                          <option key={motoboy.id} value={motoboy.id}>
                                            {motoboy.name}
                                          </option>
                                        )
                                    )}
                                  </Form.Select>
                                ) : (
                                  '-'
                                )}
                              </td>

                              <td className="text-end" id="status-button">
                                {cart.status !== 'canceled' && cart.status !== 'CANCELLED' ? (
                                  <>
                                    <div className="d-flex gap-2 me-1" id="container-buttons" style={{ width: 250 }}>
                                      <SendStatusMessageForm
                                        cart={cart}
                                        newStatus="production"
                                        button={{
                                          name: cart.type !== 'T' ? 'Recebido' : 'Preparo',
                                          props: {
                                            variant: cart.status !== null ? 'outline-primary' : 'primary',
                                            className: 'flex-grow-1 persist-outline',
                                            size: 'sm',
                                            as: 'a',
                                            style: { flex: '1 0 125px' },
                                          },
                                        }}
                                      />
                                      <SendStatusMessageForm
                                        cart={cart}
                                        newStatus="transport"
                                        button={{
                                          name: cart.type === 'T' ? 'Servido' : !cart.addressId ? 'Pronto Retirar' : 'Entregando',
                                          props: {
                                            variant: cart.status === 'transport' ? 'outline-orange' : 'orange',
                                            className: 'fs-7 persist-outline',
                                            size: 'sm',
                                            as: 'a',
                                            style: { flex: '1 0 125px' },
                                          },
                                        }}
                                      />
                                    </div>
                                  </>
                                ) : (
                                  <span className="fw-bold">Cancelado</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  )
}
