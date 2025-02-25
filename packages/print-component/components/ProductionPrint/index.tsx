import { DateTime } from 'luxon'
import React, { Fragment, Key, Ref, forwardRef } from 'react'

import { currency } from '../../utils/currency'
import { Print } from '../Print'

export interface ProductionPrintProps {
  profile: any //Profile
  cart: any //Cart
  printType?: 'table' | 'command'
  table?: any //Table
  command?: any //Command
  detailedTable?: boolean
  pdf?: boolean
  electron?: boolean
  paperSize?: 58 | 80
  isGeneric?: boolean
}

export const ProductionPrint = forwardRef(function (
  {
    profile,
    cart,
    printType,
    table,
    detailedTable,
    command,
    pdf,
    electron,
    paperSize,
    isGeneric
  }: ProductionPrintProps,
  ref: Ref<HTMLPreElement>
) {

  if (!cart) {
    return null
  }

  if (!printType) {
    table = cart?.command?.opened?.table
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

  const complementLayout = (complement: any /*ComplementType*/) => {
    return (
      <>
        <Print.Breakline />
        <Print.Row
          leftClass="complement-space"
          key={complement.id}
          left={isGeneric ? `${' '.repeat(3)}${complement.name}` : `${complement.name}`}
        />
        {complement.itens?.map((complementItem: any, index: number) => {
          return (
            <Print.Row
              key={`${complementItem.code}-${index}`}
              leftClass="item-space"
              left={isGeneric ? `${' '.repeat(5)}${complementItem.quantity}X | ${complementItem.name}` : `${complementItem.quantity}X | ${complementItem.name}`}
              center=""
              right=""
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
        left={isGeneric ? `${' '.repeat(3)}${implementation.name}` : `${implementation.name}`}
        right=""
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
                    i.itens.reduce((acc: any, item: { value: any }) => acc + item.value, 0),
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
            right=""
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
                    left={isGeneric ? `${' '.repeat(3)}${flavor.name}` : `${flavor.name}`}
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
              right=""
            />
          }
          <Print.LineSeparator />
        </div>
      )
    })
  }

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
                  right=""
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
                    right=""
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
