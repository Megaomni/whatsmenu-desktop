import { CartFormPayment, CartType } from "./cart"
import { ProfileFee } from "./profile"
import { TableOpenedType } from "./table"

export interface CommandType {
    id: number
    tableOpenedId: number
    opened?: TableOpenedType
    tableId?: number
    name: string
    code: number
    status: boolean
    fees: ProfileFee[]
    formsPayment: CartFormPayment[]
    carts: CartType[]
    created_at: string
    updated_at: string
    // WS types only
    totalValue?: number
}