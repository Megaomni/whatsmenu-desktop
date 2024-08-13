import React, { useContext, useState } from 'react'
import { Button, Row, Col, Modal, ListGroup } from 'react-bootstrap'
import { AppContext } from '../../../../../context/app.ctx'
import { getNow, groupCart, hash } from '../../../../../utils/wm-functions'
import Request, {
  CartPizza,
  PizzaCart,
  ProductCart,
} from '../../../../../types/request'
import Cart from '../../../../../types/cart'
import CartItem from '../../../../../types/cart-item'
import { useTranslation } from 'react-i18next'

type DistribuitionState = {
  requestTarget: any
  listItemTarget: HTMLElement | null
}

type PropsType = {
  show?: boolean
  carts: Cart[]
  onReturnModal: () => void
  onHide: () => void
}

export function DistribuitionPackage({
  carts,
  onReturnModal,
  ...props
}: PropsType) {
  const { currency } = useContext(AppContext)
  const { t } = useTranslation()
  const cartsOnlyDate = carts.filter(
    (cart) =>
      cart.date().onlyDate === getNow({ format: t('date_format') }).nowFormat
  )
  const [cartSelected, setCartSelected] = useState<Cart | null>(null)
  const [distribuitionStates, setDistribuitionStates] =
    useState<DistribuitionState>({
      requestTarget: null,
      listItemTarget: null,
    })

  const onPointerOverList = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    target?.dataset.type === 'list-item' &&
      target?.classList.add('wm-green-day')
    distribuitionStates?.listItemTarget?.classList.add('wm-green-day')
  }

  const onPointerOutList = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (distribuitionStates?.listItemTarget !== target) {
      target?.dataset.type === 'list-item' &&
        target?.classList.remove('wm-green-day')
    }
  }

  const onPointerDownList = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target?.dataset.type === 'list-item') {
      if (distribuitionStates?.listItemTarget !== target) {
        distribuitionStates?.listItemTarget?.classList.remove('wm-green-day')
        setDistribuitionStates({
          ...distribuitionStates,
          requestTarget: true,
          listItemTarget: target,
        })
      } else {
        setDistribuitionStates({
          ...distribuitionStates,
          requestTarget: null,
          listItemTarget: null,
        })
        setTimeout(() => {
          setCartSelected(null)
        }, 200)
      }
    }
  }

  const groupedCart = groupCart(cartSelected)

  const $cart = () => {
    return groupedCart
      .filter((cart) => cart.type === 'default')
      .map((prod, indexProd, arrProd) => {
        return (
          <>
            <div
              className={`fs-7 cart-container fw-${''}`}
              key={hash()}
              style={{
                borderBottom:
                  indexProd < arrProd.length - 1 ? '1px dashed ' : '',
              }}
            >
              <div className="my-2">
                <p className="product-name m-0">
                  {prod.quantity}X | {prod.name}
                </p>
                {/* <p className="m-0 ">
                  (
                  {currency(prod.value)}
                  )
                </p> */}
                <div className="my-1 ps-2">
                  {prod.details.complements?.map((complement) => {
                    return (
                      <>
                        <div className="m-0 p-0" key={hash()}>
                          <p className="fw-bold complement-name m-0">
                            {complement.name}
                          </p>
                          {complement.itens?.map((item) => {
                            return (
                              <Row key={hash()} className="complement-item">
                                <Col sm="8">
                                  <div className="mt-1 ps-3">
                                    <span>
                                      <span className="fw-bold">
                                        {item.quantity}X{' '}
                                      </span>
                                      {item.name}
                                    </span>
                                  </div>
                                </Col>
                                {/* <Col sm="4" className="px-0">
                                  (
                                  {currency(item.value)}
                                  )
                                </Col> */}
                              </Row>
                            )
                          })}
                        </div>
                      </>
                    )
                  })}
                </div>

                {/* <p className="m-0 mt-2  text-center">
                  (
                  {currency(Request.calcValueProduct(prod, type))}
                  )
                </p> */}
              </div>
            </div>
          </>
        )
      })
  }

  const $cartPizza = () => {
    return groupedCart
      ?.filter((pizza) => pizza.type === 'pizza')
      .map((pizza, indexPizza, arrPizza) => {
        return (
          <>
            <div
              className={`fs-7 cartPizza-container fw-${''}`}
              key={hash()}
              style={{
                borderBottom:
                  indexPizza < arrPizza.length - 1 ? '1px dashed' : '',
              }}
            >
              <div className="w-100 py-1">
                <p className="text-uppercase m-0 ">
                  {`${pizza.quantity}x | ${pizza.name}
                  }`}
                </p>

                {/* <p className="m-0">
                {`(${currency(pizza.value))})`}
              </p> */}

                <div className="flavor-name my-1">
                  {pizza.details.flavors?.map((flavor) => {
                    return (
                      <p key={hash()} className="m-0 ps-2">
                        <span className="ps-3">{flavor.name}</span>
                      </p>
                    )
                  })}
                </div>

                {pizza.details?.implementations.map((implementation) => {
                  return (
                    <div key={hash()} className="fw-bold fs-8 w-100` m-0 my-1">
                      <Row className="w-100">
                        <Col sm="12">{implementation.name}</Col>
                        {/* <Col sm="4">
                        (
                        {currency(implementation.value)}
                        )
                      </Col> */}
                      </Row>
                    </div>
                  )
                })}

                {pizza.obs ? (
                  <p className="m-0">
                    {' '}
                    <span className="fw-bold">Obs:</span> {pizza.obs}{' '}
                  </p>
                ) : null}

                {/* <p className="m-0 my-1 text-center">
                {`(${currency(pizza.value)})`}
              </p> */}
              </div>
            </div>
          </>
        )
      })
  }

  return (
    <>
      <Modal {...props} size="lg" centered scrollable>
        <Modal.Header className="justify-content-center">
          <Modal.Title>
            <h3>
              {' '}
              {t('distribution')} -{' '}
              <span>{getNow({ format: t('date_format') }).nowFormat}</span>
            </h3>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="my-0 py-0">
          <Row
            style={{ minHeight: '70vh' }}
            className="flex-column flex-md-row"
          >
            <Col
              sm="12"
              md="6"
              className="border-end overflow-auto py-2"
              style={{ maxHeight: window.innerWidth < 768 ? '30vh' : 'unset' }}
            >
              <h6 className="text-center">{t('order_coder')}</h6>
              <div>
                <ListGroup
                  onPointerDown={onPointerDownList}
                  onPointerOver={onPointerOverList}
                  onPointerOut={onPointerOutList}
                >
                  {cartsOnlyDate?.map((cart) => {
                    return (
                      <ListGroup.Item
                        key={cart.code}
                        data-type="list-item"
                        className={`cursor-pointer ${cart.status === 'canceled' ? 'wm-request-canceled' : ''}`}
                        onClick={() => {
                          setCartSelected(new Cart(cart))
                        }}
                      >
                        {`wm${cart.code}-${cart.type} ${cart.client?.name} ${cart.status === 'canceled' ? t('cancelled_o') : ''}`}
                      </ListGroup.Item>
                    )
                  })}
                </ListGroup>
              </div>
            </Col>
            <Col
              sm="12"
              md="6"
              className="border-end flex-grow-1 flex-md-grow-0 py-2"
            >
              <h6 className="text-center">
                {cartSelected
                  ? `wm${cartSelected.code}-${cartSelected.type} ${cartSelected.status === 'canceled' ? t('cancelled_o') : ''}`
                  : t('no_order_selected')}
              </h6>
              <div className="overflow-auto px-0" style={{ maxHeight: '60vh' }}>
                {distribuitionStates.requestTarget && (
                  <>
                    {$cart()}
                    {$cartPizza()}
                  </>
                )}
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={() => {
              setDistribuitionStates({
                ...distribuitionStates,
                requestTarget: null,
                listItemTarget: null,
              })
              setCartSelected(null)
              onReturnModal()
            }}
            variant="success"
          >
            <span className="align-middle">{t('go_back')}</span>
          </Button>
          <Button
            onClick={() => {
              setDistribuitionStates({
                ...distribuitionStates,
                requestTarget: null,
                listItemTarget: null,
              })
              setCartSelected(null)
              props.onHide()
            }}
            variant="danger"
          >
            <span>{t('close')}</span>
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
