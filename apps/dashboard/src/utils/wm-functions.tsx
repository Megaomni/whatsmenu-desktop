import React, {
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  useContext,
} from 'react'
import axios, { AxiosResponse } from 'axios'
import { DateTime } from 'luxon'
import { Session } from 'next-auth'
import { cpf, cnpj } from 'cpf-cnpj-validator'
import { WMToastProps } from '../components/WMToast'
import Table, { TableOpened } from '../types/table'
import Command from '../types/command'
import { Subscription } from '../hooks/useWebSocket'
import CartItem from '../types/cart-item'
import Complement, { ComplementType } from '../types/complements'
import Cart from '../types/cart'
import { Plan, SystemProduct } from '../types/plan'
import i18n from 'i18n'
import Profile, { ProfileOptions } from '../types/profile'

/** Retorna um hash aleatório */
export const hash = (length = 6) => {
  var result = ''
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var charactersLength = characters.length
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export const currency = ({
  value = 0,
  symbol = false,
  withoutSymbol = false,
  language = 'pt-BR',
  currency = 'BRL',
}: {
  value: number
  symbol?: boolean
  withoutSymbol?: boolean
  language?: string
  currency?: string
}) => {
  if (!value || isNaN(value)) {
    value = 0
  }

  value = value && parseFloat(value.toString())
  if (symbol) {
    return (0)
      .toLocaleString(language, {
        style: 'currency',
        currency,
      })
      .replace(/\d+(,|\.)\d+/, '')
  }

  if (withoutSymbol) {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
    })
      .format(value)
      .replace(/\D+/, '')
  }

  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency,
  }).format(value)
} //

export const getNow = ({
  timeZone,
  format,
}: { timeZone?: string; format?: string } = {}) => {
  const now = DateTime.local()
  const nowFuse = now.setZone(timeZone)
  const nowFuseFormat = now.setZone(timeZone).toFormat(format || '')
  const nowSetZero = now.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
  const nowFormat = now.toFormat(format || '')
  const nowYear = now.year
  return {
    now,
    nowFuse,
    nowFuseFormat,
    nowSetZero,
    nowFormat,
    nowYear,
  }
}

/** Formata telefone para (00) 0000-0000 ou (00) 00000-0000 */
export const maskedPhone = (contact: string) => {
  switch (i18n.language) {
    case 'pt-BR': {
      if (contact.length > 11) {
        return contact.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      }
      return contact.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    case 'en-US': {
      return contact.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '($1) $2-$3-$4')
    }
    case 'fr-CH': {
      return contact.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '($1) $2-$3-$4')
    }
    default:
      return contact
  }
}

/** Verifica a luminosidade a cor do fundo e retorna a cor da fonte de acordo com a luminosidade. Ex: (background: #000000 => color: #FFFFFF), Retorna uma cor alternativa para o fundo de encomendas/agendamentos para loja */
export const colorLuminosity = (color: string, packageA: boolean = false) => {
  if (color) {
    let r: any
    let g: any
    let b: any
    let lum: any
    let long: any
    let colorArr: any
    let background: any
    let colorS: any
    let arr = []

    colorArr = color.split('')
    long = colorArr.length > 4

    r = long
      ? parseInt(colorArr[1] + colorArr[2], 16)
      : parseInt(colorArr[1], 16) * 17
    g = long
      ? parseInt(colorArr[3] + colorArr[4], 16)
      : parseInt(colorArr[2], 16) * 17
    b = long
      ? parseInt(colorArr[5] + colorArr[6], 16)
      : parseInt(colorArr[3], 16) * 17
    lum = (r * 299 + g * 587 + b * 114) / 1000

    arr.push(r, g, b)

    if (!packageA) {
      background = color
      colorS = lum > 127.5 ? '#000000' : '#ffffff'
    } else {
      const filtrados = arr.filter((el) => el < 40)
      if (filtrados.length >= 2) {
        r < 40 && (r = 50)
        g < 40 && (g = 50)
        b < 40 && (b = 50)
      }
      lum = (r * 299 + g * 587 + b * 114) / 1000
      if (lum > 127.5) {
        r = r / 2
        g = g / 2
        b = b / 2

        lum = (r * 299 + g * 587 + b * 114) / 1000
        colorS = lum > 127.5 ? '#000000' : '#ffffff'
      } else {
        r = r + 0.3 * r
        g = g + 0.3 * g
        b = b + 0.3 * b
        lum = (r * 299 + g * 587 + b * 114) / 1000
        colorS = lum > 127.5 ? '#000000' : '#ffffff'
      }
      background = `rgb(${r}, ${g}, ${b})`
    }

    return {
      color: colorS,
      background,
    }
  }
  return {
    color: '#000',
    background: '#fff',
  }
}

/** Função auxiliar para chamadas api no next */
export async function apiRoute<T, R = any>(
  route: string,
  session?: Session | null,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET',
  data?: T,
  headers?: any,
  callback?: (result: any) => void | any | AxiosResponse<any, any>
): Promise<AxiosResponse<R, any>> {
  if (!headers) {
    headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.accessToken}`,
    }
  }

  const response = await axios(
    route.includes('://') ? route : `${process.env.WHATSMENU_API}${route}`,
    {
      headers,
      method,
      data,
    }
  )

  if (callback) {
    const result = callback(response)
    if (result !== undefined) {
      return result
    }
  }

  return response
}

/** Cria um cópia do objeto e retorna no formato escolhido */
export const copy: (
  element: unknown,
  type?: 'parse' | 'json' | 'copy'
) => any = (element, type = 'copy'): any => {
  if (type === 'parse' && typeof element === 'string') {
    return JSON.parse(element as string)
  }

  if (type === 'json') {
    return JSON.stringify(element)
  }

  if (element) {
    return JSON.parse(JSON.stringify(element))
  }
}

/** Formata e válida ( caso seja possivel ) campos do tipo selecionado. */
export const mask = (
  e: KeyboardEvent<HTMLInputElement | any> | any,
  mask: 'cpf/cnpj' | 'tel' | 'cep' | 'currency' | 'email',
  maxLength?: number
): { type: string; valid: boolean } => {
  if (
    e.key === 'Backspace' ||
    e.key === 'Delete' ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    e.key === 'Tab'
  ) {
    return { type: '', valid: false }
  }

  switch (mask) {
    case 'currency':
      e.currentTarget.maxLength = maxLength ?? 10
      e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')
      e.currentTarget.value = e.currentTarget.value.replace(
        /([0-9])([0-9]{1,2}$)/g,
        '$1.$2'
      )
      break
    case 'cep': {
      e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')
      switch (i18n.language) {
        case 'pt-PT':
        case 'pt-BR': {
          e.currentTarget.maxLength = 9
          e.currentTarget.value = e.currentTarget.value.replace(
            /^(\d{5})(\d)/g,
            '$1-$2'
          )
          break
        }
        case 'fr-CH':
        case 'en-US':
          {
            e.currentTarget.maxLength = 5
            e.target.value = e.target.value.substring(0, 5)
            e.target.value = e.target.value.replace(/^(\d{5})/, '$1')
          }
          break
      }
    }
    case 'cpf/cnpj':
      switch (i18n.language) {
        case 'pt-BR': {
          e.currentTarget.maxLength = maxLength ?? 18
          e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')
          if (e.currentTarget.value.length <= 11) {
            e.currentTarget.value = e.currentTarget.value
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
            return { type: 'CPF', valid: cpf.isValid(e.currentTarget.value) }
          } else {
            e.currentTarget.value = e.currentTarget.value
              .replace(/(\d{2})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d)/, '$1.$2')
              .replace(/(\d{3})(\d)/, '$1/$2')
              .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
            return { type: 'CNPJ', valid: cnpj.isValid(e.currentTarget.value) }
          }
        }
        case 'en-US': {
          const rawValue = e.currentTarget.value.replace(/\D/g, '') // Remove caracteres não numéricos

          if (rawValue.length <= 9) {
            e.currentTarget.maxLength = 11

            // Formatação para SSN (no formato XXX-XX-XXXX)
            e.currentTarget.value = rawValue
              .replace(/^(\d{3})(\d)/, '$1-$2') // Adiciona o primeiro hífen
              .replace(/-(\d{2})(\d)/, '-$1-$2') // Adiciona o segundo hífen
              .replace(/-(\d{4})$/, '-$1') // Adiciona o quarto grupo de dígitos

            return { type: 'SSN', valid: rawValue.length === 9 }
          } else {
            e.currentTarget.maxLength = 9

            // Formatação para EIN (no formato XX-XXXXXXX)
            e.currentTarget.value = rawValue.replace(
              /^(\d{2})(\d{7})$/,
              '$1-$2'
            )

            return { type: 'EIN', valid: rawValue.length === 9 }
          }
        }
        case 'fr-CH': {
          // Remove todos os caracteres não numéricos
          let rawValue = e.currentTarget.value.replace(/\D/g, '')

          // Garante que o número sempre comece com '756'
          if (!rawValue.startsWith('756')) {
            rawValue = '756' + rawValue.slice(3)
          }

          e.currentTarget.maxLength = 16

          // Formatação para o formato 756.XXXX.XXXX.XX
          e.currentTarget.value = rawValue
            .replace(/^(\d{3})(\d{0,4})/, '$1.$2') // Adiciona o primeiro ponto após os 3 primeiros dígitos
            .replace(/\.(\d{4})(\d{1,4})/, '.$1.$2') // Adiciona o segundo ponto após os 4 próximos dígitos
            .replace(/\.(\d{4})(\d{1,2})$/, '.$1.$2') // Adiciona os últimos 2 dígitos

          return { type: 'AVS', valid: rawValue.length === 13 }
        }
        case 'pt-PT': {
          e.currentTarget.maxLength = 9 // Permite até 11 caracteres, incluindo espaços

          e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '') // Remove todos os caracteres não numéricos

          return { type: 'NIF', valid: e.currentTarget.value.length === 9 } // Valida com base no comprimento
        }
      }

    case 'tel':
      {
        e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '')
        switch (i18n.language) {
          case 'pt-BR': {
            e.currentTarget.maxLength = 13

            if (e.currentTarget.value.length > 10) {
              e.currentTarget.value = e.currentTarget.value
                .replace(/^(\d{2})(\d)/, '$1 $2')
                .replace(/-/g, '')
                .replace(/(\d{5})(\d)/, '$1-$2')
            } else {
              e.currentTarget.value = e.currentTarget.value
                .replace(/^(\d{2})(\d)/, '$1 $2')
                .replace(/(\d{4})(\d)/, '$1-$2')
            }
            break
          }
          case 'en-US': {
            e.currentTarget.maxLength = 14

            e.currentTarget.value = e.currentTarget.value
              .replace(/\D/g, '') // Remove todos os caracteres não numéricos
              .replace(/^(\d{3})(\d{0,3})/, '($1) $2') // Adiciona parênteses e espaço
              .replace(/\s(\d{3})(\d{0,4})/, ' $1-$2') // Adiciona hífen
            break
          }
          case 'fr-CH': {
            e.currentTarget.maxLength = 12 // Permite até 12 caracteres incluindo espaços

            e.currentTarget.value = e.currentTarget.value
              .replace(/\D/g, '') // Remove todos os caracteres não numéricos
              .replace(/^(\d{2})(\d{3})(\d{2})(\d{2})$/, '$1 $2 $3 $4')

            break
          }
          case 'pt-PT': {
            e.currentTarget.maxLength = 11 // Permite até 12 caracteres, incluindo espaços

            e.currentTarget.value = e.currentTarget.value
              .replace(/\D/g, '') // Remove todos os caracteres não numéricos
              .replace(/^(\d{2})(\d)/, '$1 $2') // Adiciona espaço após os dois primeiros dígitos
              .replace(/(\d{3})(\d)/, '$1 $2') // Adiciona espaço após o terceiro dígito
              .trim() // Remove espaços extras no final, se houver

            break
          }
        }
      }
      break
    case 'email':
      // const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      e.currentTarget.value = e.currentTarget.value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      const mailformat = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/
      const valid = !mailformat.test(e.target.value)

      return { type: 'email', valid }
  }
  return { type: '', valid: false }
}

export const superNormalize = (string: string) => {
  if (!string) return
  return string
    .normalize('NFD')
    .replace(/([^a-zA-Z0-9_])/g, '')
    .toLowerCase()
}

/** Muda o viewport até o elemento desejado */
export const scrollToElement = (
  querySelector: string,
  {
    delay,
    position,
    idInputElementFocus,
    scrollIntoView,
    queryParentElement,
    differTop = 65,
  }: {
    delay?: number
    position?: 'start' | 'center' | 'end'
    idInputElementFocus?: string
    scrollIntoView?: boolean
    queryParentElement?: string
    differTop?: number
  } = { delay: 100, position: 'start', idInputElementFocus: '' }
) => {
  const elementInterval = setInterval(() => {
    const element = document.querySelector(querySelector) as HTMLElement
    const elementFocus = document.querySelector(
      idInputElementFocus || '#empty'
    ) as HTMLInputElement
    const topbar = document.getElementById('header') as HTMLElement

    if (element) {
      if (scrollIntoView) {
        element.scrollIntoView({
          block: position,
          behavior: 'smooth',
        })

        if (elementFocus) {
          elementFocus.focus()
        }
      } else {
        if (queryParentElement) {
          const parentElement = document.querySelector(
            `${queryParentElement}`
          ) as HTMLElement

          if (parentElement) {
            const distance =
              element.getBoundingClientRect().top +
              (parentElement.scrollTop + differTop)

            parentElement.scrollTo({
              top: distance,
            })
          }
        } else {
          window.scroll(
            0,
            element.getBoundingClientRect().y +
              (window?.visualViewport?.pageTop ?? 0) -
              (topbar?.clientHeight ?? 0)
          )
        }
      }

      clearInterval(elementInterval)
    }
  }, delay)
}

/** Compara Objetos, Arrays
 * @return true se todos os itens forem iguais;
 */
export const compareItems = (...props: any[]) => {
  const equals: boolean[] = []

  props.forEach((el: any, index: number, arr: any[]) => {
    if (index > 0) {
      try {
        equals.push(copy(arr[index - 1], 'json') === copy(arr[index], 'json'))
      } catch (error) {
        equals.push(!!el)
      }
    } else {
      equals.push(!!el)
    }
  })

  return equals.every((el) => el)
}

/** Seta Agendamentos/Encomenda de acordo com a propriedade label2 */
export const textPackage = (label2?: boolean, lowerCase: boolean = false) => {
  let text = label2 ? i18n.t('appointments') : i18n.t('package')

  if (lowerCase) {
    text = text.toLowerCase()
  }

  return text as 'Encomendas' | 'Agendamentos'
}

/** Verifica os planos e retorna Delivery, Encomendas ou Delivery/Encomendas */
export const textDeliveryOrPackage = (
  plansCategory: ('package' | 'basic' | 'table')[],
  label2?: boolean
) => {
  let planText = ''

  if (plansCategory.includes('basic')) {
    planText = 'Delivery'
  }

  if (plansCategory.includes('basic') && plansCategory.includes('package')) {
    planText += `/${textPackage(label2)}`
  } else if (plansCategory.includes('package')) {
    planText += textPackage(label2)
  }

  return planText as 'Delivery' | 'Encomendas' | 'Delivery/Encomendas'
}

/** Formata para url substituindo o [NOME] pelo valor de name passado */
export const encodeTextURL = (name: string, text: string) => {
  return encodeURIComponent(text.replaceAll('[NOME]', name))
}

/** Normaliza uma string para comparação removendo caracteres especiais */
export const normalizeCaracter = (
  text: string = '',
  typeFunction: 'toLowerCase' | 'toLocaleLowerCase' = 'toLowerCase'
) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    [typeFunction]()
}

type inputProps = {
  selectText?: boolean
  scroll?: boolean
  queryParentElement?: string
  differTop?: number
}
/** Busca o elemento pela query passada e seta o focus no input elemento, se o elemento for encontrado. */
export const inputFocus: (
  querySelector: string,
  data?: inputProps
) => Promise<HTMLInputElement> = (
  querySelector: string,
  {
    selectText = true,
    scroll = true,
    queryParentElement,
    differTop,
  }: inputProps = {}
) => {
  let tentatives = 0

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const element = document.querySelector(querySelector) as HTMLInputElement

      if (element) {
        element.focus({
          preventScroll: scroll,
        })

        if (queryParentElement) {
          element.focus({ preventScroll: true })

          const parentElement = document.querySelector(queryParentElement)

          if (parentElement) {
            // scroll && scrollToElement(querySelector, {
            //   queryParentElement,
            //   differTop
            // });
          }
        }

        if (selectText) {
          element.select()
        }
        clearInterval(interval)
        resolve(element)
      }

      if (tentatives >= 100) {
        clearInterval(interval)
        reject({
          message: 'Input não encontrado',
        })
      }

      tentatives++
    }, 10)
  })
}

/** Gera uma string dataURL do blob(IMAGEM) passado no parametro. */
export const blobToBase64 = async (blob: any) => {
  return new Promise((resolve, _) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

/** Retorna o ultimo elemento do array passado. */
export const getLastItem = (arr: unknown[]) => {
  return arr && arr.length ? arr[arr.length - 1] : null
}

/** Verifica se existe algum elemento com nome vázio no array passado e seta focus no input */
export const verifyEmptyNameLength = (
  arr: any[],
  prop: 'id' | 'code' = 'id',
  {
    partialQuery,
    queryParentElement,
    differTop,
  }: {
    partialQuery?: string
    queryParentElement?: string
    differTop?: number
  } = {}
) => {
  if (arr.length) {
    const el = arr.find((el: any) => el.name?.trim() === '')
    if (el && el.name?.trim() === '') {
      inputFocus(`${partialQuery}${el[prop]}`, {
        queryParentElement,
        differTop,
        scroll: true,
      })
      return true
    }
  }
}

/** Atualiza o valor do elemento html passado no parametro */
export const getAndSetterElementValue = (
  query: string,
  value: { text: any; textLength?: number; maxLength?: number },
  propObject: 'textContent' | 'innerHTML' | 'innerText' | 'value'
) => {
  const element = document.querySelector(query) as any

  element && (element[propObject] = value.text)

  if (element && value.textLength && value.maxLength) {
    value.textLength >= value.maxLength
      ? element.classList.add('text-red-500')
      : element.classList.remove('text-red-500')
  }
}

/** Verifica e pega o item se um produto existe em um outro arr (prop: string //propriedade a comparar do objeto, value: any //valor a ser buscado) */
export const getItem = (prop: any, value: any, arr: any[]) => {
  return arr.find((el) => el[prop] === value)
}

/** Função que altera as formas de caixas das fontes por atalhos, tem que ser usada no evento de teclado */
export const modifyFontValues = (
  e: KeyboardEvent,
  {
    prop,
    setUpdateHTML,
  }: { prop?: string; setUpdateHTML?: Dispatch<SetStateAction<number>> }
) => {
  const target = e.target as HTMLInputElement
  let value = target.value
  if (e.altKey) {
    e.preventDefault()
    switch (e.code) {
      case 'KeyC':
        value = value
          .toLowerCase()
          .split(' ')
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(' ')
          .trim()
        break
      case 'KeyU':
        value = value.toUpperCase().trim()
        break
      case 'KeyL':
        value = value.toLowerCase().trim()
        break
    }

    target.value = value
    if (prop) {
      prop = value
    }

    if (setUpdateHTML) {
      setUpdateHTML((upd) => upd + 1)
    }
  }
}

/** Recebe o Event e copia o texto do Event.target */
export const handleCopy = (
  e: any,
  handleShowToast: ({}: WMToastProps) => void,
  callback?: () => void
) => {
  const text =
    typeof e === 'string' ? e : (e.target as HTMLSpanElement).textContent || ''
  if (navigator.clipboard) {
    navigator.clipboard?.writeText(text.trim()).then(() => {
      handleShowToast({
        type: 'success',
        title: i18n.t('copied'),
        content: `${text} \\n ${i18n.t('copied_clipboard')}`,
        position: 'bottom-end',
        flexPositionX: 'end',
        classAdd: ' m-2 ',
      })
      if (callback) {
        callback()
      }
    })
  } else {
    handleShowToast({
      type: 'erro',
      title: i18n.t('copy_n'),
      content: i18n.t('browser_not_have_copy'),
      position: 'bottom-end',
      flexPositionX: 'end',
      classAdd: ' m-2 ',
    })
  }
}

/** Função que envia impressões da painel para o aplicativo de impressões via WS */
export const handlePrintApp = (
  clear: () => void,
  channel: Subscription,
  carts?: Cart[],
  type?: string,
  report?: boolean,
  tableConfigs?: {
    table?: Table
    opened?: TableOpened
    command?: Command | null
  }
) => {
  if (tableConfigs) {
    if ((type === 'command' || type === 'T') && tableConfigs.command) {
      tableConfigs.command.subTotal =
        tableConfigs.command.getTotalValue('command')
      tableConfigs.command.totalValue =
        tableConfigs.command.getTotalValue('commandFee')
      tableConfigs.command.lack = tableConfigs.command.getTotalValue('lack')
      tableConfigs.command.paid = tableConfigs.command.getTotalValue('paid')
      tableConfigs.command.fees = tableConfigs.command.fees.filter(
        (fee) => fee.deleted_at === null
      )
    } else if (type === 'table') {
      if (tableConfigs.opened) {
        tableConfigs.opened.subTotal =
          tableConfigs.opened.getTotalValue('table') || 0
        tableConfigs.opened.totalValue =
          tableConfigs.opened.getTotalValue('tableFee') || 0
        tableConfigs.opened.lack =
          tableConfigs.opened.getTotalValue('lack') || 0
        tableConfigs.opened.paid =
          tableConfigs.opened.getTotalValue('paid') || 0
        tableConfigs.opened.wsFormsPayment = tableConfigs.opened.formsPayment
        tableConfigs.opened.wsPerm = `${DateTime.fromSQL(tableConfigs.opened?.created_at as string).toFormat('HH:mm')}/${
          report
            ? DateTime.fromSQL(
                tableConfigs.opened?.updated_at as string
              ).toFormat('HH:mm')
            : DateTime.local().toFormat('HH:mm')
        } - ${
          report
            ? DateTime.fromSQL(tableConfigs.opened?.updated_at as string)
                .diff(
                  DateTime.fromSQL(tableConfigs.opened?.created_at as string),
                  'seconds'
                )
                .toFormat("hh'h'mm")
            : DateTime.local()
                .diff(
                  DateTime.fromSQL(tableConfigs.opened?.created_at as string),
                  'seconds'
                )
                .toFormat("hh'h'mm")
        }`
        tableConfigs.opened.updatedFees = tableConfigs.opened
          .getUpdatedFees(!report)
          .filter((fee) => fee.deleted_at === null)
        tableConfigs.opened?.commands.forEach((c) => {
          c.totalValue = c.getTotalValue('command')
        })
      }

      if (tableConfigs.table && tableConfigs.table.opened) {
        tableConfigs.table.opened.subTotal =
          tableConfigs.table.opened.getTotalValue('table') || 0
        tableConfigs.table.opened.totalValue =
          tableConfigs.table.opened.getTotalValue('tableFee') || 0
        tableConfigs.table.opened.lack =
          tableConfigs.table.opened.getTotalValue('lack') || 0
        tableConfigs.table.opened.paid =
          tableConfigs.table.opened.getTotalValue('paid') || 0
        tableConfigs.table.opened.wsFormsPayment =
          tableConfigs.table.opened.formsPayment
        tableConfigs.table.opened.wsPerm = `${DateTime.fromSQL(tableConfigs.table.opened?.created_at as string).toFormat('HH:mm')}/${
          report
            ? DateTime.fromSQL(
                tableConfigs.table.opened?.updated_at as string
              ).toFormat('HH:mm')
            : DateTime.local().toFormat('HH:mm')
        } - ${
          report
            ? DateTime.fromSQL(tableConfigs.table.opened?.updated_at as string)
                .diff(
                  DateTime.fromSQL(
                    tableConfigs.table.opened?.created_at as string
                  ),
                  'seconds'
                )
                .toFormat("hh'h'mm")
            : DateTime.local()
                .diff(
                  DateTime.fromSQL(
                    tableConfigs.table.opened?.created_at as string
                  ),
                  'seconds'
                )
                .toFormat("hh'h'mm")
        }`
        tableConfigs.table.opened.updatedFees = tableConfigs.table.opened
          .getUpdatedFees(!report)
          .filter((fee) => fee.deleted_at === null)
        tableConfigs.table?.opened?.commands.forEach((c) => {
          c.totalValue = c.getTotalValue('command')
        })
      }
    }

    channel?.wsEmit(
      'print',
      JSON.parse(JSON.stringify({ carts, type, ...tableConfigs }))
    )
  } else {
    // channel.emit("print", { requests, type })
  }

  clear()
}

/**
 * Verifica se no texto contém emoji e encripita para hex
 * @param {string} text
 * @returns texto convertido
 * */
export const encryptEmoji = (text: string) => {
  return text
  // if (!text) {
  //   text = ''
  // }
  // const rgx =
  //   /([\uD800-\uDBFF][\uDC00-\uDFFF](?:[\u200D\uFE0F][\uD800-\uDBFF][\uDC00-\uDFFF]){2,}|\uD83D\uDC69(?:\u200D(?:(?:\uD83D\uDC69\u200D)?\uD83D\uDC67|(?:\uD83D\uDC69\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]\uFE0F|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC6F\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3C-\uDD3E\uDDD6-\uDDDF])\u200D[\u2640\u2642]\uFE0F|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F\u200D[\u2640\u2642]|(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642])\uFE0F|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\uD83D\uDC69\u200D[\u2695\u2696\u2708]|\uD83D\uDC68(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708]))\uFE0F|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83D\uDC69\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|\uD83D\uDC68(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]))|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\u200D(?:(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F)/
  // return (
  //   text
  //     ?.split(rgx)
  //     .filter(Boolean)
  //     .map((el) => {
  //       if (rgx.test(el)) {
  //         //@ts-ignore
  //         return ` 0x${el.codePointAt(0).toString(16)} `
  //       }

  //       return el
  //     })
  //     .join(' ') || text
  // )
}

/**
 * Verifica se existe um emoji no texto e converte para hex
 * @param {string} text
 * @returns texto convertido
 */
export const removeEmojiString = (text: string) => {
  const rgx =
    /([\uD800-\uDBFF][\uDC00-\uDFFF](?:[\u200D\uFE0F][\uD800-\uDBFF][\uDC00-\uDFFF]){2,}|\uD83D\uDC69(?:\u200D(?:(?:\uD83D\uDC69\u200D)?\uD83D\uDC67|(?:\uD83D\uDC69\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D(?:\uD83D\uDC69\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]\uFE0F|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC6F\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3C-\uDD3E\uDDD6-\uDDDF])\u200D[\u2640\u2642]\uFE0F|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uFE0F\u200D[\u2640\u2642]|(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642])\uFE0F|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\uD83D\uDC69\u200D[\u2695\u2696\u2708]|\uD83D\uDC68(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708]))\uFE0F|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83D\uDC69\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69]))|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67)\uDB40\uDC7F|\uD83D\uDC68(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66\u200D\uD83D\uDC66|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]))|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|\uD83D\uDC68(?:\u200D(?:(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC67|(?:(?:\uD83D[\uDC68\uDC69])\u200D)?\uD83D\uDC66)|\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F)/
  return (
    text
      ?.split(rgx)
      .filter(Boolean)
      .map((el) => {
        if (rgx.test(el)) {
          //@ts-ignore
          return ''
        }

        return el
      })
      .join(' ') || text
  )
}

/**
 * Verifica se o usuário esta inativo por mais de 5 minutos e busca novamente os pedidos
 * @param { Function } callback - Função callback para ser chamada quando atingir os 5 minutos inativos
 * */

export const checkInactivity = (callback: Function) => {
  let currentMinutes = 0

  const reset = () => {
    currentMinutes = 0
  }

  const interval = setInterval(() => {
    currentMinutes += 1
    if (currentMinutes >= 5) {
      callback()
      currentMinutes = 0
    }
  }, 60000)

  window.ontouchstart = reset
  window.onpointermove = reset
  window.onkeydown = reset

  return interval
}

export const getMobileOS = () => {
  const ua = navigator.userAgent
  if (/android/i.test(ua)) {
    return 'Android'
  } else if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) {
    return 'iOS'
  }
  return 'Other'
}

export const groupCart = (
  data: Cart | CartItem[] | null,
  groupItems?: boolean
) => {
  if (data) {
    return (data instanceof Cart ? data.itens : data).reduce(
      (newItems: CartItem[], cartItem) => {
        if (groupItems) {
          switch (cartItem.type) {
            case 'default':
              const newItem = newItems.find(
                (item) =>
                  item.productId === cartItem.productId &&
                  item.details.value === cartItem.details.value &&
                  item.details.complements.length ===
                    cartItem.details.complements.length
              )
              if (newItem) {
                const allComplements = verifyEqualsComplements(
                  newItem.details.complements,
                  cartItem.details.complements
                )

                if (allComplements) {
                  newItem.quantity += cartItem.quantity
                } else {
                  newItems.push(new CartItem(cartItem))
                }
              } else {
                newItems.push(new CartItem(cartItem))
              }
              break
            case 'pizza':
              const pizza = newItems.find(
                (item) =>
                  item.pizzaId === cartItem.pizzaId &&
                  item.details.flavors.length ===
                    cartItem.details.flavors.length &&
                  item.details.implementations.length ===
                    cartItem.details.implementations.length &&
                  item.details.complements.length ===
                    cartItem.details.complements.length
              )

              const verificationOne = pizza?.details.flavors.every(
                (pizzaFlavor) =>
                  cartItem.details.flavors?.some(
                    (elPizzaFlavor) => elPizzaFlavor.code === pizzaFlavor.code
                  )
              )
              const verificationTwo = cartItem.details.flavors?.every(
                (pizzaFlavor) =>
                  pizza?.details.flavors?.some(
                    (elPizzaFlavor) => elPizzaFlavor.code === pizzaFlavor.code
                  )
              )

              const implementations = pizza?.details.implementations?.every(
                (pizzaImplementation) =>
                  cartItem.details?.implementations.some(
                    (elPizzaImplementation) =>
                      elPizzaImplementation.code === pizzaImplementation.code
                  )
              )
              if (
                verificationOne &&
                verificationTwo &&
                implementations &&
                pizza
              ) {
                pizza.quantity += cartItem.quantity
              } else {
                newItems.push(new CartItem(cartItem))
              }
              break
          }
        } else {
          newItems.push(new CartItem(cartItem))
        }

        return newItems
      },
      []
    )
  }

  return []
}

export const groupAllCarts = (carts: Cart[]) => {
  const cartsToDelivery = carts.filter((cart) => cart.addressId)
  const cartsToLocal = carts.filter((cart) => !cart.addressId)
  return {
    cartDelivery: cartsToDelivery.flatMap((cart) =>
      cart.itens
        .filter((item) => item.type === 'default')
        .map((oldCartItem) => new CartItem(oldCartItem))
        .flat()
    ),
    cartDeliveryLocal: cartsToLocal.flatMap((cart) =>
      cart.itens
        .filter((item) => item.type === 'default')
        .map((oldCartItem) => new CartItem(oldCartItem))
        .flat()
    ),
    cartPizza: cartsToDelivery.flatMap((cart) =>
      cart.itens
        .filter((item) => item.type === 'pizza')
        .map((oldCartItem) => new CartItem(oldCartItem))
        .flat()
    ),
    cartPizzaLocal: cartsToLocal.flatMap((cart) =>
      cart.itens
        .filter((item) => item.type === 'pizza')
        .map((oldCartItem) => new CartItem(oldCartItem))
        .flat()
    ),
  }
}

export const verifyEqualsComplements = (
  complements: Complement[] | ComplementType[],
  complementsVerify: Complement[] | ComplementType[]
) => {
  return complements.every((compl) => {
    return complementsVerify.some((complV) => {
      if (
        complV.id === compl.id &&
        compl.itens.length === complV.itens.length
      ) {
        return complV.itens.every((cvItem) =>
          compl.itens.some(
            (cItem) =>
              cItem.code === cvItem.code && cItem.quantity === cvItem.quantity
          )
        )
      }
    })
  })
}

/**
 * Caso não seja passado o priceId, @return preço padrão do produto
 */
export const getProductAndPrice = (data: {
  systemProducts?: SystemProduct[]
  productId?: number
  priceId?: string
  product?: SystemProduct
}) => {
  if (data.productId && data.priceId && data.systemProducts) {
    const product = data.systemProducts.find(
      (prod) => prod.id === data.productId
    )
    const price = product?.operations.prices.find(
      (pr) => pr.id === (data.priceId ?? product?.default_price)
    )

    return {
      product,
      price,
    }
  } else {
    const price = data.product?.operations.prices.find(
      (pr) => pr.id === (data.priceId ?? data.product?.default_price)
    )
    return {
      product: data.product,
      price,
    }
  }
}

export const getPlanProperty = ({
  plan,
  currency = 'brl',
  period = 'monthly',
  products,
}: {
  plan: Plan
  currency: string
  products: SystemProduct[]
  period: 'monthly' | 'semester' | 'yearly'
}) => {
  const product = products.find(
    (prod) => prod.plan_id === plan.id && prod.operations.type === period
  )
  const price = product?.operations.prices.find(
    (price) => price.id === product.default_price
  )
  const price_id = price?.id

  if (product && price && price.currencies) {
    const currencyObj = price.currencies[currency ?? price.default_currency]

    const valuePrice = currencyObj.unit_amount
    const planValue = valuePrice ? valuePrice / 100 : plan[period]

    return {
      price_id,
      planValue,
      product_id: product.id,
    }
  }

  return {
    planValue: plan[period],
  }
}

export class WmFunctions extends React.Component {
  render() {
    return <></>
  }
}
