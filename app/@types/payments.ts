// export type Payments = {
//     id: number
//     orderId: string
//     prepaid: number
//     pending: number
//     methods: {
//       value: number
//       currency: string
//       method: string
//       prepaid: boolean
//       type: string
//       cash: {
//         changeFor: number
//       }
//     }[]
//     additionalFees: {
//       type: string
//       description: string
//       fullDescription: string
//       value:number
//       liabilities: { name: IFOOD, percentage: 100 }[]
//     }[]
// }

export interface PaymentsMethods {
  value: number
  currency: string
  method: string
  prepaid: boolean
  type: string
  cash: {
    changeFor: number
  }
}

export interface PaymentAdditionalFees {
  liabilities: { name: string; percentage: 100 }[]
}
