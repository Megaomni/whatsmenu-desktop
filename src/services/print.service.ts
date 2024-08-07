import { DateTime } from "luxon"
import { PizzaCartType, ProductCartType, RequestType } from "../@types/request.type"
import { getUser } from "../storage/user"

const cartPrintLayout = (type: 'product' | 'pizza', cart: ProductCartType[] | PizzaCartType[]): string => {
  let text = ''
  if (type === 'pizza' && cart.length) {
    for (const pizza of cart as PizzaCartType[]) {
      text +=
        `${pizza.quantity}x | ${pizza.size} ${pizza.flavors.length} Sabor${pizza.flavors.length > 1 ? 'es' : ''} (${pizza.value})\n` +
        pizza.flavors.map(flavor => `  ${flavor.name}\n`).join('') +
        pizza.implementations.map(implementation => `    ${implementation.name} (${implementation.value})\n`).join('') +
        `[R]${pizza.value}\n` +
        '<hr>'
    }
  }
  if (type === 'product' && cart.length) {
    for (const product of cart as ProductCartType[]) {
      text +=
        `${product.quantity}x | ${product.name} ${product.value ? `(${product.value * product.quantity})` : ''}\n` +
        `${product.complements.length ?
          `${`  ${product.complements.map(complement => complement.name)}\n` +
          `    ${product.complements.map(complement => complement.itens.map(item => `${item.quantity}x | ${item.name} ${item.value ? `(${item.value})` : ''}`))}\n`}` :
          ''}` +
        '<hr>'
    }
  }
  return text
}

const printText = async (request: RequestType): Promise<string> => {
  const { profile } = await getUser()
  let text = ''
  let header = ''
  let carts = '<cartPizza><cartProduct>'
  let footer = '<total><payment><hr>[C]**Vou Retirar no Local**\n[C]Tecnologia\n[C]www.whatsmenu.com.br'
  text += `[C]<font size='big'><b>${profile.name}</b></font>\n\n`
  header += `[CONTENT]${DateTime.fromSQL(request.created_at, { zone: profile.timeZone }).toFormat("dd/MM/yyyy HH:mm:ss")}\n`
  for (const [key, value] of Object.entries(request)) {
    switch (key) {
      case 'code': {
        header += `Pedido: wm${value}-${request.type}\n`
        break
      }
      case 'name': {
        header += `Cliente: ${value}\n`
        break
      }
      case 'contact': {
        header += `Tel: ${value}\n<hr>`
        break
      }
      case 'cartPizza': {
        carts = carts.replace('<cartPizza>', cartPrintLayout('pizza', value))
        break
      }
      case 'cart': {
        carts = carts.replace('<cartProduct>', cartPrintLayout('product', value))
        break
      }
      case 'total': {
        footer = footer.replace('<total>', `[L]Sub-Total:[R]${value}\n[L]Total:[R]${value}\n`)
        break
      }
      case 'formPayment': {
        footer = footer.replace('<payment>', `[L]Pagamento em:[R]${value}${request.formPaymentFlag ? `(${request.formPaymentFlag})` : ''}\n`)
        break
      }
    }

  }
  text += header + carts + footer
  return text.normalize('NFC')
}

export {
  printText
}