import { DateTime } from 'luxon'

import { HelpVideos } from '@components/Modals/HelpVideos'
import i18n from 'i18n'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { MouseEvent, useContext, useRef, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  FormGroup,
  Row,
} from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import { BsGearFill, BsPrinter } from 'react-icons/bs'
import { groveNfeApi } from 'src/lib/axios'
import { AppContext } from '../../../context/app.ctx'
import { CartsContext } from '../../../context/cart.ctx'
import { TableContext } from '../../../context/table.ctx'
import Cart from '../../../types/cart'
import { SendStatusMessageForm } from '../../SendStatusMessageForm'
import { convertToFocusNfce } from "@whatsmenu/utils"

export function Carts(data: any) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { profile, groveNfeCompany } = useContext(AppContext)
  
  const { carts, motoboys, setCart, updateMotoboyId } = useContext(CartsContext)

  // const [selectedMotoboys, setSelectedMotoboys] = useState(Number)
  // const [renderTrigger, setRenderTrigger] = useState(Boolean)

  const {
    setRequestsToPrint,
    door,
    possibleMobile,
    lastRequestDate,
    currency,
  } = useContext(AppContext)

  const { tables } = useContext(TableContext)
  //Profile Enviroments

  const [filterSelected, setFilterSelected] = useState<string>('all')
  const motoboySelectRef = useRef(null)

  const cartStyle = (cart: Cart) => {
    let style = 'lh wm-request'
    if (cart.status === 'canceled') {
      style += '-canceled'
      return style
    }
    if (cart.type === 'T') {
      style += '-table'
      return style
    }
    if (cart.type === 'D') {
      style += '-delivery'
      return style
    }

    return style
  }

  const handlePrintCart = (
    event: MouseEvent<HTMLElement>,
    cart: Cart,
    directPrint = false
  ) => {
    if (directPrint) {
      event.stopPropagation()
    }

    const { command } = cart
    const table =
      tables.find((t) =>
        t.tablesOpened?.some((o) => o.id === command?.tableOpenedId)
      ) ?? tables.find((t) => t.opened?.id === command?.tableOpenedId)

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

  const handleEmitNote = async ({cart, groveNfeCompany}: {cart: Cart, groveNfeCompany: any}) => {
    if (!profile?.options?.integrations?.grovenfe) {
      return
    }
    try {
      const nfce = convertToFocusNfce({cart, groveNfeCompany})
      await groveNfeApi.post(`/v1/fiscalNotes/create/${profile.options.integrations.grovenfe.company_id}`, { nfce, external_id: cart.id } )
    } catch (error) {
      throw error
    }
  }
  // const handleMotoboyChange = (cartId: number, motoboyId: number, session: any) => {
  //   setSelectedMotoboys(motoboyId)
  //   updateMotoboyId(cartId, motoboyId, session)
  //   setRenderTrigger(!renderTrigger)
  // }

  const filteredCart = carts.filter((cart) => {
    if (filterSelected !== 'all') {
      switch (filterSelected) {
        case 'local':
          return !cart.addressId && cart.type !== 'T'
        case 'delivery':
          return !!cart.address
        case 'table':
          return cart.type === 'T'
        case 'canceled':
          return cart.status === 'canceled'
      }
    }
    return cart
  })

  return (
    <>
      <section>
        <Container fluid className="mx-0 p-0">
          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <Row className="align-items-baseline mb-3">
                    <Col
                      md="8"
                      className="d-flex flex-column flex-md-row gap-3"
                    >
                      <FormGroup className="d-flex flex-column flex-md-row fs-6 align-items-center justify-content-start gap-2">
                        <Form.Label className="fs-7 d-block m-0">
                          {t('caption')}:
                        </Form.Label>
                        {[
                          [`Delivery / ${t('pickup')}`, 'wm-request-delivery'],
                          [`${t('table')}`, 'wm-request-table'],
                          [`${t('cancelled_o')}`, 'wm-request-canceled'],
                        ].map((element, index) => {
                          return (
                            <label className="d-block my-md-0 my-2" key={index}>
                              <span
                                className={`badge d-block d-md-inline border-1 rounded-pill small fw-normal ${element[1]}`}
                              >
                                {element[0]}
                              </span>
                            </label>
                          )
                        })}
                      </FormGroup>
                      <div className="vr d-none d-md-block"></div>
                      <HelpVideos.Trigger
                        className="m-md-0 mb-3"
                        urls={[
                          {
                            src: 'https://www.youtube.com/embed/RX-j14y3Sc0',
                            title: t('order_list'),
                          },
                        ]}
                      />
                    </Col>
                    <Col
                      md="4"
                      className="d-flex justify-content-end gap-2 text-nowrap"
                    >
                      <FormGroup className="fs-6 d-flex align-items-baseline justify-content-end gap-2 px-2 pe-0">
                        <Form.Label className="fs-7">
                          {t('filter_o')}:
                        </Form.Label>
                        <Form.Select
                          className="w-50"
                          onChange={(e) => setFilterSelected(e.target.value)}
                        >
                          {[
                            [`${t('all')}`, 'all'],
                            ['Delivery', 'delivery'],
                            [`${t('pickup')}`, 'local'],
                            [`${t('tables')}`, 'table'],
                            [`${t('cancelled')}`, 'canceled'],
                          ].map((item) => {
                            return (
                              <option key={item[1]} value={item[1]}>
                                {item[0]}
                              </option>
                            )
                          })}
                        </Form.Select>
                        <Link href="/dashboard/settings" legacyBehavior>
                          <Button
                            variant="outline-secondary"
                            className="fw-bold text-uppercase px-2"
                            as="a"
                          >
                            <BsGearFill size="20" />
                          </Button>
                        </Link>
                      </FormGroup>
                    </Col>
                  </Row>
                  <div className="table-responsive no-more-tables">
                    <table
                      className={
                        window.innerWidth <= 768
                          ? 'col-sm-12 table-bordered table-striped table-condensed cf'
                          : 'responsive table'
                      }
                    >
                      <thead className="cf">
                        <tr>
                          <th className="fs-7 fw-600">
                            <span> {t('printed')} </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> {t('order_code')} </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> {t('name')} </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> {t('phone')} </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> Total </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> {t('payment')} </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> {t('change_for')}: </span>
                          </th>
                          <th className="fs-7 fw-600">
                            <span> {t('change')} </span>
                          </th>
                          {profile.options.integrations?.grovenfe && (
                            <th className="fs-7 fw-600">
                              <span> NFCe </span>
                            </th>
                          )}
                          <th className="fs-7 fw-600">
                            <span> {t('delivery_person')} </span>
                          </th>
                          <th className="fs-7 fw-600 col-2 text-start">
                            <span> Status </span>
                          </th>
                        </tr>
                      </thead>
                      <tfoot>
                        <tr>
                          <td colSpan={10} className="text-end">
                            {`${t('displaying')} ${filteredCart.length} ${t('of')} ${filteredCart.length}`}
                          </td>
                        </tr>
                      </tfoot>
                      <tbody>
                        {filteredCart.map((cart) => {
                          return (
                            <tr
                              key={`${cart.code}-${cart.id}`}
                              className={cartStyle(cart)}
                              style={{ lineHeight: '2.5rem' }}
                              title={`${!door ? t('wait_order_printed') : ''}`}
                            >
                              <td
                                className="aling-middle print-td py-2 text-center"
                                id="print-button"
                                onClick={(event) =>
                                  handlePrintCart(event, cart, true)
                                }
                                // style={{ pointerEvents: cartsNotPrinted.length ? "none" : "initial" }}
                                width={10}
                                data-title={t('print')}
                              >
                                <div
                                  className="position-relative cursor-pointer"
                                  title={`${cart.print ? t('order_already_printed') : t('order_not_printed')}`}
                                >
                                  <BsPrinter
                                    size={25}
                                    color={`${cart.print ? '' : 'red'}`}
                                  />
                                  {possibleMobile && !cart.print && (
                                    <span className="fs-8 d-inline-block fw-bold ms-1">
                                      &lt;- {t('press')}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={50}
                                data-title={`${t('order_code')}:`}
                                onClick={(event) =>
                                  handlePrintCart(event, cart)
                                }
                              >
                                <span className="fs-7 align-middle">{`wm${cart.code}-${cart.type}`}</span>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={100}
                                data-title={`${t('name')}:`}
                                onClick={(event) =>
                                  handlePrintCart(event, cart)
                                }
                              >
                                <span className="fs-7 align-middle">
                                  {
                                    (cart.type === 'T'
                                      ? cart.command
                                      : cart.client
                                    )?.name
                                  }
                                </span>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={100}
                                data-title={`${t('phone')}:`}
                                onClick={(event) =>
                                  handlePrintCart(event, cart)
                                }
                              >
                                <span className="fs-7 align-middle">
                                  {cart.returnMaskedContact()}
                                </span>
                              </td>
                              <td
                                className="setPrint align-text-left text-center"
                                width={50}
                                data-title="Total:"
                                onClick={(event) =>
                                  handlePrintCart(event, cart)
                                }
                              >
                                <span className="fs-7 align-middle">
                                  {currency({
                                    value: cart.getTotalValue('total'),
                                  })}
                                </span>
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
                                data-title={`${t('payment')}:`}
                                onClick={(event) =>
                                  handlePrintCart(event, cart)
                                }
                              >
                                <span className="fs-7 d-flex align-items-center flex-row gap-2 align-middle">
                                  {cart.type === 'T'
                                    ? '-'
                                    : Array.from(
                                      new Set(
                                        cart.formsPayment.map((formPayment) =>
                                          i18n.t(formPayment.payment)
                                        )
                                      )
                                    ).join(', ')}
                                  {cart.statusPayment === 'paid' && (
                                    <Badge className="bg-success p-2">
                                      Online
                                    </Badge>
                                  )}
                                </span>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={100}
                                data-title={`${t('change_for')}:`}
                                onClick={(event) =>
                                  handlePrintCart(event, cart)
                                }
                              >
                                <span className="fs-7 align-middle">
                                  {cart.formsPayment.some(
                                    (formPayment) =>
                                      formPayment.payment === 'money'
                                  )
                                    ? currency({ value: cart.transshipment() })
                                    : '-'}
                                </span>
                              </td>
                              <td
                                className="setPrint align-text-left"
                                width={50}
                                data-title={`${t('change')}:`}
                              >
                                <span className="fs-7 align-middle">
                                  {cart.transshipment() > 0
                                    ? currency({
                                      value:
                                        cart.transshipment() -
                                        cart.getTotalValue('total'),
                                    })
                                    : '-'}
                                </span>
                              </td>
                              {profile.options.integrations?.grovenfe && (
                                <td>
                                  {cart.controls?.grovenfe?.fiscal_note ? (
                                    <Link href={cart.controls?.grovenfe?.fiscal_note.url_consulta_nf} target='_blank'>
                                      <Image src="/images/grovenfe/nf-e-Emitida.svg" alt="NFCe Emitida" height={30} width={30} />
                                    </Link>
                                  ) : (
                                    <Image src="/images/grovenfe/nf-e-Pendente.svg" alt="Nota Fiscal Pendente" height={30} width={30} onClick={() => handleEmitNote({cart, groveNfeCompany})} />
                                  )}
                                </td>
                              )}
                              <td
                                className="setPrint align-text-left"
                                width={100}
                                data-title="Entregador:"
                              >
                                {cart.addressId && cart.type !== 'T' ? (
                                  <Form.Select
                                    ref={motoboySelectRef}
                                    value={cart.motoboyId || ''}
                                    onChange={(e) =>
                                      cart.setMotoboyId(
                                        parseInt(e.target.value),
                                        () => {
                                          setCart(cart)
                                          if (session) {
                                            updateMotoboyId(
                                              cart.id,
                                              parseInt(e.target.value),
                                              session
                                            )
                                          }
                                        }
                                      )
                                    }
                                  >
                                    <option>{t('select')}</option>
                                    {motoboys.map(
                                      (motoboy) =>
                                        motoboy.status && (
                                          <option
                                            key={motoboy.id}
                                            value={motoboy.id}
                                          >
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
                                {cart.status !== 'canceled' ? (
                                  <>
                                    <div
                                      className="d-flex me-1 gap-2"
                                      id="container-buttons"
                                      style={{ width: 250 }}
                                    >
                                      <SendStatusMessageForm
                                        cart={cart}
                                        newStatus="production"
                                        button={{
                                          name:
                                            cart.type !== 'T'
                                              ? t('received')
                                              : t('preparation'),
                                          props: {
                                            variant:
                                              cart.status !== null
                                                ? 'outline-primary'
                                                : 'primary',
                                            className:
                                              'flex-grow-1 persist-outline',
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
                                          name:
                                            cart.type === 'T'
                                              ? t('served')
                                              : !cart.addressId
                                                ? t('ready_for_pickup')
                                                : t('delivering'),
                                          props: {
                                            variant:
                                              cart.status === 'transport'
                                                ? 'outline-orange'
                                                : 'orange',
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
                                  <span className="fw-bold">
                                    {t('cancelled_o')}
                                  </span>
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
