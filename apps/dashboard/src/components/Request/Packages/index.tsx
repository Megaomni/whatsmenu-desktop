import { DateTime } from 'luxon'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useContext, useEffect, useRef, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  FormGroup,
  Row,
} from 'react-bootstrap'
import { BsGearFill, BsPrinter } from 'react-icons/bs'
import { AppContext } from '../../../context/app.ctx'
import { CartsContext } from '../../../context/cart.ctx'
import { PackageCartsData } from '../../../reducers/carts/reducer'
import Cart from '../../../types/cart'
import {
  apiRoute,
  getNow,
  scrollToElement,
  textPackage,
} from '../../../utils/wm-functions'
import { ResumePackage } from '../../Modals/Requests/Package/Resume'
import { SendStatusMessageForm } from '../../SendStatusMessageForm'
import { useTranslation } from 'react-i18next'

export function Packages() {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { profile, setRequestsToPrint } = useContext(AppContext)

  const { packageCarts, setPackageCarts, motoboys, updateMotoboyId, setCart } =
    useContext(CartsContext)
  const [cartsData, setCartsData] = useState<PackageCartsData>({
    data: [],
    lastPage: 0,
    page: 0,
    perPage: 20,
    total: 0,
  })
  const motoboySelectRef = useRef(null)

  const [showModalResumePackage, setShowModalResumePackage] =
    useState<boolean>(false)
  const [requestsPersonalized, setRequestsPersonalized] = useState<Cart[]>([])
  const [filterSelected, setFilterSelected] = useState<string>('all')

  const [controlFetch, setControlFetch] = useState(false)

  const table = document.getElementById('packagesTable') as HTMLElement

  const sortPackages = () => {
    const arr = cartsData.data.sort((a, b) => {
      const dataA = DateTime.fromSQL(a.packageDate)
      const dataB = DateTime.fromSQL(b.packageDate)

      if (dataA < dataB) {
        return -1
      } else if (dataB > dataA) {
        return 1
      } else {
        return 0
      }
    })
    return arr.map((cart) => cart)
  }

  const sortedPackages = sortPackages()

  const $requests = sortedPackages.map((cart) => {
    const created_at = DateTime.fromSQL(cart.created_at).toFormat(
      `${t('date_format')}`
    )
    const packageDate = cart.date().formatted

    if (filterSelected !== 'all') {
      switch (filterSelected) {
        case 'wait':
          if (cart.status !== null) {
            return
          }
          break
        case 'production':
          if (cart.status !== 'production') {
            return
          }
          break
        case 'delivery':
          if (cart.status !== 'transport') {
            return
          }
          break
        case 'canceled':
          if (cart.status !== 'canceled') {
            return
          }
          break
        case 'shipping_delivery':
          if (cart.addressId) {
            return
          }
          break
        case 'shipping_local':
          if (!cart.addressId) {
            return
          }
          break
      }
    }

    const requestColor = () => {
      const { nowSetZero: now } = getNow()

      const packageDate = cart.date().zero
      const diff = Math.abs((packageDate as DateTime).diff(now, 'days').days)

      if (cart.status === 'canceled') {
        return 'wm-request-canceled'
      }

      if (diff === 0) {
        return 'wm-green-day'
      }

      if (diff === 1) {
        return 'wm-orange-day'
      }
    }

    return (
      <tr
        key={`${cart.code}-${cart.id}`}
        className={`${requestColor()} border-end-0"`}
        onClick={(e) => {
          const target = e.target as HTMLElement
          const parentElement = (e.target as HTMLElement)
            .parentElement as HTMLElement

          if (
            target.classList.contains('td-skip') ||
            parentElement.classList.contains('td-skip')
          ) {
            return
          }

          setRequestsToPrint({
            carts: [cart],
            command: null,
            type: cart.type,
            show: true,
          })
        }}
      >
        <td
          className="td-skip aling-middle fs-7 py-2"
          data-title="Marcar p/ Resumo"
        >
          <Form.Check
            className="td-skip check_req"
            data-type="package"
            data-req-id={cart.id}
            checked={!!requestsPersonalized.find((req) => req.id === cart.id)}
            onChange={(e) => {
              const target = e.target as HTMLInputElement

              const checkUncheck = (
                document.querySelector('.checkUncheck') as HTMLDivElement
              ).children[0] as HTMLInputElement
              const allChecks = document.querySelectorAll('.check_req')
              const allInputCheckeds = (
                Array.from(allChecks) as HTMLDivElement[]
              )?.every((div) => {
                const input = div.children[0] as HTMLInputElement
                return input.checked
              })

              if (allInputCheckeds) {
                checkUncheck.checked = true
              } else {
                checkUncheck.checked = false
              }

              if (target.checked) {
                setRequestsPersonalized([...requestsPersonalized, cart])
              } else {
                const filtered = requestsPersonalized.filter(
                  (c) => c.id !== cart.id
                )
                setRequestsPersonalized([...filtered])
              }
            }}
          />
        </td>
        <td
          className="td-skip aling-middle print-td py-2 "
          onClick={() => {
            setRequestsToPrint({
              carts: [cart],
              directPrint: true,
            })
          }}
          data-title="Imprimir"
        >
          <div className="position-relative td-skip cursor-pointer">
            <BsPrinter
              size={25}
              color={`${cart.print ? '' : 'red'}`}
              title={`${cart.print ? undefined : t('order_not_printed')}`}
            />
          </div>
        </td>
        <td data-title={`${t('code_order')}:`}>
          <span className="aling-middle fs-7">{`wm${cart.code}-${cart.type}`}</span>
        </td>
        <td data-title={`${t('name')}:`}>
          <span className="aling-middle fs-7">{cart.client?.name}</span>
        </td>
        <td data-title={`${t('phone')}:`}>
          <span className="aling-middle fs-7">
            {cart.returnMaskedContact()}
          </span>
        </td>
        <td data-title={`${t('payment')}:`}>
          <span className="aling-middle fs-7">
            {cart.formsPayment.map((payment) => payment.label).join(', ')}
          </span>
        </td>
        <td data-title={`${t('order_date')}:`}>
          <span className="aling-middle fs-7">{created_at}</span>
        </td>
        <td data-title={`${t('delivery_date')}:`}>
          <span className="aling-middle fs-7">{packageDate}</span>
        </td>
        <td
          className="setPrint align-text-left td-skip"
          width={100}
          data-title={`${t('delivery_person')}:`}
        >
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
              <option>{t('select')}</option>
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
        <td className="td-skip text-end" id="status-button">
          {cart.status !== 'canceled' ? (
            <div
              className="d-flex td-skip mx-auto gap-2 "
              id="container-buttons"
              style={{ width: 275 }}
            >
              <SendStatusMessageForm
                cart={cart}
                newStatus="production"
                button={{
                  name: cart.type !== 'T' ? t('received') : t('preparation'),
                  props: {
                    variant:
                      cart.status !== null ? 'outline-primary' : 'primary',
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
                  name: !cart.address ? t('ready_for_pickup') : t('delivering'),
                  props: {
                    variant:
                      cart.status === 'transport' ? 'outline-orange' : 'orange',
                    className: 'fs-7 persist-outline',
                    size: 'sm',
                    as: 'a',
                    style: { flex: '1 0 125px' },
                  },
                }}
              />
            </div>
          ) : (
            <span className="fw-bold">{t('cancelled_o')}</span>
          )}
        </td>
      </tr>
    )
  })

  useEffect(() => {
    window.onscroll = () => {
      const tab = document.querySelector('#packageTabHead a')
      if (
        tab?.classList.contains('active') &&
        !controlFetch &&
        cartsData.data.length % cartsData.perPage === 0 &&
        cartsData.page + 1 <= cartsData.lastPage &&
        table?.getBoundingClientRect()?.bottom - 190 - window.scrollY < 0
      ) {
        setControlFetch(true)
      }
    }
  })

  useEffect(() => {
    const getCarts = async () => {
      try {
        const { data } = await apiRoute(
          `/dashboard/carts/package?page=${cartsData.page + 1}`,
          session
        )
        window.scrollTo({
          top: table?.getBoundingClientRect()?.bottom,
          behavior: 'auto',
        })
        const { packageCarts } = data
        setPackageCarts(packageCarts)
        setControlFetch(false)
      } catch (error) {
        throw error
      }
    }
    if (controlFetch) {
      getCarts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlFetch])

  // useEffect(() => {
  //   if (packageCarts) {
  //     setCartsData(packageCarts);
  //   }
  // }, [packageCarts]);

  useEffect(() => {
    if (packageCarts) {
      setCartsData({
        ...packageCarts,
        data: packageCarts.data.filter((cart) => {
          if (filterSelected !== 'all') {
            switch (filterSelected) {
              case 'wait':
                if (cart.status !== null) {
                  return
                }
                break
              case 'production':
                if (cart.status !== 'production') {
                  return
                }
                break
              case 'delivery':
                if (cart.status !== 'transport') {
                  return
                }
                break
              case 'canceled':
                if (cart.status !== 'canceled') {
                  return
                }
                break
              case 'shipping_delivery':
                if (!cart.address) {
                  return
                }
                break
              case 'shipping_local':
                if (cart.address) {
                  return
                }
                break
            }
          }

          return cart
        }),
      })
    }
  }, [filterSelected, packageCarts])

  return (
    <>
      <section>
        <Container fluid className="mx-0 p-0">
          <Row>
            <Col>
              <Card>
                <Card.Body>
                  <Row className="fs-7 sm-package-component-header mb-3">
                    <Col className="d-flex align-items-center wm-gap-row package-component-info gap-2">
                      <span className="text-nowrap">
                        {t('deliver')}
                        <span className="rounded-circle d-inline-block wm-green-day ms-2 p-2 align-middle"></span>{' '}
                        {t('today')} /
                        <span className="rounded-circle d-inline-block wm-orange-day ms-2 p-2 align-middle"></span>{' '}
                        {t('tomorrow')}
                      </span>
                    </Col>
                    <Col className="d-flex align-items-end justify-content-end filter-select-content flex-nowrap gap-2">
                      <div className="d-flex align-items-baseline justify-content-center gap-2">
                        <Form.Label>Filtro:</Form.Label>
                        <FormGroup>
                          <Form.Select
                            className="package-filter-select"
                            onChange={(e) => {
                              scrollToElement(`.${e.target.classList[0]}`)
                              setFilterSelected(e.target.value)
                              setRequestsPersonalized([])
                            }}
                          >
                            <option value="all">{t('all')}</option>
                            <option value="wait">{t('pending')}</option>
                            <option value="production">
                              {t('marked_received')}
                            </option>
                            <option value="delivery">
                              {t('deliver_pickup')}
                            </option>
                            <option value="canceled">{t('cancelled')}</option>
                            <option value="shipping_delivery">
                              {t('delivery_e')}
                            </option>
                            <option value="shipping_local">
                              {t('local_delivery')}
                            </option>
                          </Form.Select>
                        </FormGroup>
                      </div>
                      <div className="d-flex package-filter-buttons gap-2">
                        <Button onClick={() => setShowModalResumePackage(true)}>
                          <span>{t('summary')}</span>
                        </Button>
                        <Link href="/dashboard/settings/package" legacyBehavior>
                          <Button
                            variant="outline-secondary"
                            className="fw-bold text-uppercase px-2"
                            as="a"
                          >
                            <BsGearFill size="20" />
                          </Button>
                        </Link>
                      </div>
                    </Col>
                  </Row>
                  {!cartsData.data.length && !profile.options.package.active ? (
                    <div className="my-5 p-5 text-center">
                      <h3>
                        {textPackage(profile.options.package.label2)}{' '}
                        {t('closed_o')}
                      </h3>
                      <span>
                        {t('receive_orders_from')}{' '}
                        {textPackage(profile.options.package.label2)}{' '}
                        {t('enable_options_the_settings_for')}{' '}
                        {textPackage(profile.options.package.label2)}
                      </span>
                    </div>
                  ) : (
                    <div className="table-responsive no-more-tables">
                      <table
                        className={
                          window.innerWidth <= 768
                            ? 'col-sm-12 table-bordered table-striped table-condensed cf'
                            : 'responsive table'
                        }
                        id="packagesTable"
                        // className="striped hover"
                        // responsive
                      >
                        <thead className="cf">
                          <tr>
                            <th className="fs-7">
                              <Form.Check
                                className="checkUncheck"
                                data-type="package"
                                onChange={(e) => {
                                  const target = e.target as HTMLInputElement
                                  const allChecks =
                                    document.querySelectorAll('.check_req')
                                  const newCarts: Cart[] = []
                                  ;(
                                    Array.from(allChecks) as HTMLDivElement[]
                                  )?.map((div) => {
                                    const input = div
                                      .children[0] as HTMLInputElement
                                    if (target.checked) {
                                      const cart = cartsData.data.find(
                                        (cart) =>
                                          cart.id ===
                                          Number(input.dataset.reqId)
                                      )
                                      input.checked = true
                                      if (cart) {
                                        newCarts.push(cart)
                                      }
                                    } else {
                                      input.checked = false
                                      setRequestsPersonalized([])
                                    }
                                  })

                                  if (newCarts.length) {
                                    setRequestsPersonalized(newCarts)
                                  }
                                }}
                              />
                            </th>
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
                              <span> {t('payment')} </span>
                            </th>
                            <th className="fs-7 fw-600">
                              <span> {t('order_date')} </span>
                            </th>
                            <th className="fs-7 fw-600">
                              <span> {t('delivery_date')} </span>
                            </th>
                            <th className="fs-7 fw-600">
                              <span> {t('delivery_person')} </span>
                            </th>
                            <th className="fs-7 fw-600">
                              <span> Status </span>
                            </th>
                          </tr>
                        </thead>
                        <tfoot>
                          <tr>
                            <td colSpan={9} className="text-end"></td>
                          </tr>
                        </tfoot>
                        <tbody>
                          {$requests.length ? (
                            $requests //<-- Tr de Pedidos de Encomendas
                          ) : (
                            <tr>
                              <td colSpan={9}>
                                <span className="fw-bold fs-7">
                                  {t('are_no_orders_moment')}
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      <ResumePackage
        show={showModalResumePackage}
        filterSelected={filterSelected}
        resumeChecked={requestsPersonalized.length ? true : false}
        carts={
          requestsPersonalized.length ? requestsPersonalized : cartsData.data
        }
        setRequestsPersonalized={() => {
          setRequestsPersonalized([])
        }}
        onShowPreviousModal={() => {
          setShowModalResumePackage(true)
        }}
        onHide={() => {
          setShowModalResumePackage(false)
        }}
      />
    </>
  )
}
