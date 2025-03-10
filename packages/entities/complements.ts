export interface ItemComplementType {
  code: string
  amount?: number
  bypass_amount?: boolean
  amount_alert?: number
  name: string
  value: number
  status: boolean
  description: string
  quantity?: number
}

export interface ComplementType {
  id?: number
  name: string
  type: 'default' | 'pizza'
  order: number
  min: number
  max: number
  required: boolean
  itens: ItemComplementType[]
  vinculate?: {
    link: boolean
    code: string
  }
  pivot?: {
    complementId: number
    productId: number
  }
  created_at?: string
  updated_at?: string
}

export default class Complement {
  id?: number
  type: 'default' | 'pizza'
  name: string
  order: number
  min: number
  max: number
  vinculate?: {
    link: boolean
    code: string
  }
  required: boolean
  itens: ItemComplementType[]
  pivot?: {
    complementId: number
    productId: number
  }
  created_at?: string
  updated_at?: string

  constructor(complement: ComplementType) {
    ; (this.id = complement.id),
      (this.name = complement.name),
      (this.type = complement.type),
      (this.order = complement.order),
      (this.min = complement.min),
      (this.max = complement.max),
      (this.required = complement.required),
      (this.itens = complement.itens ?? []),
      (this.pivot = complement.pivot),
      (this.created_at = complement.created_at),
      (this.updated_at = complement.updated_at)

    this.itens.forEach((item) => {
      item.value = Number(item.value ?? 0)
      item.amount_alert = item.amount_alert ?? 0
      item.description = item.description ?? ''
    })
  }

  /** Verifica se existem outros complementos com mesmo id e determina se é vinculado, se modifyComplements a função altera os complementos iguais
   *
   * @param {Complement[]} complements - Array de complementos
   * @param {boolean | undefined} modifyComplements - Verdadeiro ou falso para modificação dos complementos
   *
   **/

  public isLinked = (complements: Complement[], modifyComplements?: boolean) => {
    const allComplements = complements.filter((comp) => comp.id === this.id)
    if (modifyComplements) {
      allComplements.forEach((compl) => {
        compl.name = this.name
        compl.max = this.max
        compl.min = this.min
        compl.itens = this.itens
        compl.required = this.required
      })
    }

    return allComplements.length > 1
  }

  public getTotal() {
    let total = 0

    for (const item of this.itens) {
      total += item.quantity ? item.value * item.quantity : item.value
    }

    return total
  }

  static removeProps = (complement: Complement) => {
    //Props Deletadas
    const { id: deletedId, created_at, updated_at, pivot, ...newComplement } = complement
    return newComplement
  }

  static toDuplicate(complements: Complement[]) {
    return complements.map((comp) => {
      return {
        name: comp.name,
        max: comp.max,
        min: comp.min,
        itens: comp.itens,
        required: comp.required,
        order: comp.order,
      }
    })
  }

  static verifyEqualsComplements = (complements: Complement[] | ComplementType[], complementsVerify: Complement[] | ComplementType[]) => {
    return complements.every((compl) => {
      return complementsVerify.some((complV) => {
        if (complV.id === compl.id && compl.itens.length === complV.itens.length) {
          return complV.itens.every((cvItem) => compl.itens.some((cItem) => cItem.code === cvItem.code && cItem.quantity === cvItem.quantity))
        }
      })
    })
  }
}
