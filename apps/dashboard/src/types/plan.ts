type PricePlan = {
  [key: string]: {
    value: number
    product?: {
      name: string
      description: string
      default_price: string
      gateways: {
        [key: string]: {
          id: string
          status: 0 | 1
        }
      }
      prices: {
        id: string
        default_currency: string
        gateways: {
          [key: string]: {
            id: string
            status: 0 | 1
          }
        }
        currencies: {
          [key: string]: {
            unit_amount: number
          }
        }
      }[]
    }
  }
}

export interface Plan {
  [key: string]: any
  id: number
  name: string
  type: 'register' | 'upgrade'
  category: 'basic' | 'table' | 'package'
  monthly: number
  semester: number
  yearly: number
  status: number
  relateds: Plan[]
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface SelectedPlan {
  plan_category: string
  plan_id: number
  plan_upgrade: number[]
  plan_delete?: number[]
}

export interface SystemProduct {
  id: number
  plan_id?: number
  name: string
  description: string
  default_price: string
  status: boolean
  service: string
  operations: {
    type?: string
    gateways: {
      [key: string]: {
        id: string
        status: 0 | 1
      }
    }
    prices: {
      id: string
      default_currency: string
      status?: boolean
      gateways: {
        [key: string]: {
          id: string
          status: 0 | 1
        }
      }
      currencies: {
        [key: string]: {
          unit_amount: number
        }
      }
    }[]
  }
}
