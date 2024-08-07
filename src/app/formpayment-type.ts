export interface CartFormPaymentType {
  flags?: Flag[]
  flag?: Flag
  label: string
  status: boolean
  payment: string
  value?: number
  change?: number
  key?: Key
  addon?: AddonFormPaymentType
  paid?: boolean
  paymentId?: string
  online?: boolean
}

export interface Flag {
  code: string
  name: string
  image?: string | null
}

interface Key {
  type: string
  value: string
}

export interface ClosedValue {
  payment: string
  label: string
  value: 0
  flag?: string
}
export interface AddonFormPaymentType {
  status: boolean
  type: "fee" | "discount" | string
  valueType: "fixed" | "percentage" | string
  value: number
}
