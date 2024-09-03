import { DateTime } from 'luxon'
import { Fragment, Ref, forwardRef, useContext } from 'react'
import { AppContext } from '../../../../context/app.ctx'
import { Print } from '../../../../context/components/Print'
import Cart, { CartFormPayment } from '../../../../types/cart'
import CartItem from '../../../../types/cart-item'
import Command from '../../../../types/command'
import { ComplementType } from '../../../../types/complements'
import { PizzaImplementationType } from '../../../../types/pizza-product'
import Profile, {
  ProfileFee,
  ProfileTaxDeliveryNeighborhood,
} from '../../../../types/profile'
import Table from '../../../../types/table'
import { currency, textPackage } from '../../../../utils/wm-functions'

import { CartsContext } from '@context/cart.ctx'

export interface NotePrintProps {
  profile: Profile
  cart: Cart
  printType?: 'table' | 'command'
  report?: boolean
  table?: Table
  command?: Command
  detailedTable?: boolean
  pdf?: boolean
  electron?: boolean
  paperSize?: 58 | 80
}

export const NotePrint = forwardRef(function NotePrint(
  {
    profile,
    cart,
    printType,
    report = false,
    table,
    detailedTable,
    command,
    pdf,
    electron,
    paperSize,
  }: NotePrintProps,
  ref: Ref<HTMLPreElement>
) {
  const { profile: profileContext } = useContext(AppContext)
  const { motoboys } = useContext(CartsContext)
  if (!profile) {
    profile = profileContext
  }
  if (!cart) {
    return null
  }

  if (!printType) {
    table = cart?.command?.opened?.table
  }

  const getItens = () => {
    let items: CartItem[] = []

    switch (printType) {
      case 'table':
        if (table && table.opened) {
          items = table.opened.commands.flatMap((command) =>
            command.carts
              .filter((c) => c.status !== 'canceled')
              .reduce((carts: Cart[], cart) => {
                if (!carts.some((c) => c.id === cart.id)) {
                  carts.push(cart)
                }
                return carts
              }, [])
              .flatMap((cart) => {
                return cart.groupItens(profile.options.print.groupItems)
              })
          )
        }
        break
      case 'command':
        if (command) {
          items = command.carts
            .filter((c) => c.status !== 'canceled')
            .flatMap((cart) => {
              return cart.groupItens(profile.options.print.groupItems)
            })
        }
        break
      default:
        items = cart.groupItens(profile.options.print.groupItems)
        break
    }

    return items
  }

  const getCupomValue = () => {
    let cupomDisplayValue
    let value = 0

    if (cart.cupom) {
      switch (cart.cupom.type) {
        case 'value':
          value = Number(cart.cupom.value)
          cupomDisplayValue = currency({ value, withoutSymbol: true })
          break
        case 'percent':
          value =
            (cart.getTotalValue('subtotal') / 100) *
            Number(cart.cupom.value || 0)
          cupomDisplayValue = currency({ value, withoutSymbol: true })
          break
        case 'freight':
          cupomDisplayValue = 'Frete Grátis'
          break
        default:
          break
      }
    }
    return { cupomDisplayValue, value }
  }

  const addonTypeLabel = () => {
    let type = ''
    if (cart.formsPayment[0]?.addon.status) {
      switch (cart.formsPayment[0]?.addon.type) {
        case 'fee':
          type = `Taxa ${cart.formsPayment[0]?.label}`
          break
        case 'discount':
          type = `Desc. ${cart.formsPayment[0]?.label}`
          break
      }
    }
    return type
  }

  const getFeesToPrint = () => {
    let fees: ProfileFee[] = []
    switch (printType) {
      case 'table':
        fees = table?.opened?.getUpdatedFees(false, true) ?? []
        break
      default:
        fees = cart?.command?.fees ?? []
        break
    }
    return fees
  }

  const getFormsPaymentToPrint = (noCashback = true) => {
    let formsPayment: CartFormPayment[] = []
    switch (printType) {
      case 'table':
        formsPayment = cart?.command?.opened?.formsPayment ?? []
        break
      case 'command':
        formsPayment = cart?.command?.formsPayment ?? []
        break
      default:
        formsPayment =
          (cart.statusPayment === 'offline'
            ? cart?.formsPayment
            : cart?.formsPayment.filter(
              (f) => f.paid || f.payment === 'cashback'
            )) ?? []
        if (noCashback) {
          formsPayment = formsPayment.filter(
            (formPayment) => formPayment.payment !== 'cashback'
          )
        }
        break
    }
    return formsPayment
  }

  const getPaidValue = () => {
    let paid = 0
    switch (printType) {
      case 'command':
        paid = cart.command?.getTotalValue('paid') || 0
        break
      case 'table':
        paid = table?.opened?.getTotalValue('paid') || 0
        break
      default:
        paid =
          cart.formsPayment.reduce(
            (total, formPayment) => (total += formPayment.value),
            0
          ) || 0
        break
    }

    return currency({ value: paid, withoutSymbol: true })
  }

  const getLackValue = () => {
    let lack = 0
    switch (printType) {
      case 'command':
        lack = cart.command?.getTotalValue('lack') || 0
        break
      case 'table':
        lack = table?.opened?.getTotalValue('lack') || 0
        break
      default:
        lack = (cart?.getTotalValue('lack') || 0) - getCupomValue().value
        break
    }

    return currency({ value: lack, withoutSymbol: true })
  }

  const complementLayout = (complement: ComplementType, item: CartItem) => {
    return (
      <>
        <Print.Breakline />
        <Print.Row
          leftClass="complement-space"
          key={complement.id}
          left={`${' '.repeat(3)}${complement.name}`}
        />
        {complement.itens?.map((complementItem, index) => {
          const complementItemTotal =
            complementItem.value > 0
              ? `(${currency({ value: complementItem.value * (complementItem.quantity || 1) * (item.details.value > 0 ? 1 : item.quantity), withoutSymbol: true })})`
              : ''
          return (
            <Print.Row
              key={`${complementItem.code}-${index}`}
              leftClass="item-space"
              left={`${' '.repeat(5)}${complementItem.quantity}X | ${complementItem.name}`}
              center=""
              right={`${complementItemTotal} `}
            />
          )
        })}
      </>
    )
  }

  const implementationLayout = (implementation: PizzaImplementationType) => {
    if (!implementation) {
      return <></>
    }
    return (
      <Print.Row
        key={implementation.code}
        leftClass="complement-space"
        left={`${' '.repeat(3)}${implementation.name}`}
        right={`${currency({ value: implementation.value })}`}
      />
    )
  }

  const getItemsToPrint = (items: CartItem[]) => {
    return items?.map((cartItem) => {
      const cartItemTotal =
        cartItem.details.value > 0
          ? `${currency({ value: cartItem.getTotal(cartItem.type === 'default') })}`
          : ''
      // const cartItemTotalWithOutSymbol = cartItem.details.value > 0 ? `(${currency({ value: cartItem.type === 'pizza' ? cartItem.getTotal(true) - cartItem.details.implementations.reduce((total, i) => total += i.value, 0) : cartItem.details.value, withoutSymbol: true })})` : ''
      const cartItemTotalWithOutSymbol =
        cartItem.details.value > 0
          ? `(${currency({ value: cartItem.details.value, withoutSymbol: true })})`
          : ''
      const flavorsString =
        cartItem.type === 'pizza' && cartItem.details.flavors.length > 1
          ? `${cartItem.details.flavors.length} Sabores`
          : ''
      const specialCharsRegex = new RegExp(/(\W)/, 'g')
      const regex =
        cartItem.type === 'pizza'
          ? new RegExp(
            `${cartItem.details.flavors.length > 1
              ? flavorsString.replace(specialCharsRegex, '\\$1')
              : cartItem.details.flavors[0].name.replace(
                specialCharsRegex,
                '\\$1'
              )
            }.+`,
            'g'
          )
          : ''
      // if (cartItem.type === 'pizza') {
      //   console.log(cartItem.name.replace(regex, flavorsString), regex)
      // }
      const cartItemName =
        cartItem.type === 'default'
          ? cartItem.name
          : cartItem.name?.replace(regex, flavorsString)
      return (
        <div key={cartItem.id}>
          <Print.Row
            left={`${cartItem.quantity}X | ${cartItemName}`}
            right={`${cartItemTotalWithOutSymbol}`}
          />
          {cartItem.type === 'pizza' && (
            <>
              {cartItem.details.implementations?.map((implementatiton) =>
                implementationLayout(implementatiton)
              )}
              {cartItem.details.flavors?.map((flavor, index) => (
                <Fragment key={`${flavor.code}-${index}`}>
                  <Print.Row
                    leftClass="complement-space"
                    left={`${' '.repeat(3)}${flavor.name}`}
                  />
                  {flavor.complements?.map((complement) =>
                    complementLayout(complement, cartItem)
                  )}
                  {flavor.implementations?.map((implementatiton) =>
                    implementationLayout(implementatiton)
                  )}
                </Fragment>
              ))}
            </>
          )}
          {(cartItem.type === 'default' ||
            !profile.options.pizza.multipleComplements) &&
            cartItem.details.complements?.map((complement) =>
              complementLayout(complement, cartItem)
            )}
          {cartItem.obs.length > 0 && (
            <Print.Row left={`Obs: ${cartItem.obs}`} />
          )}
          <Print.Row
            key={`${cartItem.id}-price`}
            left=" "
            center=""
            right={`${cartItemTotal} `}
          />
          <Print.LineSeparator />
        </div>
      )
    })
  }

  const getTotal = (type: 'total' | 'subtotal'): number => {
    switch (printType) {
      case 'table':
        if (type === 'subtotal') {
          return table?.opened?.getTotalValue('table') as number
        }
        if (type === 'total') {
          return table?.opened?.getTotalValue('tableFee') as number
        }
      case 'command':
        if (type === 'subtotal') {
          return command?.getTotalValue('command') as number
        }
        if (type === 'total') {
          return command?.getTotalValue('commandFee') as number
        }
      default:
        return cart.getTotalValue(type)
    }
  }

  const getTransshipment = (): number => {
    let result = 0
    switch (printType) {
      case 'command':
        if (cart.command) {
          result = cart.command.carts
            .filter((c) => c.status !== 'canceled')
            .reduce((total, cart) => (total += cart.transshipment()), 0)
        }
        break
      case 'table':
        if (table) {
          result = table
            .activeCommands()
            .flatMap((command) => command.carts)
            .filter((c) => c.status)
            .reduce((total, cart) => (total += cart.transshipment()), 0)
        }
        break
      default:
        result = cart.transshipment()
        break
    }
    return result
  }

  const tax = () => {
    if (profile.typeDelivery === 'neighborhood') {
      let verifyNeighborood = (
        profile.taxDelivery as ProfileTaxDeliveryNeighborhood[]
      ).map((tax) => {
        return tax?.neighborhoods.filter(
          (n) => n.name === cart?.address?.neighborhood
        )
      })
      if (verifyNeighborood[0][0]?.value === null) {
        return 'À Consultar'
      } else {
        if (
          cart.taxDelivery === 0 ||
          (cart.cupomId && cart.cupom?.type === 'freight')
        ) {
          return 'Grátis'
        }
        return `+ ${currency({ value: cart.taxDelivery, withoutSymbol: true })}`
      }
    }
    if (profile.typeDelivery === 'km') {
      if (cart.taxDelivery === null) {
        return 'À Consultar'
      } else {
        if (
          cart.taxDelivery === 0 ||
          (cart.cupomId && cart.cupom?.type === 'freight')
        ) {
          return 'Grátis'
        }
        return `+ ${currency({ value: cart.taxDelivery, withoutSymbol: true })}`
      }
    }
  }

  const haveTransshipment = getTransshipment() > 0

  return (
    <Print.Root
      ref={ref}
      printMode={
        pdf ? 'pdf' : profile.options?.print.textOnly ? 'text-only' : 'formated'
      }
      appMode={profile.options.print.app}
      paperWidthSize={
        profile.options.print.width === '302px'
          ? electron
            ? 46
            : 48
          : electron && !profile.options?.print.textOnly
            ? 23
            : 32
      }
      paperSize={paperSize}
      fontSize={profile.options.print.fontSize}
    >
      <Print.Row center={profile.name} className="print-title" />
      <Print.Breakline />
      <Print.Row
        left={DateTime.fromSQL(cart.created_at, { zone: 'America/Sao_Paulo' })
          .setZone(profile.timeZone)
          .toFormat('dd/MM/yyyy HH:mm:ss')
          .trim()}
      />
      {!printType && (
        <Print.Row
          left={`Pedido: wm${cart.code}-${cart.type} ${cart.status === 'canceled' ? ' (CANCELADO)' : ''}`}
        />
      )}
      {cart.type === 'T' ? (
        <Print.Row
          left={`Mesa: ${table?.deleted_at ? table?.name.replace(table?.name.substring(table?.name.length - 25), ' (Desativada)') : table?.name}`}
        />
      ) : null}
      {printType !== 'table' && (
        <Print.Row
          left={`${printType === 'command' || cart.type === 'T' ? 'Comanda' : 'Cliente'}: ${(cart.type === 'T' ? cart.command : cart.client)?.name}`}
        />
      )}
      {cart.type === 'T' && !printType && cart.bartender && (
        <Print.Row
          left={`Garçom: ${cart.bartender.deleted_at
              ? cart.bartender.name.replace(
                cart.bartender.name.substring(
                  cart.bartender.name.length - 19
                ),
                ' (Desativado)'
              )
              : cart.bartender.name
            }`}
        />
      )}
      {cart.type === 'P' && (
        <Print.Row left={`Data Entrega: ${cart.date().formatted}`} />
      )}
      {cart.type !== 'T' && (
        <Print.Row left={`Tel: ${cart.returnMaskedContact()}`} />
      )}
      {cart.secretNumber && <Print.Row left={`${cart.secretNumber.length <= 11 ? 'CPF' : 'CNPJ'}: ${cart.secretNumber}`} />}
      {printType === 'table' && (
        <Print.Row
          left={`Permanência: ${cart.permenance(false, table?.opened)}`}
        />
      )}
      <Print.LineSeparator />
      {detailedTable
        ? table?.opened?.getCarts()?.map((cart) => {
          return cart.status !== 'canceled' ? (
            <>
              <Print.Row left={`Pedido: wm${cart.code}-${cart.type}`} />
              {getItemsToPrint(
                cart.groupItens(profile.options.print.groupItems)
              )}
            </>
          ) : null
        })
        : getItemsToPrint(getItens())}
      {(printType === 'command' || printType === 'table') && (
        <>
          {getFeesToPrint()
            .filter((fee) => fee.automatic && fee.deleted_at === null)
            ?.map((fee) => {
              let value = 0
              if (fee.type === 'fixed') {
                value = fee.value * (fee.quantity as number)
              } else {
                value =
                  (fee.value / 100) *
                  (printType === 'command' || !printType
                    ? cart.command?.getTotalValue('command') || 0
                    : table?.opened?.getTotalValue('table') || 0)
              }
              const feeTotal = currency({
                value,
                withoutSymbol: true,
              })
              return value ? (
                <Print.Row
                  key={fee.code}
                  left={`${fee.code}`}
                  right={`${feeTotal}`}
                />
              ) : null
            })}
          {getFeesToPrint().filter(
            (fee) => fee.automatic && fee.deleted_at === null
          ).length > 0 && <Print.LineSeparator />}
        </>
      )}
      {printType === 'table' &&
        table?.opened?.commands.length && ( // printType === 'command' && cart.type === 'T'
          <>
            {table?.opened?.commands
              .filter(
                (command) =>
                  command.carts.filter((c) => c.status !== 'canceled').length
              )
              ?.map((command) => {
                const commandTotalValue = currency({
                  value: command.getTotalValue('command'),
                  withoutSymbol: true,
                })
                return (
                  <Print.Row
                    key={command.id}
                    left={`${command.name} `}
                    center={`${command.fullPaid() ? ' PAGO ' : ''}`}
                    right={` ${commandTotalValue}`}
                  />
                )
              })}
            <Print.LineSeparator />
          </>
        )}
      {cart.obs ? (
        <>
          <Print.Row left={`Obs: ${cart.obs}`} />
          <Print.LineSeparator />
        </>
      ) : null}
      <>
        {cart.cupom && (
          <Print.Row left={`Cupom usado:`} right={`${cart.cupom.code}`} />
        )}
        <Print.Row
          left={`Pedido:`}
          right={`+${currency({ value: getTotal('subtotal'), withoutSymbol: true })}`}
        />
        {cart.addressId && cart.type !== 'T' && (
          <Print.Row left={`Entrega:`} right={`${tax()}`} />
        )}
        {cart.formsPayment && cart.formsPayment[0]?.addon?.status && (
          <Print.Row
            left={`${addonTypeLabel()}:`}
            right={`${cart.formsPayment[0]?.addon.type === 'fee' ? '+' : '-'}${currency({ value: cart.getTotalValue('addon'), withoutSymbol: true })}`}
          />
        )}
        {cart.cupom && (
          <Print.Row
            left={`Cupom:`}
            right={`-${getCupomValue().cupomDisplayValue}`}
          />
        )}
        {getFormsPaymentToPrint(false).some(
          (formPayment) => formPayment.payment === 'cashback'
        ) && (
            <Print.Row
              left={`Cashback:`}
              right={`-${currency({ value: cart.getTotalValue('cashback'), withoutSymbol: true })}`}
            />
          )}
        <Print.Row
          left={`Total:`}
          right={`${currency({ value: getTotal('total'), withoutSymbol: true })}`}
        />
        {haveTransshipment &&
          cart.formsPayment.filter(
            (formPayment) => formPayment.payment !== 'cashback'
          ).length ? (
          <>
            <Print.Row
              left={`Troco para:`}
              right={`${currency({ value: getTransshipment(), withoutSymbol: true })}`}
            />
            <Print.Row
              left={`Troco:`}
              right={`${currency({ value: Math.max(getTransshipment() - getTotal('total'), 0), withoutSymbol: true })}`}
            />
          </>
        ) : null}
        {getFormsPaymentToPrint()?.length < 2 && !printType ? (
          <>
            {getFormsPaymentToPrint()[0] ? (
              <Print.Row
                left={`Pagamento em:`}
                right={`${getFormsPaymentToPrint()[0]?.label}${(typeof getFormsPaymentToPrint()[0]?.flag === 'string' ? getFormsPaymentToPrint()[0]?.flag : getFormsPaymentToPrint()[0]?.flag?.name) ? ' - ' + (typeof getFormsPaymentToPrint()[0]?.flag === 'string' ? getFormsPaymentToPrint()[0]?.flag : getFormsPaymentToPrint()[0]?.flag?.name) : ''}`}
              />
            ) : null}
          </>
        ) : (
          <>
            <Print.Row left={`Total Pago:`} right={`${getPaidValue()}`} />
            {getFormsPaymentToPrint()?.map((formPayment, index) => {
              return (
                <>
                  <Print.Row
                    key={`${formPayment.code}-${index}`}
                    leftClass="transshipment-space"
                    left={`${formPayment.change ? 'Troco para' : formPayment.label}${formPayment.flag && formPayment.flag.name ? ' - ' + formPayment.flag.name : ''}`}
                    right={`${currency({ value: formPayment.change ?? formPayment.value, withoutSymbol: true })}`}
                  />
                  {formPayment.change ? (
                    <>
                      {/* <Print.Row left={`  Troco para`} leftClass='transshipment-space' right={`${currency({ value: formPayment.change, withoutSymbol: true })}`} /> */}
                      <Print.Row
                        left={`  Troco`}
                        leftClass="transshipment-space"
                        right={`${currency({ value: formPayment.change - formPayment.value, withoutSymbol: true })}`}
                      />
                    </>
                  ) : null}
                </>
              )
            })}
            {Number(getLackValue()) > 0 && (
              <Print.Row left={`Faltam:`} right={`${getLackValue()}`} />
            )}
            {cart.getTotalValue('paid') - cart.getTotalValue('total') > 0 && (
              <Print.Row
                left={'Fechamento:'}
                right={`${currency({ value: cart.getTotalValue('paid') - cart.getTotalValue('total'), withoutSymbol: true })}`}
              />
            )}
          </>
        )}
        {cart.statusPayment === 'paid' && <Print.Row center="PAGO ONLINE" />}
        {/* )} */}
        <Print.LineSeparator />
      </>
      {cart.address ? (
        <>
          <Print.Row left={`${cart.address.street},`} />
          <Print.Row
            left={`${cart.address.number || 'S/N'} ${cart.address.complement || ''}`}
          />
          <Print.Row
            left={`${cart.address.neighborhood} - ${cart.address.city}`}
          />
          {cart.address.reference && (
            <Print.Row left={`${cart.address.reference}`} />
          )}
          {cart && cart.motoboyId && (
            <Print.Row
              left={`Entregador: ${electron ? cart.motoboy?.name : motoboys?.find((motoboy) => motoboy.id === cart.motoboyId)?.name}`}
            />
          )}
          <Print.LineSeparator />
        </>
      ) : null}
      <>
        <Print.Row
          center={`${cart?.typeDeliveryText(textPackage(profile.options.package.label2))}`}
        />
        <Print.Row center="Tecnologia" />
        <Print.Row center="www.whatsmenu.com.br" />
      </>
      {profile.options.print.textOnly && !profile.options.print.web && (
        <>
          <Print.Breakline />
          <Print.Breakline />
          <Print.Breakline />
        </>
      )}
    </Print.Root>
  )
})
