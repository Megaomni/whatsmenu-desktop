export type ClientControlsType = {
  requests: {
    total: number
    quantity: number
  }
  asaas?: AsaasClientType
}
interface AsaasClientType {
  id: string
  cards: Card[]
}

interface Card {
  type: string
  uuid?: string
  surname: string
  creditCardBrand: string
  creditCardToken?: string
  creditCardNumber: string
}
