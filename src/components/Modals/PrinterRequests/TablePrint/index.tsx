import { DateTime } from 'luxon'
import React, { Dispatch, LegacyRef, SetStateAction, useContext, useEffect } from 'react'
import { AppContext } from '../../../../context/app.ctx'
import Bartender from '../../../../types/bartender'
import Cart from '../../../../types/cart'
import Command from '../../../../types/command'
import Table, { TableOpened } from '../../../../types/table'
import { groupCart, hash, textPackage } from '../../../../utils/wm-functions'
import { useSession } from 'next-auth/react'
import { useTranslation } from 'react-i18next'

type PropsType = {
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
  titleTable?: string
  wsPrinting?: boolean
  setDoor: Dispatch<SetStateAction<boolean>>
}

export function TablePrinter({ carts, componentRef, report, titleTable, command, table, opened, autoPrint, setDoor, ...props }: PropsType) {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const { profile, getBartender, printStart, user, currency } = useContext(AppContext)
  const cart = carts[0]

  let subTotal = 0,
    total = 0,
    transshipment = 0,
    lack = 0,
    paid = 0

  subTotal = carts.reduce((subTotal, cart) => subTotal + cart.getTotalValue('subtotal'), 0)
  paid = cart?.getTotalValue('total') || 0

  total = carts.reduce((total, cart) => total + cart.getTotalValue('total'), 0)
  transshipment = carts.reduce((total, cart) => total + cart.transshipment(), 0)

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

  useEffect(() => {
    setTimeout(() => {
      if (carts.length && autoPrint) {
        const sessionRequests = JSON.parse(sessionStorage.getItem('printedQueue') as string)

        if (!sessionRequests) {
          sessionStorage.setItem('printedQueue', `[${carts[0].id}]`)
          return autoPrint()
        } else {
          // if (!sessioncartsincludes(carts[0].id)) {
          //   sessionCartsPush(carts[0].id);
          //   sessionStorage.setItem("printedQueue", JSON.stringify(sessionRequests));
          //   return autoPrint();
          // }
        }
      }
    }, 10)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carts, autoPrint])

  const $cartsRequests = (cart: Cart) => {
    const groupedCart = groupCart(cart, profile.options.print?.groupItems)
    return (
      <>
        {groupedCart?.map((prod) => {
          return (
            <tr key={hash()}>
              <td>
                <div className="mytest-2 underlineSeparator">
                  <p className="m-0 text-wrap">
                    {prod.quantity}X | {prod.name}{' '}
                    {prod.details.value > 0 ? (
                      <span className="m-0 ">({`${currency({ value: prod.getTotal(true), withoutSymbol: true })}`})</span>
                    ) : null}
                  </p>
                  <div className="ps-2 mytest-1">
                    {prod.details.complements?.map((complement) => {
                      return (
                        <div className="m-0 mt-2 p-0" key={hash()}>
                          <p className="m-0 fw-bold">{` \u00A0${complement.name}`}</p>
                          {complement.itens?.map((item) => {
                            return (
                              <div key={hash()} className="row-print clearfix">
                                <div className="col-print-lt">
                                  <div className="ps-1 mt-1">
                                    <span className="text-wrap">
                                      <span className="fw-bold">{` \u00A0\u00A0\u00A0${item.quantity}`}X </span>
                                      {item.name}{' '}
                                      {item.value > 0
                                        ? `(${currency({
                                            value: item.value,
                                            withoutSymbol: true,
                                          })})`
                                        : null}
                                    </span>
                                  </div>
                                </div>
                                {/* <div className={`col-print-rt ${ props.paperSize === 58 ? "me-4" : "" }`}>
                                  {item.value > 0 ? `(${parseFloat(item.value)})` : null}
                                </div> */}
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
                      <span className="fw-bold">Obs: </span> {prod.obs}{' '}
                    </p>
                  ) : null}
                  <p className="m-0 mx-2 text-end">
                    {currency({
                      value: prod.getTotal(),
                      withoutSymbol: true,
                    })}
                  </p>
                </div>
              </td>
            </tr>
          )
        })}
      </>
    )
  }

  const $requests = carts?.map((cart, indexReq, arr) => {
    let bartender: Bartender | undefined = undefined
    if (cart.bartenderId) {
      bartender = getBartender(cart.bartenderId)
    }

    const created_at = DateTime.fromSQL(cart.created_at).setZone('America/Sao_Paulo', { keepLocalTime: true }).toSQL()

    return (
      <tbody key={cart.code}>
        <tr>
          <td className={`${indexReq > 0 && 'py-1'}`}>
            <div>
              {indexReq === 0 && (
                <>
                  <p className="m-0">{DateTime.fromSQL(created_at, { zone: profile.timeZone }).toFormat(`${t('date_format')} HH:mm:ss`)}</p>
                  {props.type !== 'command' && props.type !== 'table' && (
                    <p className="m-0">
                      <span className={`fw-bold`}>{t('order')}: </span>
                      {`wm${cart.code}-${cart.getTextTypeReq()}`}
                      <span className="fw-bold">{cart.status === 'canceled' ? ` ${t('cancelled_up')}` : null}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
        {indexReq === 0 ? (
          <>
            {cart.type === 'T' && (
              <tr>
                <td>
                  <span className="fw-bold">{t('table')}: </span>
                  <span>
                    {table?.deleted_at ? table?.name.replace(table?.name.substring(table?.name.length - 25), ` ${t('disabled')}`) : table?.name}
                  </span>
                </td>
              </tr>
            )}
            {props.type !== 'table' && (
              <tr>
                <td>
                  <span className="fw-bold">{props.type === 'command' || props.type === 'T' ? t('order_slip') : t('client')}:&nbsp;</span>
                  <span>{(cart.type === 'T' ? cart.command : cart.client)?.name}</span>
                </td>
              </tr>
            )}

            {cart.type === 'T' && props.type !== 'command' && props.type !== 'table' && bartender ? (
              <tr>
                <td>
                  <span className="fw-bold">{t('waiter')}:&nbsp;</span>
                  <span>
                    {bartender.deleted_at
                      ? bartender.name.replace(bartender.name.substring(bartender.name.length - 19), ` ${t('disabled')}`)
                      : bartender.name}
                  </span>
                </td>
              </tr>
            ) : null}

            {cart.type === 'P' && (
              <tr>
                <td>
                  <span className="fw-bold">{t('delivery_date')}: </span>
                  <span>{`${cart.date().formatted}`}</span>
                </td>
              </tr>
            )}
            {cart.type !== 'T' && (
              <tr>
                <td>
                  <span className="fw-bold">Tel: </span>
                  <span>{cart.returnMaskedContact()}</span>
                </td>
              </tr>
            )}
            {props.type === 'table' && (
              <tr>
                <td className="">
                  <span className="fw-bold">{t('duration')}: </span>
                  <span className={`${props.paperSize === 58 && 'fs-8'}`}>
                    {DateTime.fromSQL((table?.opened || opened)?.created_at as string).toFormat('HH:mm')}/
                    {report
                      ? DateTime.fromSQL((table?.opened || opened)?.updated_at as string).toFormat('HH:mm')
                      : DateTime.local().toFormat('HH:mm')}{' '}
                    -{' '}
                    {report
                      ? (table?.opened || opened)?.perm
                      : DateTime.local()
                          .diff(DateTime.fromSQL((table?.opened || opened)?.created_at as string), 'seconds')
                          .toFormat("hh'h'mm")}
                  </span>
                </td>
              </tr>
            )}
            <tr>
              <td className="pt-3">
                <div className="underlineSeparator"></div>
              </td>
            </tr>
          </>
        ) : null}
        {(props.type === 'command' || props.type === 'table') && (
          <p className="m-0">
            <span className={`fw-bold`}>{t('order')}: </span>
            {`wm${cart.code}-${cart.getTextTypeReq()}`}
            <span className="fw-bold">{cart.status === 'canceled' ? ` ${t('cancelled_up')}` : null}</span>
          </p>
        )}
        {$cartsRequests(cart)}
      </tbody>
    )
  })

  const content = (
    <table
      className={`table-printer mx-auto fs-${props.fontSize || 7} ${props.classBold || ''} ${props.className || ''} table-margin-${
        props.margin ?? 0
      }`}
      style={{
        width: `${props.paperSize || 58}mm`,
        letterSpacing: 1.3,
        ...props.style,
      }}
    >
      <tbody>
        <tr>
          <td className="text-center pbtest-3">
            <span className="fs-5 fw-bold title-name" style={{ wordBreak: 'break-word', whiteSpace: 'break-spaces' }}>
              {titleTable ? titleTable : profile?.name.normalize()}
            </span>
          </td>
        </tr>
      </tbody>
      {$requests}
      <tbody>
        {/* Taxas */}
        {
          <>
            {props.type === 'command' || props.type === 'table'
              ? (props.type === 'command' ? command?.fees : (opened ?? table?.opened)?.getUpdatedFees(!report, true))
                  ?.filter((fee) => fee.deleted_at === null)
                  .map((fee, index, arr) =>
                    fee.status && fee.automatic ? (
                      <tr key={fee.code}>
                        <td className={`${index === 0 && 'pt-1'} ${index === arr.length - 1 && 'pbtest-1'}`}>
                          <div className="row-print clearfix">
                            <div className="col-print-lt-payment">
                              <span>{fee.code}</span>
                            </div>
                            <div className="col-print-rt-payment">
                              <span>
                                {currency({
                                  value:
                                    fee.type === 'fixed' && fee.quantity
                                      ? fee.value * fee.quantity
                                      : (fee.value / 100) *
                                        (props.type === 'command'
                                          ? command?.getTotalValue('command') || 0
                                          : (opened ?? table?.opened)?.getTotalValue('table') || 0),
                                  withoutSymbol: true,
                                })}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null
                  )
              : null}
          </>
        }

        {(props.type === 'command' || props.type === 'table') &&
        (props.type === 'command' ? command?.fees : (opened ?? table?.opened)?.getUpdatedFees(!report, true))?.filter(
          (fee) => fee.deleted_at === null
        ).length ? (
          <tr>
            <td>
              <div className="underlineSeparator"></div>
            </td>
          </tr>
        ) : null}
      </tbody>
      <tbody>
        {/* Comandas */}
        {props.type === 'table' && (
          <>
            {(opened ?? table?.opened)?.commands
              .filter((c) => c.haveCarts())
              .map((commandMap, index, arr) => (
                <tr key={commandMap.code}>
                  <td className={`${index === 0 && 'pt-1'} ${index === arr.length - 1 && 'pbtest-1'}`}>
                    <div className="row-print clearfix">
                      <div className="col-print-lt-payment">
                        <div className="between-paid">
                          <span>{commandMap.name}</span>
                          {!commandMap.status && <span className="me-3">{t('paid_up')}</span>}
                        </div>
                      </div>
                      <div className="col-print-rt-payment">
                        <span>
                          {currency({
                            value: commandMap.getTotalValue('command'),
                            withoutSymbol: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            <tr>
              <td className="underlineSeparator"></td>
            </tr>
          </>
        )}
      </tbody>
      <tbody id="print-foot">
        {carts[0]?.cupomId && carts[0]?.cupom && (
          <tr>
            <td className="pt-1">
              <div className="row-print clearfix">
                <div className="col-print-lt-payment">
                  <span className="fw-bold">{t('coupon_used')}: </span>
                </div>
                <div className="col-print-rt-payment">
                  <span>{cart.cupom?.code}</span>
                </div>
              </div>
            </td>
          </tr>
        )}
        <tr>
          <td className="pt-3">
            <div className="row-print clearfix">
              <div className="col-print-lt-payment">
                <span className="fw-bold">Sub-Total: </span>
              </div>
              <div className="col-print-rt-payment">
                <span>
                  {currency({
                    value: subTotal,
                    withoutSymbol: true,
                  })}
                </span>
              </div>
            </div>
          </td>
        </tr>
        {carts[0]?.address && carts[0].cupom?.type !== 'freight' && (
          <tr>
            <td>
              <div className="row-print clearfix">
                <div className="col-print-lt-payment">
                  <span className="fw-bold">{t('delivery_fee')}: </span>
                </div>
                <div className="col-print-rt-payment">
                  <span>
                    {carts[0].taxDelivery > 0
                      ? currency({
                          value: carts[0].taxDelivery,
                          withoutSymbol: true,
                        })
                      : t('free')}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        )}
        {carts[0]?.cupomId && (
          <tr>
            <td>
              <div className="row-print clearfix">
                <div className="col-print-lt-payment">
                  <span className="fw-bold">{t('coupon')}: </span>
                </div>
                <div className="col-print-rt-payment">
                  <span>
                    {carts[0].cupom?.type !== 'freight'
                      ? `-${currency({
                          value: Number(
                            carts[0].cupom?.type === 'percent' ? (subTotal / 100) * Number(carts[0].cupom?.value ?? 0) : carts[0].cupom?.value ?? 0
                          ),
                          withoutSymbol: true,
                        })}`
                      : t('fee_shipping')}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        )}
        <tr>
          <td>
            <div className="row-print clearfix">
              <div className="col-print-lt-payment">
                <span className="fw-bold">Total: </span>
              </div>
              <div className="col-print-rt-payment">
                <span>
                  {currency({
                    value: total,
                    withoutSymbol: true,
                  })}
                </span>
              </div>
            </div>
          </td>
        </tr>
        {/* {carts[0]?.formPayment === "Dinheiro" ? (
          <>
            <tr>
              <td>
                <div className="row-print clearfix">
                  <div className="col-print-lt-payment">
                    <span className="fw-bold">Troco para: </span>
                  </div>
                  <div className="col-print-rt-payment">
                    <span>{currency({
                      value: transshipment,
                      withoutSymbol: true,
                      currency: user?.controls?.currency
                    })}</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <div className="row-print clearfix">
                  <div className="col-print-lt-payment">
                    <span className="fw-bold">Troco: </span>
                  </div>
                  <div className="col-print-rt-payment">
                    <span>
                      {currency(
                        {
                          value: Math.max(transshipment - total, 0),
                          withoutSymbol: true,
                          currency: user?.controls?.currency
                        }
                      )}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </>
        ) : null} */}
        {
          <>
            <tr>
              <td>
                <div className="row-print clearfix">
                  <div className="col-print-lt-payment">
                    <span className="fw-bold">{t('paid')}: </span>
                  </div>
                  <div className="col-print-rt-payment">
                    <span>
                      {currency({
                        value: paid,
                        withoutSymbol: true,
                      })}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                {(props.type === 'command' ? command : props.type === 'table' ? table?.opened : cart)?.formsPayment.map((formPayment, index) => {
                  return (
                    <div key={'forms-payment-table-' + index} className="row-print clearfix">
                      <div className="col-print-lt-payment">
                        <p className="fw-boldtest m-0">{`\u2000\u2000Em ${formPayment.label}`}</p>
                        {formPayment.change ? <span>{`\u2000\u2000${t('change')}`}</span> : null}
                      </div>
                      <div className="col-print-rt-payment">
                        <p className="m-0">
                          {currency({
                            value: formPayment.change ? formPayment.change : formPayment.value,
                            withoutSymbol: true,
                          })}
                        </p>
                        {formPayment.change ? <span>{currency({ value: formPayment.change - formPayment.value, withoutSymbol: true })}</span> : null}
                      </div>
                    </div>
                  )
                })}
              </td>
            </tr>
          </>
        }
        {carts[0]?.type === 'T' && (props.type === 'command' || props.type === 'table') && (
          <tr>
            <td>
              <div className="row-print clearfix">
                <div className="col-print-lt-payment">
                  <span className="fw-bold">{t('missing')}: </span>
                </div>
                <div className="col-print-rt-payment">
                  <span>{currency({ value: lack, withoutSymbol: true })}</span>
                </div>
              </div>
            </td>
          </tr>
        )}
        {/* {carts[0]?.type !== "T" && (
          <tr>
            <td className="">
              <div className="row-print clearfix">
                <div className="col-print-lt-payment">
                  <span className="fw-bold">Pagamento em: </span>
                </div>
                <div className="col-print-rt-payment">
                  <span className="text-wrap">
                    {`${carts[0]?.formPayment}`}{" "}
                    {carts[0]?.formPayment !== "Dinheiro"
                      ? `${carts[0]?.formPaymentFlag !== "-" ? `(${carts[0]?.formPaymentFlag})` : ""}`
                      : ""}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        )} */}
        <>
          {carts[0]?.address && (
            <tr>
              <td className="text-start pt-1 toplineSeparator">
                <div>
                  <p className="p-0 m-0">{cart.address.street},</p>
                  <p className="p-0 m-0">
                    {cart.address.number} {cart.address.complement}
                  </p>
                  <p className="p-0 m-0">
                    {cart.address.neighborhood} - {cart.address.city}
                  </p>
                  <p className="p-0 m-0">{cart.address.reference}</p>
                </div>
              </td>
            </tr>
          )}
          <tr>
            <td className={`text-center pt-2 printer-foot-last-line`}>
              <div
                className="toplineSeparator pt-3"
                // className={`${
                //   carts[0]?.typeDelivery !== 0 ? "toplineSeparator" : ""
                // }`}
              ></div>
              <div>
                <span className="fw-bold text-center w-100" style={{ whiteSpace: 'pre' }}>
                  {carts[0]?.typeDeliveryText(textPackage(profile.options.package.label2))}
                </span>
              </div>
            </td>
          </tr>
          <tr className="">
            <td className="text-center  pb-3">
              <span className="text-center">{t('technology')}</span>
              <br />
              <span className="text-center">www.whatsmenu.com.br</span>
            </td>
          </tr>
        </>
      </tbody>
    </table>
  )

  return (
    <div ref={componentRef}>
      {window.innerWidth > 768 ? (
        content
      ) : (
        <div ref={componentRef}>
          {props.copiesTimes?.map((c) => (
            <div key={hash()}>{content}</div>
          ))}
        </div>
      )}
    </div>
  )
}
