export interface CupomType {
  id?: number
  profileId?: number
  code: string
  type: 'value' | 'percent' | 'freight' | string
  firstOnly: boolean
  value: number | string
  minValue: number | string
  status: number
  deleted_at?: string
  created_at?: string
  updated_at?: string
}

/** Classe para os cupons */
export default class Cupom {
  id?: number
  profileId?: number
  code: string
  type: 'value' | 'percent' | 'freight' | string
  firstOnly: boolean
  value: number | string
  minValue: number | string
  status: number
  deleted_at?: string
  created_at?: string
  updated_at?: string

  constructor(cupom: CupomType) {
    this.id = cupom.id
    this.profileId = cupom.profileId
    this.code = cupom.code
    this.type = cupom.type
    this.firstOnly = cupom.firstOnly
    this.value = cupom.value
    this.minValue = cupom.minValue
    this.status = cupom.status
    this.deleted_at = cupom.deleted_at
    this.created_at = cupom.created_at
    this.updated_at = cupom.updated_at
  }
}
