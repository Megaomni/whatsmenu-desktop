import { DateTime } from 'luxon'
import React, {
  Dispatch,
  LegacyRef,
  SetStateAction,
  useContext,
  useEffect,
} from 'react'
import { AppContext } from '../../../../context/app.ctx'
import Cart from '../../../../types/cart'
import Command from '../../../../types/command'
import Table, { TableOpened } from '../../../../types/table'
import Bartender from '../../../../types/bartender'
import { useSession } from 'next-auth/react'
import Profile from '../../../../types/profile'
import { groupCart, hash, textPackage } from '../../../../utils/wm-functions'
import { useTranslation } from 'react-i18next'

export type PropsType = {
  profile?: Profile
  appPrint?: boolean
  cart: Cart
  carts: Cart[]
  copiesTimes?: string[]
  componentRef?: LegacyRef<HTMLDivElement | HTMLTableElement>
  classBold?: string
  fontSize?: 6 | 7 | 8 | number
  paperSize?: number
  margin?: number
  groupItems: boolean
  style?: React.CSSProperties
  className?: string
  autoPrint?: () => void
  type?: 'command' | 'table' | 'D' | 'P' | 'T'
  report?: boolean
  table?: Table
  opened?: TableOpened
  command?: Command | null
  bartender?: Bartender | null
  wsPrinting?: boolean
  titleTable?: string
  setDoor: Dispatch<SetStateAction<boolean>>
}

export function TextOnly({
  carts,
  componentRef,
  autoPrint,
  report,
  titleTable,
  command,
  table,
  opened,
  ...props
}: PropsType) {
  const { t } = useTranslation()
  const {
    profile: profileContext,
    getBartender,
    user,
    currency,
  } = useContext(AppContext)
  const cart = carts[0]
  const profile = profileContext ?? props.profile

  let subTotal = 0,
    total = 0,
    transshipment = 0,
    lack = 0,
    paid = 0

  const underlineSeparator = new Array(props.paperSize === 58 ? 32 : 48)
    .fill('-')
    .join('')

  const line = new Array(props.paperSize === 58 ? 32 : 48)
    .fill('\u00A0')
    .join('')

  subTotal = carts.reduce(
    (subTotal, c) => subTotal + c.getTotalValue('subtotal'),
    0
  )

  total = carts.reduce((total, c) => total + c.getTotalValue('total'), 0)

  transshipment = carts.reduce((total, c) => total + c.transshipment(), 0)

  if (props.type === 'command' && command) {
    subTotal = command.getTotalValue('command')
    total = command.getTotalValue('commandFee')
    lack = command.getTotalValue('lack')
    paid = command.getTotalValue('paid')
  } else if (props.type === 'table' && table) {
    subTotal = (opened ?? table.opened)?.getTotalValue('table') || 0
    total = (opened ?? table.opened)?.getTotalValue('tableFee') || 0
    lack = (opened ?? table.opened)?.getTotalValue('lack') || 0
    paid = (opened ?? table.opened)?.getTotalValue('paid', 0, report) || 0
  } else {
    subTotal = cart?.getTotalValue('subtotal') || 0
  }

  const centerText = (txt?: string) => {
    if (txt) {
      while (txt.length < (props.paperSize === 58 ? 28 : 35)) {
        txt = `\u00A0 ${txt} \u00A0`
      }
    }
    return txt
  }

  const rightText = (
    txt = '',
    spaces: string | number = '',
    parentheses = false
  ) => {
    txt = parentheses ? `(${txt})` : txt
    while (
      txt.length + (typeof spaces === 'number' ? spaces : spaces.length) <
      (props.paperSize === 58 ? 28 : 35)
    ) {
      txt = `\u00A0 ${txt}`
    }
    return txt
  }

  useEffect(() => {
    setTimeout(() => {
      const sessionRequests: number[] = JSON.parse(
        sessionStorage.getItem('printedQueue') as string
      )

      if (carts.length && autoPrint) {
        if (!sessionRequests) {
          sessionStorage.setItem('printedQueue', `[${carts[0].id}]`)
          autoPrint()
        } else {
          // if (!sessionRequests.includes(carts[0].id)) {
          //   sessionRequests.push(carts[0].id);
          //   sessionStorage.setItem("printedQueue", JSON.stringify(sessionRequests));
          // autoPrint();
          // }
        }
      }
    }, 10)
  }, [carts, autoPrint])

  const $cartsRequests = (cart: Cart) => {
    const cartItems = groupCart(cart, profile.options.print?.groupItems)

    return (
      <>
        {cartItems?.map((prod, indexProd) => {
          return (
            <div key={hash()}>
              {indexProd !== 0
                ? props.appPrint
                  ? '[underlineSeparator]\n'
                  : underlineSeparator
                : null}
              <div>
                <p className="fs-6 m-0 text-wrap">
                  {prod.quantity}X | {prod.name}{' '}
                  {prod.getTotal() > 0 ? (
                    <span className="m-0 ">
                      (
                      {currency({
                        value: prod.getTotal(true),
                        withoutSymbol: true,
                      })}
                      )
                    </span>
                  ) : null}
                  {props.appPrint ? '\n' : null}
                </p>
                <div className="ps-2">
                  {prod.details.complements?.map((complement) => {
                    return (
                      <div className="m-0 p-0" key={hash()}>
                        <p className="fw-boldtest m-0">
                          {` \u00A0${complement.name}`}
                          {props.appPrint ? '\n' : null}
                        </p>
                        {complement.itens?.map((item) => {
                          return (
                            <div key={hash()}>
                              <span className="text-wrap">
                                <span className="fw-boldtest">{` \u00A0\u00A0\u00A0${item.quantity}X `}</span>
                                <span>{item.name}</span>
                                <span>
                                  {item.value > 0
                                    ? ` (${currency({
                                        value: item.value,
                                        withoutSymbol: true,
                                      })})`
                                    : null}
                                </span>
                              </span>
                              {props.appPrint ? '\n' : null}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
                {prod.obs ? (
                  <p className="m-0">
                    {' '}
                    <span className="fw-boldtest">Obs: </span> {prod.obs}{' '}
                    {props.appPrint ? '\n' : null}
                  </p>
                ) : null}
                <div className="m-0">
                  {'\u2000\u2000\u2000'}
                  {rightText(
                    currency({
                      value: prod.getTotal(),
                      withoutSymbol: true,
                    }),
                    ''
                  )}
                  {props.appPrint ? '\n' : null}
                </div>
              </div>
            </div>
          )
        })}
      </>
    )
  }

  const content = (
    <>
      <>
        <h3 className="fs-5 fw-boldtest">
          {centerText(titleTable ? titleTable : profile?.name.normalize())}
          {props.appPrint ? '\n\n\n' : null}
        </h3>
        <br />
        {carts?.map((cart, index) => {
          let bartender: Bartender | undefined = undefined
          if (cart.bartenderId) {
            bartender = getBartender(cart.bartenderId)
          }

          const created_at = DateTime.fromSQL(cart.created_at)
            .setZone('America/Sao_Paulo', { keepLocalTime: true })
            .toSQL()

          return (
            <div key={cart.id}>
              {index === 0 ? (
                <>
                  <div key={cart.id}>
                    {DateTime.fromSQL(created_at, {
                      zone: profile.timeZone,
                    }).toFormat(`${t('date_format')} HH:mm:ss`)}
                    {props.appPrint ? '\n' : null}
                  </div>
                  {props.type !== 'command' && props.type !== 'table' && (
                    <div>
                      <span className={`fw-boldtest`}>{t('order')}: </span>
                      <span>{`wm${cart.code}-${cart.getTextTypeReq()}`}</span>
                      <span className="fw-boldtest">
                        {cart.status === 'canceled'
                          ? ` ${t('cancelled_up')}`
                          : null}
                      </span>
                      {props.appPrint ? '\n' : null}
                    </div>
                  )}
                  <div>
                    {cart.type === 'T' && (
                      <>
                        <span className="fw-boldtest">{t('table')}: </span>
                        <span>
                          {table?.deleted_at
                            ? table?.name.replace(
                                table?.name.substring(table?.name.length - 25),
                                ` ${t('disabled')}`
                              )
                            : table?.name}
                          {props.appPrint ? '\n' : null}
                        </span>
                      </>
                    )}
                  </div>
                  {props.type !== 'table' && (
                    <div>
                      <span className="fw-boldtest">
                        {props.type === 'command' || props.type === 'T'
                          ? t('order_slip')
                          : t('client')}
                        :&nbsp;
                      </span>
                      <span>{cart.client?.name}</span>
                      {props.appPrint ? '\n' : null}
                    </div>
                  )}

                  {cart.type === 'T' &&
                    props.type !== 'command' &&
                    props.type !== 'table' &&
                    bartender && (
                      <div>
                        <span className="fw-boldtest">
                          {t('waiter')}:&nbsp;
                        </span>
                        <span>
                          {bartender.deleted_at
                            ? bartender.name.replace(
                                bartender.name.substring(
                                  bartender.name.length - 19
                                ),
                                ` ${t('disabled')}`
                              )
                            : bartender.name}
                        </span>
                        {props.appPrint ? '\n' : null}
                      </div>
                    )}

                  {cart.type === 'P' && (
                    <div>
                      <div>
                        <span className="fw-boldtest">
                          {t('delivery_date')}:{' '}
                        </span>
                        <span>{`${cart.date().formatted}`}</span>
                        {props.appPrint ? '\n' : null}
                      </div>
                    </div>
                  )}
                  {cart.type !== 'T' && (
                    <div className="">
                      <span className="fw-boldtest">Tel: </span>
                      <span>{cart.returnMaskedContact()}</span>
                      {props.appPrint ? '\n' : null}
                    </div>
                  )}
                  {props.type === 'table' && (
                    <div className="">
                      <span className="fw-boldtest">{t('duration')}: </span>
                      <span className={`${props.paperSize === 58 && 'fs-8'}`}>
                        {DateTime.fromSQL(
                          (table?.opened || opened)?.created_at as string
                        ).toFormat('HH:mm')}
                        /
                        {report
                          ? DateTime.fromSQL(
                              (table?.opened || opened)?.updated_at as string
                            ).toFormat('HH:mm')
                          : DateTime.local().toFormat('HH:mm')}{' '}
                        -{' '}
                        {report
                          ? (table?.opened || opened)?.perm
                          : DateTime.local()
                              .diff(
                                DateTime.fromSQL(
                                  (table?.opened || opened)
                                    ?.created_at as string
                                ),
                                'seconds'
                              )
                              .toFormat("hh'h'mm")}
                      </span>
                      {props.appPrint ? '\n' : null}
                    </div>
                  )}
                  <div>
                    {props.appPrint
                      ? '[underlineSeparator]\n'
                      : underlineSeparator}
                  </div>
                </>
              ) : null}
              {(props.type === 'command' || props.type === 'table') && (
                <div>
                  <span className={`fw-boldtest`}>Pedido: </span>
                  <span>{`wm${cart.code}-${cart.getTextTypeReq()}`}</span>
                  <span className="fw-boldtest">
                    {cart.status === 'canceled'
                      ? ` ${t('cancelled_up')}`
                      : null}
                  </span>
                  {props.appPrint ? '\n' : null}
                </div>
              )}
              {$cartsRequests(cart)}
              {index + 1 < carts.length &&
                (props.appPrint
                  ? '[underlineSeparator]\n'
                  : underlineSeparator)}
            </div>
          )
        })}
      </>
      <div>
        {/* Taxas */}
        {
          <>
            {(props.type === 'command' || props.type === 'table') &&
            (props.type === 'command'
              ? command?.fees
              : (opened ?? table?.opened)?.getUpdatedFees(!report, true)
            )?.filter((fee) => fee.deleted_at === null).length
              ? props.appPrint
                ? '[underlineSeparator]\n'
                : underlineSeparator
              : null}
            {(props.type === 'command' || props.type === 'table') &&
              (props.type === 'command'
                ? command?.fees
                : (opened ?? table?.opened)?.getUpdatedFees(!report, true)
              )
                ?.filter((fee) => fee.deleted_at === null)
                .map((fee, index, arr) => {
                  return fee.status && fee.automatic ? (
                    <div key={fee.code}>
                      <div
                        className={`${index === 0 && 'pt-1'} ${index === arr.length - 1 && 'pb-1'}`}
                      >
                        <span>{fee.code}</span>
                        <span>
                          {rightText(
                            currency({
                              value:
                                fee.type === 'fixed' && fee.quantity
                                  ? fee.value * fee.quantity
                                  : (fee.value / 100) *
                                    (props.type === 'command'
                                      ? command?.getTotalValue('command') || 0
                                      : (
                                          opened ?? table?.opened
                                        )?.getTotalValue('table') || 0),
                              withoutSymbol: true,
                            }),
                            fee.code ?? ''
                          )}
                        </span>
                      </div>
                    </div>
                  ) : null
                })}
          </>
        }
        {props.appPrint ? '\n' : null}
      </div>
      <div>
        {/* Comandas */}
        {props.type === 'table' && (
          <>
            {props.appPrint ? '[underlineSeparator]\n' : underlineSeparator}
            {(opened ?? table?.opened)?.commands
              .filter((c) => c.haveCarts())
              .map((commandMap, index, arr) => {
                return (
                  <div key={commandMap.code}>
                    <div
                      className={`${index === 0 && 'pt-1'} ${index === arr.length - 1 && 'pb-1'}`}
                    >
                      <span>
                        {!commandMap.status
                          ? `${commandMap.name}\u2000\u2000\u2000(PAGO)`
                          : commandMap.name}
                      </span>
                      <span>
                        {rightText(
                          currency({
                            value: commandMap.getTotalValue('command'),
                            withoutSymbol: true,
                          }),
                          !commandMap.status
                            ? `${commandMap.name}\u2000\u2000\u2000(PAGO)`
                            : commandMap.name
                        )}
                      </span>
                    </div>
                  </div>
                )
              })}
            {props.appPrint ? '\n' : null}
          </>
        )}
      </div>
      <div>
        {cart?.cupomId && (
          <div className="pt-1">
            <span className="fw-boldtest">{t('coupon_used')}: </span>
            <span>{rightText(cart.cupom?.code, t('coupon_used'))}</span>
            {props.appPrint ? '\n' : null}
          </div>
        )}
        <div className="pt-1">
          <div>
            {props.appPrint ? '[underlineSeparator]\n' : underlineSeparator}
          </div>
          <span className="fw-boldtest">Sub-Total:{'\u2000\u2000\u2000'}</span>
          <span>
            {rightText(
              currency({ value: subTotal, withoutSymbol: true }),
              'Sub-Total:'
            )}
          </span>
          {props.appPrint ? '\n' : null}
        </div>
        {carts[0]?.address && carts[0].cupom?.type !== 'freight' && (
          <div>
            <span className="fw-boldtest">
              {t('delivery_fee')}:{'\u2000\u2000\u2000\u2000\u2000\u2000'}
            </span>
            <span>
              {rightText(
                carts[0].taxDelivery > 0
                  ? currency({
                      value: carts[0].taxDelivery,
                      withoutSymbol: true,
                    })
                  : t('free'),
                t('delivery_fee')
              )}
            </span>
            {props.appPrint ? '\n' : null}
          </div>
        )}
        {carts[0]?.cupomId && (
          <div>
            <span className="fw-boldtest">{t('coupon')}: </span>
            <span>
              {rightText(
                carts[0].cupom?.type !== 'freight'
                  ? `-${currency({
                      value: Number(
                        carts[0].cupom?.type === 'percent'
                          ? (subTotal / 100) *
                              Number(carts[0].cupom?.value ?? 0)
                          : (carts[0].cupom?.value ?? 0)
                      ),
                      withoutSymbol: true,
                    })}`
                  : t('fee_shipping')
              )}
            </span>
            {props.appPrint ? '\n' : null}
          </div>
        )}

        <div>
          <span className="fw-boldtest">Total:{'\u2000\u2000\u00A0'}</span>
          <span>
            {rightText(
              currency({ value: total, withoutSymbol: true }),
              'Total:'
            )}
          </span>
          {props.appPrint ? '\n' : null}
        </div>

        {transshipment > 0 ? (
          <>
            <div>
              <span className="fw-boldtest">
                {t('change_for')}:{'\u2000\u2000\u00A0'}
              </span>
              <span>
                {rightText(
                  currency({ value: transshipment, withoutSymbol: true }),
                  `${t('change_for')}:`
                )}
              </span>
              {props.appPrint ? '\n' : null}
            </div>
            <div>
              <span className="fw-boldtest">
                {t('change')}:{'\u2000\u2000\u00A0'}
              </span>
              <span>
                {rightText(
                  currency({
                    value: Math.max(transshipment - total, 0),
                    withoutSymbol: true,
                  }),
                  `${t('change')}:`
                )}
              </span>
              {props.appPrint ? '\n' : null}
            </div>
          </>
        ) : null}

        {carts[0]?.type === 'T' &&
          (props.type === 'command' || props.type === 'table') && (
            <div>
              <div>
                <span className="fw-boldtest">
                  {t('paid')}:{'\u2000\u2000'}
                </span>
                <span>
                  {rightText(
                    currency({ value: paid, withoutSymbol: true }),
                    t('paid')
                  )}
                </span>
                {props.appPrint ? '\n' : null}
              </div>
              {(props.type === 'command'
                ? command?.formsPayment
                : (opened ?? table?.opened)?.formsPayment
              )?.map((formPayment) => (
                <p className="m-0" key={hash()}>
                  <span className="fw-boldtest">{`\u2000\u2000Em ${formPayment.label}`}</span>
                  <span>
                    {rightText(
                      currency({
                        value: formPayment.value,
                        withoutSymbol: true,
                      }),
                      '\u2000\u2000Em\u2000\u2000\u2000\u2000\u2000\u2000'
                    )}
                    {formPayment.change ? (
                      <p className="m-0">
                        <span>{`\u2000\u2000Troco`}</span>
                        {rightText(
                          currency({
                            value: formPayment.change - formPayment.value,
                            withoutSymbol: true,
                          }),
                          '\u2000\u2000Troco\u2000\u2000\u2000\u2000\u2000\u2000'
                        )}
                      </p>
                    ) : null}
                  </span>
                  {props.appPrint ? '\n' : null}
                </p>
              ))}
            </div>
          )}
        {carts[0]?.type === 'T' &&
          (props.type === 'command' || props.type === 'table') && (
            <div>
              <span className="fw-boldtest">Faltam:{'\u2000\u2000'}</span>
              <span>
                {rightText(
                  currency({ value: lack, withoutSymbol: true }),
                  'Faltam:'
                )}
              </span>
            </div>
          )}
        {carts[0]?.type !== 'T' && (
          <div>
            <span className="fw-boldtest">
              {t('payment_in')}:{'\u2000\u2000\u2000'}
            </span>
            <span className="text-wrap">
              {/* {rightText(
                `${carts[0]?.formPayment} ${carts[0]?.formPayment !== "Dinheiro"
                  ? `${carts[0]?.formPaymentFlag !== "-" ? `(${carts[0]?.formPaymentFlag})` : ""}`
                  : ""
                }`,
                "Pagamento em:"
              )} */}
              {props.appPrint ? '\n' : null}
            </span>
          </div>
        )}
        <>
          {props.appPrint ? '[underlineSeparator]\n' : underlineSeparator}
          <div>{line}</div>
          {cart?.address && (
            <div className="pt-1 text-start">
              <p className="m-0 p-0">
                {cart.address.street}, {props.appPrint ? '\n' : null}
              </p>
              <p className="m-0 p-0">
                {cart.address?.number}
                {props.appPrint ? '\n' : null}
                {cart.address?.complement}
                {props.appPrint && cart.address?.complement ? '\n' : null}
              </p>
              <p className="m-0 p-0">
                {cart.address?.neighborhood} - {cart.address?.city}
                {props.appPrint ? '\n' : null}
              </p>
              <p className="m-0 p-0">
                {cart.address?.reference}
                {props.appPrint && cart.address?.reference ? '\n' : null}
              </p>
              {props.appPrint ? '[underlineSeparator]\n' : underlineSeparator}
            </div>
          )}
          <div>
            <br />
            {props.appPrint ? '\n' : null}
            <span className="fs-7 fw-boldtest  w-100">
              {carts &&
                centerText(
                  carts[0]?.typeDeliveryText(
                    textPackage(profile.options.package.label2),
                    true
                  )
                )}
            </span>
            {props.appPrint ? '\n' : null}
          </div>
          <div className="fs-7 fw-boldtest  w-100">
            {carts[0]?.type === 'P'
              ? centerText(`**${textPackage(profile.options.package.label2)}**`)
              : null}
          </div>
          <div>
            <span className="fs-7">{centerText('Tecnologia')}</span>
            {props.appPrint ? '\n' : null}
          </div>
          <div>
            <span className="fs-7">{centerText('www.whatsmenu.com.br')}</span>
            {props.appPrint ? '\n' : null}
          </div>
          <br />
        </>
      </div>
    </>
  )

  return (
    <div ref={componentRef} style={{ width: `${72}mm`, margin: 'auto' }}>
      {(props.appPrint ?? window.innerWidth > 768) ? (
        content
      ) : (
        <>{props.copiesTimes?.map((c) => <div key={hash()}>{content}</div>)}</>
      )}
    </div>
  )
}
