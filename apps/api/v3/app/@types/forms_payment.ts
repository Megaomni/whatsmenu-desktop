type CardsType = {
  flags: Array<{
    code: string
    name: string
    image: string | null
  }>
} & (
  | {
      label: 'Cartão'
      payment: 'card'
    }
  | {
      label: 'Crédito'
      payment: 'credit'
    }
  | {
      label: 'Débito'
      payment: 'debit'
    }
  | {
      label: 'Vale Alimentação'
      payment: 'snack'
    }
  | {
      label: 'Vale Refeição'
      payment: 'food'
    }
)

type PixOrPicPayType = {
  key: {
    type: string
    value: string
  }
} & (
  | {
      label: 'Pix'
      payment: 'pix'
    }
  | {
      label: 'PicPay'
      payment: 'picpay'
    }
)

export type FormsPaymentType = (
  | {
      label: 'Dinheiro'
      payment: 'money'
    }
  | CardsType
  | PixOrPicPayType
) & {
  status: boolean
  addon: {
    type: 'fee' | 'discount'
    value: number
    status: boolean
    valueType: 'fixed' | 'percentage'
  }
}
