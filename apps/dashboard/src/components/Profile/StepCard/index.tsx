/* eslint-disable @next/next/no-img-element */
import { DateTime } from 'luxon'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useState } from 'react'
import { Button, Card, Col, Row, Table } from 'react-bootstrap'
import { AppContext } from '../../../context/app.ctx'
import { Invoice, Item } from '../../../pages/dashboard/invoices'
import { getStripeJS } from '../../../payment/stripe-js'
import { Plan, SystemProduct } from '../../../types/plan'
import { getProductAndPrice } from '../../../utils/wm-functions'
import { CustomerCardAndSubscriptionsModal } from '../../Payments/CustomerCardModal'
import { useTranslation } from 'react-i18next'

export type CartItem = {
  name: string
  value: number
  service: string
  quantity: number
  quantityDiscount?: number
  image?: string
  invoice_id: number | string
  price_id: string
  product_id: string | number
}

type GenerateCheckout = {
  gateway: 'pagarme' | 'stripe'
  method: string
  success_url: string
  cancel_url?: string
  line_items: any[]
}

export function PaymentCard({
  invoices,
  systemProducts,
  plans,
}: {
  invoices: Invoice[]
  systemProducts: SystemProduct[]
  plans: Plan[]
}) {
  const { t } = useTranslation()
  const router = useRouter()

  const {
    handleConfirmModal,
    handleShowToast,
    gateway,
    user,
    dispatchUser,
    currency,
  } = useContext(AppContext)
  const { data: session } = useSession()
  const [collectCard, setCollectCard] = useState<{
    show: boolean
    review?: boolean
    callback: Function
  }>({
    show: false,
    callback: () => { },
  })

  const [invoicesId] = useState(new Set())
  const [cart, setCart] = useState<CartItem[]>([])
  const userGateway = user?.controls?.paymentInfo?.gateway
  const [installments, setInstallments] = useState<number>(1)

  const addInvoiceToPayment = useCallback(
    (invoice: Invoice) => {
      if (invoice.type !== 'first' && !invoicesId.has(invoice.id)) {
        invoice.itens.forEach((item: any) => {
          if (invoice.type === 'monthly' ? true : item.service !== 'plan') {
            const product = cart.find(
              (product) =>
                product?.service === item.service && item.service !== 'plan'
            )

            if (
              invoices.find(
                (inv) => inv.type === 'first' && inv.status === 'pending'
              ) ||
              product
            ) {
              const current_difference_value =
                (item.value * 100) / (Number(product?.value ?? 0) / 100)
              if (current_difference_value === 100 && product) {
                product.quantity += item.quantity
              }
            } else {
              const newProduct: CartItem = {
                name: item.name,
                value: item.value * 100,
                service: item.service,
                quantity: item.quantity,
                invoice_id: invoice.id,
                price_id: item.price_id,
                product_id: item.id,
                quantityDiscount: item.quantityDiscount,
              }
              cart.push(newProduct)
            }
          }
        })
        invoicesId.add(invoice.id)
        setCart([...cart])
      } else if (invoice.type === 'first') {
        invoicesId.add(invoice.id)
      }
    },
    [cart, invoices, invoicesId]
  )

  const changeCharge = async (
    card_id: string,
    installments: number = 1
  ): Promise<any> => {
    try {
      if (card_id) {
        switch (user?.controls?.paymentInfo?.gateway) {
          case 'pagarme':
            try {
              const { data: newPurchasePagarmeCard } =
                await gateway?.changeChargeCard(card_id, {
                  line_items: generateLineItemsPagarme(),
                  invoices: JSON.stringify(Array.from(invoicesId)),
                  installments,
                })
              if (
                newPurchasePagarmeCard.last_transaction.status === 'with_error'
              ) {
                throw new Error(t('there_failure_transaction'))
              } else {
                if (newPurchasePagarmeCard.last_transaction.acquirer_message) {
                  handleShowToast({
                    title: t('change_card'),
                    content:
                      newPurchasePagarmeCard.last_transaction.acquirer_message,
                    type: newPurchasePagarmeCard.last_transaction.success
                      ? 'success'
                      : 'alert',
                  })

                  if (newPurchasePagarmeCard.last_transaction.success) {
                  }
                }
              }
            } catch (error) {
              const response = (error as any).response
              if (response) {
                handleShowToast({
                  title: t('change_card'),
                  content: (error as any).response.data.error.message,
                  delay: 4000,
                })
              }
            }

            break
          case 'stripe':
            // const newPurchaseStripeCard = await gateway?.changeChargeCard(card_id);
            break
        }
      }
    } catch (error) {
      handleShowToast({
        title: t('change_card'),
        content: t('unable_change_payment_card'),
      })
    }
  }

  const createCheckout = async () => {
    if (session) {
      switch (userGateway) {
        case 'stripe':
          try {
            //Criando uma sessão de pagamento
            const invoicesPending = invoices.filter((inv) =>
              invoicesId.has(inv.id)
            )
            const allAddons =
              invoicesPending.every((inv) => inv.type === 'addon') &&
              invoicesPending.length

            const stripeCheckoutData = generateCheckout({
              gateway: 'stripe',
              method: allAddons ? 'payment' : 'subscription',
              success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/profile`,
              cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/invoices`,
              line_items: generateLineItemsStripe(),
            })

            const { data } = await gateway?.createCheckout(stripeCheckoutData)
            //Carregando SDK de pagamento
            const stripeJS = await getStripeJS()

            //Redirecionando para pagina de pagamento da sessão criada (id)
            stripeJS?.redirectToCheckout({ sessionId: data.id })
          } catch (error) {
            console.error(error)
          }
          break
        case 'pagarme':
          try {
            if (user?.controls?.paymentInfo?.subscription?.id) {
              const pagarmeCheckoutData = generateCheckout({
                gateway: 'pagarme',
                method: 'checkout',
                success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/profile`,
                line_items: generateLineItemsPagarme(),
              })
              const { data } =
                await gateway?.createCheckout(pagarmeCheckoutData)

              handleShowToast({
                title: 'Checkout',
                content: t('redirecting_payment_page'),
              })

              const checkout = data.checkouts[0]

              if (checkout) {
                window.open(checkout.payment_url)
              }
            } else {
              setCollectCard({ show: true, callback: createSubscription })
            }
          } catch (error) {
            console.error(error)
            handleShowToast({
              title: 'Checkout',
              content: t('difficulty_generating_payment_screen'),
            })
          }

          break
        default:
          handleShowToast({
            title: t('payment_gateway'),
            content: t('no_payment_gateway_found'),
          })
      }
    }
  }

  const createSubscription = async <T,>(
    cardId?: string,
    installments?: number
  ): Promise<any> => {
    if (cardId) {
      switch (userGateway) {
        case 'pagarme':
          try {
            handleShowToast({
              title: t('subscription'),
              content: t('adding_your_subscription'),
            })

            const {
              data: { subscription },
            } = await gateway?.createSubscription({
              card_id: cardId,
              items: generateLineItemsPagarme(),
              metadata: {
                invoices: JSON.stringify(Array.from(invoicesId)),
              },
              installments,
            })

            if (!user.controls.paymentInfo) {
              handleShowToast({
                title: t('subscription'),
                content: t('failure_adding_your_subscription'),
              })

              window.location.reload()
              return
            }

            dispatchUser({
              type: 'update',
              payload: {
                controls: {
                  ...user.controls,
                  paymentInfo: {
                    ...user.controls.paymentInfo,
                    subscription,
                  },
                },
              },
            })

            handleShowToast({
              title: t('subscription'),
              content: t('subscription_created_successfully'),
              type: 'success',
            })

            router.push('/dashboard/profile')

            return subscription
          } catch (error) {
            const newError = error as any

            if (newError.response?.data?.code === '400-PF') {
              handleShowToast({
                title: t('subscription'),
                content: newError.response.data.message,
                delay: 10000,
              })

              return
            }

            handleShowToast({
              title: t('subscription'),
              content: t('failure_processing_try_again'),
              delay: 10000,
            })
          }
          break
        case 'stripe':
          const {
            data: { subscription },
          } = await gateway?.createSubscription({
            items: generateLineItemsStripe(),
            card_id: cardId,
          })
      }
    }

    setCollectCard({ show: false, callback: () => { } })
  }

  const disabledPayButtonInvoice = (invoice: Invoice) => {
    if (
      invoicesId.has(invoice.id) &&
      invoices.some((inv) => inv.type !== invoice.type)
    ) {
      return {
        title: t('ongoing_monthly_invoice'),
        disabled: true,
      }
    }

    if (
      user?.controls?.paymentInfo?.subscription?.status === 'canceled' &&
      invoice.type === 'addon'
    ) {
      return {
        title: t('subscription_canceled'),
        disabled: true,
      }
    }
  }

  const generateCheckout = ({
    gateway,
    method,
    success_url,
    cancel_url,
    line_items,
  }: GenerateCheckout) => {
    return {
      line_items,
      payments: [
        {
          method,
          checkout: {
            accepted_payment_methods: ['credit_card', 'debit_card'],
            expires_in: 30,
            success_url: success_url,
            cancel_url: cancel_url,
            default_payment_method: 'credit_card',
            billing_address_id: user?.controls?.paymentInfo?.addressId,
          },
        },
      ],
      invoices: JSON.stringify(Array.from(invoicesId)),
    }
  }

  const generateLineItemsPagarme = () => {
    return cart
      .map((item) => {
        const period = user.controls.period
        const discount = item.service === 'printer' || item.service === 'menu'

        const pagarmePriceId = `${item.service}_${item.product_id}_${item.price_id}`
        const value =
          period === 'yearly' && discount
            ? item.quantity * item.value -
            (item.quantityDiscount ?? 0) * item.value
            : item.quantity * item.value
        return {
          amount: parseInt(value.toString()),
          value: String(parseInt(value.toString())),
          id: pagarmePriceId,
          description: item.name,
          name: item.name,
          quantity: item.quantity,
        }
      })
      .filter((item) => item.amount)
  }

  const generateLineItemsStripe = () => {
    return cart.map((item) => {
      const product = systemProducts.find(
        (prod) => prod.id === Number(item.product_id)
      )
      const { price } = getProductAndPrice({ product, priceId: item.price_id })

      return {
        amount: parseInt(item.value.toString()),
        value: String(parseInt(item.value.toString())),
        id: price?.gateways.stripe.id ?? item.price_id,
        description: item.name,
        name: item.name,
        quantity: item.quantity,
      }
    })
  }

  const getFunctionToContinueButton = () => {
    const subscription = user?.controls?.paymentInfo?.subscription
    const invoicesPending = invoices.filter((inv) => invoicesId.has(inv.id))

    if (invoicesPending.every((inv) => inv.type !== 'addon')) {
      if (!subscription || (subscription && subscription.status !== 'active')) {
        return createSubscription
      }
    }

    return purchaseCard
  }

  const getInvoiceType = (type: any) => {
    switch (type) {
      case 'first':
        return t('required')
      case 'addon':
        return t('additional')
      case 'monthly':
        if (user?.controls?.period === 'monthly') {
          return t('monthly')
        } else if (user?.controls?.period === 'yearly') {
          return t('annual')
        }
        break
      default:
        return t('monthly')
    }
  }

  const getPaymentMethod = async () => {
    try {
      switch (userGateway) {
        case 'pagarme':
          setCollectCard({ show: true, callback: modalHidden })
          break
        case 'stripe':
          await createCheckout()
      }
    } catch (error) {
      console.error(error)
    }
  }

  const purchaseCard = async (
    card_id: string,
    installments: number = 1,
    type: 'credit_card' | 'debit_card' = 'credit_card'
  ) => {
    try {
      const {
        data: { checkout: payment },
      } = await gateway?.chargeAutomatically({
        payments: [
          {
            [type]: {
              card_id,
              installments: installments,
            },
            payment_method: type,
          },
        ],
        invoices: JSON.stringify(Array.from(invoicesId)),
        items: generateLineItemsPagarme(),
        installments,
      })

      if (payment.status !== 'paid') {
        const last_transaction = payment.charges[0].last_transaction

        if (last_transaction && last_transaction.status === 'not_authorized') {
          handleShowToast({
            title: t('payment'),
            content: last_transaction.acquirer_message,
            delay: 3000,
          })

          return
        } else {
          handleShowToast({
            title: t('payment'),
            content: t('message_failure_payment_card'),
            delay: 3000,
          })
          return
        }
      }

      handleShowToast({
        title: t('payment'),
        content: t('payment_completed_successfully'),
        type: 'success',
        delay: 4000,
      })

      setTimeout(() => {
        window.location.reload()
      }, 3000)
    } catch (error) {
      console.error(error)
    }
  }

  const modalHidden = (...props: any): any => {
    setCollectCard({ show: false, callback: () => { } })
  }

  useEffect(() => {
    invoices.forEach((invoice) => {
      if (['first', 'monthly'].includes(invoice.type)) {
        if (!invoicesId.has(invoice.id)) {
          addInvoiceToPayment(invoice)
        }
      }
    })
  }, [invoices, invoicesId, addInvoiceToPayment])

  useEffect(() => {
    const requiredInvoice = invoices.find((inv) => inv.type === 'first')
    if (requiredInvoice) {
      const newItems: Item[] = []

      requiredInvoice.itens.forEach((item) => {
        if (typeof item !== 'string') {
          newItems.push(item)
        }
      })

      setCart(
        newItems
          .map((item) => {
            const product = systemProducts.find(
              (prod) => prod.id === Number(item.id)
            )
            const { price } = getProductAndPrice({
              product,
              priceId: item.price_id,
            })
            if (price && price.id && product) {
              const priceId =
                userGateway === 'stripe' ? price.gateways.stripe.id : price.id

              return {
                name: item.name,
                value: item.value * 100,
                service: item.service,
                quantity: item.quantity,
                quantityDiscount: item.quantityDiscount,
                invoice_id: requiredInvoice.id,
                price_id: priceId,
                product_id: product.id,
              }
            }
          })
          .filter((item) => item) as any[]
      )
    }
  }, [invoices, systemProducts, userGateway])

  useEffect(() => {
    const invoicesInstallments = invoices.filter((invoice) =>
      invoicesId.has(invoice.id)
    )

    const newInstallments = invoicesInstallments.reduce(
      (installment, invoice) => {
        if (invoice.installments && invoice.installments > installment) {
          return invoice.installments
        }

        return installment
      },
      1
    )

    setInstallments(newInstallments)
  }, [invoicesId, invoices])

  return (
    <>
      <Card>
        <Card.Header className="fw-bold fs-5">
          {t('outstanding_invoices')}
        </Card.Header>
        <Card.Body>
          <Table responsive>
            <thead>
              <tr>
                <td>
                  <span>{t('due_date')}</span>
                </td>
                <td>
                  <span>{t('value')}</span>
                </td>
                <td>
                  <span>{t('type')}</span>
                </td>
                <td>
                  <span>{t('items')}</span>
                </td>
                <td>
                  <span>{t('actions')}</span>
                </td>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                return (
                  <tr
                    key={invoice.itens.toString()}
                    style={{
                      backgroundColor: invoicesId.has(invoice.id)
                        ? 'rgba(0, 0, 0, .1'
                        : '',
                    }}
                  >
                    <td>
                      <span>
                        {DateTime.fromJSDate(
                          new Date(invoice.expiration)
                        ).toFormat('dd-MM-yyyy')}
                      </span>
                    </td>
                    <td>
                      <span>{currency({ value: invoice.value })}</span>
                    </td>
                    <td>
                      <span>{getInvoiceType(invoice.type)}</span>
                    </td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => {
                          handleConfirmModal({
                            title: t('items'),
                            message: invoice.itens
                              .map((item: any, index: number, arr: any[]) => {
                                if (invoice.type === 'addon') {
                                  return `<span>${item.name}</span><br/>`
                                } else {
                                  if (typeof item === 'string') {
                                    return `<span>${item}</span>`
                                  } else {
                                    return `<span>${item.name}</span><br/>`
                                  }
                                }
                              })
                              .join(''),
                            alignText: 'start',
                            cancelButton: 'none',
                            confirmButton: t('confirm'),
                          })
                        }}
                      >
                        {t('view_items')}
                      </Button>
                    </td>
                    <td>
                      <Button
                        style={{ whiteSpace: 'break-spaces' }}
                        className="w-100"
                        disabled={disabledPayButtonInvoice(invoice)?.disabled}
                        onClick={() => addInvoiceToPayment(invoice)}
                      >
                        {invoicesId.has(invoice.id)
                          ? t('In Progress')
                          : t('pay')}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <Card>
        <Card.Header className="fw-bold fs-5">
          {t('cart')} -{' '}
          {cart.length ? t('check_items') : t('there_no_items_moment')}
        </Card.Header>
        {cart.length ? (
          <>
            <Card.Body>
              <Row>
                {cart.map((product, index) => {
                  if (product) {
                    const unitValue = Number(product.value) / 100
                    const value =
                      unitValue * product.quantity -
                      unitValue * (product.quantityDiscount ?? 0)
                    return (
                      <Col
                        key={`${product.name}-${index}`}
                        className="d-flex flex-column mb-2"
                        sm="2"
                      >
                        <div className="text-center ">
                          <img
                            className="mx-auto"
                            src={product.image ?? '/images/logoh.png'}
                            alt={product.name}
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              display: 'block',
                            }}
                          />
                        </div>
                        <div className="d-flex flex-column align-items-center flex-grow-1 justify-content-between">
                          <div className="text-center">
                            <h6 className="fw-bold">{product.name}</h6>
                            {/* <p className="fs-7">{product.description}</p> */}
                          </div>
                          <div className="text-center">
                            <span
                              className="fs-7"
                              style={{
                                textDecoration: product.quantityDiscount
                                  ? 'line-through'
                                  : '',
                              }}
                            >
                              {product.quantity}X{' '}
                              {currency({ value: unitValue })}
                            </span>
                            <br />
                            <span className="fs-6 fw-bold">
                              {currency({ value })}
                            </span>
                            {product.service !== 'plan' ? (
                              <span>/{t('unique')}</span>
                            ) : (
                              <span>
                                /
                                {user?.controls?.period === 'monthly'
                                  ? t('month')
                                  : t('year')}
                              </span>
                            )}
                          </div>
                        </div>
                      </Col>
                    )
                  }
                })}
              </Row>
              <hr />
              <Row className="mt-3">
                <Col>
                  <p>
                    {t('hello')}, <b>{user?.name}</b>{' '}
                    {t('after_payment_confirmation')}
                  </p>
                </Col>
              </Row>
            </Card.Body>
            <Card.Footer className="d-flex flex-column flex-md-row gap-2">
              <Button onClick={getPaymentMethod}>{t('proceed_payment')}</Button>
              {/* {
                                    (user?.controls?.paymentInfo?.subscription?.id) &&
                                    (userGateway !== "stripe") &&
                                    <Form.Select
                                     onChange={(e) => { setPaymentMethod(e.target.value as "checkout" | "card") }}>
                                        <option value="card" selected>Cartão - Cobrar diretamente no cartão</option>
                                        <option value="checkout">Checkout - Abrir uma pagina de pagamento</option>
                                    </Form.Select>
                                } */}
            </Card.Footer>
          </>
        ) : null}
      </Card>
      <CustomerCardAndSubscriptionsModal
        review={collectCard.review}
        show={collectCard.show}
        onHide={modalHidden}
        cardDetailsProps={{
          installments,
          continueButtonFunction: getFunctionToContinueButton(),
        }}
      />
    </>
  )
}
