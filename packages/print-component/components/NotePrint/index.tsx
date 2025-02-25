import { DateTime } from 'luxon'
import React, { Fragment, Key, Ref, forwardRef } from 'react'

import { QRCodeSVG } from 'qrcode.react'
import { Print } from '../Print'
import { currency } from '../../utils/currency'

export interface NotePrintProps {
  profile: any //Profile
  cart: any //Cart
  printType?: 'table' | 'command'
  report?: boolean
  table?: any //Table
  command?: any //Command
  detailedTable?: boolean
  pdf?: boolean
  electron?: boolean
  paperSize?: 58 | 80
  motoboys?: any[]
  textPackage?: string
  isGeneric?: boolean
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
    motoboys = [],
    textPackage,
    isGeneric
  }: NotePrintProps,
  ref: Ref<HTMLPreElement>
) {
  if (!cart) {
    return null
  }

  if (!printType) {
    table = cart?.command?.opened?.table
  }

  const getSecretType = (secretNumber: string): string => {
    const country = profile?.options?.locale?.language;

    switch (country) {
      case 'pt-BR':
        if (secretNumber.length <= 11) {
          return 'CPF'
        } else {
          return 'CNPJ'
        }
      case 'en-US':
        return 'SSN'
      case 'pt-PT':
        return 'NIF'
      default:
        if (secretNumber.length <= 11) {
          return 'CPF'
        } else {
          return 'CNPJ'
        }
    }
  }

  const getItens = () => {
    let items: /*CartItem[]*/ any[] = []

    switch (printType) {
      case 'table':
        if (table && table.opened) {
          items = table.opened.commands.flatMap((command: any) =>
            command.carts
              .filter((c: any) => c.status !== 'canceled')
              .reduce((carts: any[] /*Cart[] */, cart: any) => {
                if (!carts.some((c) => c.id === cart.id)) {
                  carts.push(cart)
                }
                return carts
              }, [])
              .flatMap((cart: any) => {
                return cart.groupItens(profile.options.print.groupItems)
              })
          )
        }
        break
      case 'command':
        if (command) {
          items = command.carts
            .filter((c: any) => c.status !== 'canceled')
            .flatMap((cart: any) => {
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
    if (getFormsPaymentToPrint()[0]?.addon.status) {
      switch (getFormsPaymentToPrint()[0]?.addon.type) {
        case 'fee':
          type = `Acréscimo ${getFormsPaymentToPrint()[0]?.label}`
          break
        case 'discount':
          type = `Desconto ${getFormsPaymentToPrint()[0]?.label}`
          break
      }
    }
    return type
  }

  const getFeesToPrint = () => {
    let fees: any[] /**ProfileFee[] */ = []
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
    let formsPayment:  any[] /*CartFormPayment[] */ = []
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
              (f: any) => f.paid || f.payment === 'cashback'
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
            (total: number, formPayment: any) => (total += formPayment.value),
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

  const complementLayout = (complement: any /*ComplementType*/) => {
    return (
      <>
        <Print.Breakline />
        <Print.Row
          leftClass="complement-space"
          key={complement.id}
          left={electron && !isGeneric ? `${complement.name}` : `${' '.repeat(3)}${complement.name}`}
        />
        {complement.itens?.map((complementItem: any, index: number) => {
          const complementItemTotal =
            complementItem.value > 0
              ? `(${currency({ value: complementItem.value * (complementItem.quantity || 1), withoutSymbol: true })})`
              : ''
          return (
            <Print.Row
              key={`${complementItem.code}-${index}`}
              leftClass="item-space"
              left={electron && !isGeneric ? `${complementItem.quantity}X | ${complementItem.name}` : `${' '.repeat(5)}${complementItem.quantity}X | ${complementItem.name}`}
              center=""
              right={`${complementItemTotal} `}
            />
          )
        })}
      </>
    )
  }

  const implementationLayout = (implementation: any /*PizzaImplementationType */) => {
    if (!implementation) {
      return <></>
    }
    return (
      <Print.Row
        key={implementation.code}
        leftClass="complement-space"
        left={electron && !isGeneric ? `${implementation.name}` : `${' '.repeat(3)}${implementation.name}`}
        right={`${currency({ value: implementation.value, withoutSymbol: true })}`}
      />
    )
  }

  const getItemsToPrint = (items: any[] /*CartItem[] */) => {
    return items?.map((cartItem) => {
      const cartItemTotal =
        cartItem.details.value > 0
          ? `${currency({ value: cartItem.getTotal(cartItem.type === 'default'), withoutSymbol: true })}`
          : ''
      const cartItemTotalWithOutSymbol =
        cartItem.details.value > 0
          ? `(${currency({
            value:
              cartItem.type === 'pizza'
                ? cartItem.details.value -
                cartItem.details.complements.reduce(
                  (total: any, i: { itens: any[] }) =>
                    total +
                    i.itens.reduce((acc: any, item: { value: number, quantity: number }) => acc + (item.value * item.quantity), 0),
                  0
                ) -
                cartItem.details.implementations.reduce(
                  (total: any, implementation: { value: any }) => total + implementation.value,
                  0
                )
                : cartItem.details.value,
            withoutSymbol: true,
          })})`
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
              {cartItem.details.implementations?.map((implementatiton: any) =>
                implementationLayout(implementatiton)
              )}
              {cartItem.details.flavors?.map((flavor: { code: any; name: any; complements: any[]; implementations: any[] }, index: any) => (
                <Fragment key={`${flavor.code}-${index}`}>
                  <Print.Row
                    leftClass="complement-space"
                    left={electron && !isGeneric ? `${flavor.name}` : `${' '.repeat(3)}${flavor.name}`}
                  />
                  {flavor.complements?.map((complement: any) =>
                    complementLayout(complement)
                  )}
                  {flavor.implementations?.map((implementatiton: any) =>
                    implementationLayout(implementatiton)
                  )}
                </Fragment>
              ))}
            </>
          )}
          {(cartItem.type === 'default' ||
            !profile.options.pizza.multipleComplements) &&
            cartItem.details.complements?.map((complement: any) =>
              complementLayout(complement)
            )}
          {cartItem.obs.length > 0 && (
            <Print.Row className="observation-space" left={`Obs: ${cartItem.obs}`} />
          )}
          {
            <Print.Row
              key={`${cartItem.id}-price`}
              left=" "
              center=""
              right={`${cartItemTotal}`}
            />
          }
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
        break
      case 'command':
        if (type === 'subtotal') {
          return command?.getTotalValue('command') as number
        }
        if (type === 'total') {
          return command?.getTotalValue('commandFee') as number
        }
        break
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
            .filter((c: { status: string }) => c.status !== 'canceled')
            .reduce((total: any, cart: { transshipment: () => any }) => (total += cart.transshipment()), 0)
        }
        break
      case 'table':
        if (table) {
          result = table
            .activeCommands()
            .flatMap((command: { carts: any }) => command.carts)
            .filter((c: { status: any }) => c.status)
            .reduce((total: any, cart: { transshipment: () => any }) => (total += cart.transshipment()), 0)
        }
        break
      default:
        result = cart.transshipment()
        break
    }
    return result
  }

  const tax = () => {
    let verifyNeighborood
    if (profile.typeDelivery === 'neighborhood') {
      verifyNeighborood = (
        profile.taxDelivery as any[] //ProfileTaxDeliveryNeighborhood[]
      ).map((tax) => {
        return tax?.neighborhoods.filter(
          (n: { name: any }) => n.name === cart?.address?.neighborhood
        )
      })
      if (verifyNeighborood[0][0]?.value === null) {
        return 'À Consultar'
      } else {
        return `${currency({ value: cart.taxDelivery, withoutSymbol: true })}`
      }
    }
    if (profile.typeDelivery === 'km') {
      if (cart.taxDelivery === null) {
        return 'À Consultar'
      } else {
        return `${currency({ value: cart.taxDelivery, withoutSymbol: true })}`
      }
    }
  }

  const valueConsult = () => {
    let consult
  }

  const haveTransshipment = getTransshipment() > 0

  const sponsorCupomIfood = ({ cart }: { cart: any /*Cart */ }) => {
    if (cart.ifoodAditionalInfo?.metadata.benefits) {
      return cart.ifoodAditionalInfo?.metadata.benefits[0].sponsorshipValues
        .filter((sponsorValue: { value: number }) => sponsorValue.value > 0)
        .map((sponsorName: { description: any }) => {
          switch (sponsorName.description) {
            case 'Incentivo da Loja':
              return 'LOJA'
            case 'Incentivo do iFood':
              return 'IFOOD'
            case 'Incentivo da Industria':
              return 'Industria'
            case 'Incentivo da Rede':
              return 'Rede'
            default:
              return ''
          }
        })
    }
  }

  const valuesSponsorCupomIfood = ({ cart }: { cart: any /*Cart */ }) => {
    if (cart.ifoodAditionalInfo?.metadata.benefits) {
      return cart.ifoodAditionalInfo?.metadata.benefits[0].sponsorshipValues
        .filter((sponsorValue: { value: number }) => sponsorValue.value > 0)
        .map((sponsorName: { description: any; value: any }) => {
          switch (sponsorName.description) {
            case 'Incentivo da Loja':
              return sponsorName.value
            case 'Incentivo do iFood':
              return sponsorName.value
            case 'Incentivo da Industria':
              return sponsorName.value
            case 'Incentivo da Rede':
              return sponsorName.value
            default:
              return 0
          }
        })
    }
  }

  const commandWithNfce = table?.opened?.commands.flatMap((command: { carts: any[] }) => command.carts.filter((cartFilter: { command: { id: any }; controls: { grovenfe: any } }) => cartFilter.command?.id === cart.command?.id && cartFilter.controls.grovenfe))

  const tableWithNfce = table?.activeCommands().flatMap((command: { carts: any[] }) => command.carts.filter((cartFilter: { controls: { grovenfe: any } }) => cartFilter.controls.grovenfe))

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
      <Print.Row
        left={`${printType === 'command' || cart.type === 'T' ? 'Comanda' : 'Cliente'}: ${cart.nameClient()} `}
      />

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
      {cart.type !== 'T' && cart.client !== null && (
        <Print.Row left={`Tel: ${cart.returnMaskedContact()}`} />
      )}
      {cart.origin === 'ifood' && (
        <Print.Row left={`Código localizador: ${cart.client.codeLocalizer}`} />
      )}
      {cart.secretNumber && (
        <Print.Row
          left={`${getSecretType(cart.secretNumber)}: ${cart.secretNumber}`}
        />
      )}
      {printType === 'table' && (
        <Print.Row
          left={`Permanência: ${cart.permenance(false, table?.opened)}`}
        />
      )}
      <Print.LineSeparator />
      {detailedTable
        ? table?.opened?.getCarts()?.map((cart: { status: string; code: any; type: any; groupItens: (arg0: any) => any[] }) => {
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
                (command: { carts: { filter: (arg0: (c: any) => boolean) => { (): any; new(): any; length: any } } }) =>
                  command.carts.filter((c: { status: string }) => c.status !== 'canceled').length
              )
              ?.map((command: { getTotalValue: (arg0: string) => any; id: Key | null | undefined; name: any; fullPaid: () => any }) => {
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
          <Print.Row className="observation-space" left={`Obs: ${cart.obs}`} />
          <Print.LineSeparator />
        </>
      ) : null}
      <>
        {cart.cupom && (
          <Print.Row
            left={`${cart.origin === 'ifood' ? 'Cupom dado:' : 'Cupom usado:'}`}
            right={`${cart.origin === 'ifood' ? sponsorCupomIfood({ cart })?.join(', ') : cart.cupom.code}`}
          />
        )}
        {cart.cupom && cart.origin === 'ifood' && (
          <Print.Row
            left={`Valores de cada cupom`}
            right={`${valuesSponsorCupomIfood({ cart })?.join(', ')}`}
          />
        )}
        <Print.Row
          left={`Sub-Total:`}
          right={`${currency({ value: getTotal('subtotal'), withoutSymbol: true })}`}
        />
        {cart.address && cart.type !== 'T' && (
          <Print.Row
            left={`Taxa Entrega:`}
            right={
              cart.origin === 'ifood'
                ? `${currency({ value: cart.taxDelivery, withoutSymbol: true })}`
                : tax()
            }
          />
        )}
        {cart.origin === 'ifood' && cart.taxIfood! > 0 && (
          <Print.Row
            left={`Taxa Serviço Ifood:`}
            right={`${currency({ value: Number(cart?.taxIfood), withoutSymbol: true })}`}
          />
        )}
        {cart.formsPayment && getFormsPaymentToPrint()[0]?.addon?.status && (
          <Print.Row
            left={`${addonTypeLabel()}:`}
            right={`${currency({ value: cart.getTotalValue('addon'), withoutSymbol: true })}`}
          />
        )}
        {cart.cupom && (
          <Print.Row
            left={`Cupom:`}
            right={`-${cart.origin === 'ifood' ? cart.cupom.value : getCupomValue().cupomDisplayValue}`}
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
            (formPayment: { payment: string }) => formPayment.payment !== 'cashback'
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
        {/* {cart.type !== 'T' ? */}
        {/* (<Print.Row left={`Pagamento em:`} right={`${getFormsPaymentToPrint()[0]?.label}`} />) : */}
        {/* ( */}
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
            <Print.Row left={`Formas de pagamento:`} />
            {table?.opened?.formsPayment?.map((formPayment: { code: Key | null | undefined; label: string | undefined; value: any }) => {
              return (
                <Print.Row
                  key={formPayment.code}
                  left={formPayment.label}
                  right={currency({ value: formPayment.value, withoutSymbol: true })}
                />
              )
            })}

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
        {cart.origin === 'ifood' && (
          <Print.Row className="fw-bold" center="PEDIDO IFOOD" />
        )}
        {cart.origin === 'ifood' && (
          <Print.Row
            className="fw-bold"
            left="Código de coleta"
            right={(cart.controls as any).pickupCode}
          />
        )}
        {cart.statusPayment === 'paid' && <Print.Row center="PAGO ONLINE" />}
        {/* )} */}
        <Print.LineSeparator />
      </>
      {cart.address && cart.type !== 'T' ? (
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
        {(cart.controls.grovenfe?.fiscal_note?.aditional_info?.qrcode_url && printType !== 'command' && printType !== 'table') && (
          <>
            <Print.Breakline />
            <Print.Row center="Consulte pela Chave de Acesso em:" />
            <Print.Row
              className="longText"
              left={
                cart.controls.grovenfe?.fiscal_note?.aditional_info
                  ?.url_consulta_nf
              }
            />
            <Print.Breakline />
            <Print.Row center="Chave de Acesso:" />
            <Print.Row
              center={cart.controls.grovenfe?.fiscal_note?.aditional_info?.chave_nfe?.replace(
                'NFe',
                ''
              )}
            />
            <Print.Breakline />
            <Print.Row center="Protocolo:" />
            <Print.Row
              center={
                cart.controls.grovenfe?.fiscal_note?.aditional_info?.protocolo
              }
            />
            <Print.Row
              center={DateTime.fromISO(
                cart.controls.grovenfe?.fiscal_note?.created_at,
                { zone: 'America/Sao_Paulo' }
              )
                .setZone(profile.timeZone)
                .toFormat('dd/MM/yyyy HH:mm:ss')
                .trim()}
            />
            <Print.Breakline />
            {!profile.options?.print.textOnly && (
              <>
                <Print.Row center="Consulta via leitor de QR Code:" />
                <Print.Breakline />
                <Print.Row
                  className="d-flex justify-content-center"
                  children_controls="mid"
                >
                  <QRCodeSVG
                    value={
                      cart.controls.grovenfe?.fiscal_note?.aditional_info
                        .qrcode_url
                    }
                    size={paperSize === 58 ? 150 : 200}
                  />
                </Print.Row>
                <Print.Breakline />
              </>
            )}
          </>
        )}
        {(commandWithNfce && commandWithNfce?.length > 0) && printType === 'command' && (
          <>
            <Print.Row center="IMPRESSÃO COMANDA" />
            <Print.Breakline />
            <Print.Row center="Consulte pela Chave de Acesso em:" />
            <Print.Row
              className="longText"
              left={
                commandWithNfce[0]?.controls.grovenfe?.fiscal_note
                  ?.aditional_info?.url_consulta_nf
              }
            />
            <Print.Breakline />
            <Print.Row center="Chave de Acesso:" />
            <Print.Row
              center={commandWithNfce[0]?.controls.grovenfe?.fiscal_note?.aditional_info?.chave_nfe?.replace(
                'NFe',
                ''
              )
              }
            />
            <Print.Breakline />
            <Print.Row center="Protocolo:" />
            <Print.Row
              center={
                commandWithNfce[0]?.controls.grovenfe?.fiscal_note?.aditional_info?.protocolo
              }
            />
            <Print.Row
              center={DateTime.fromISO(
                commandWithNfce[0]?.controls.grovenfe?.fiscal_note?.created_at,
                { zone: 'America/Sao_Paulo' }
              )
                .setZone(profile.timeZone)
                .toFormat('dd/MM/yyyy HH:mm:ss')
                .trim()}
            />
            <Print.Breakline />
          </>
        )}
        {(tableWithNfce && tableWithNfce?.length > 0) && printType === 'table' && (
          <>
            <Print.Row center="IMPRESSÃO MESA" />
            <Print.Breakline />
            <Print.Row center="Consulte pela Chave de Acesso em:" />
            <Print.Row
              className="longText"
              left={
                tableWithNfce[0]?.controls.grovenfe?.fiscal_note
                  ?.aditional_info?.url_consulta_nf
              }
            />
            <Print.Breakline />
            <Print.Row center="Chave de Acesso:" />
            <Print.Row
              center={tableWithNfce[0]?.controls.grovenfe?.fiscal_note?.aditional_info?.chave_nfe?.replace(
                'NFe',
                ''
              )
              }
            />
            <Print.Breakline />
            <Print.Row center="Protocolo:" />
            <Print.Row
              center={
                tableWithNfce[0]?.controls.grovenfe?.fiscal_note?.aditional_info?.protocolo
              }
            />
            <Print.Row
              center={DateTime.fromISO(
                tableWithNfce[0]?.controls.grovenfe?.fiscal_note?.created_at,
                { zone: 'America/Sao_Paulo' }
              )
                .setZone(profile.timeZone)
                .toFormat('dd/MM/yyyy HH:mm:ss')
                .trim()}
            />
            <Print.Breakline />
          </>
        )}
        <Print.Row
          center={`${cart?.typeDeliveryText(textPackage)}`}
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
