import { CartFormPayment } from "./cart"
import { CommandType } from "./command"
import { ProfileFee } from "./profile"

export interface TableType {
    id: number
    profileId: number
    name: string
    status: boolean
    tablesOpened?: TableOpenedType[]
    opened?: TableOpenedType
    deleted_at: string | null
    created_at: string
    updated_at: string
}

export interface TableOpenedType {
    id: number
    tableId: number
    table?: TableType
    status: boolean
    fees: ProfileFee[]
    formsPayment: CartFormPayment[]
    commands: CommandType[]
    perm?: string
    created_at: string
    updated_at: string
    // WS types only
    wsFormsPayment?: CartFormPayment[]
    wsPerm?: any
    updatedFees?: ProfileFee[]
    totalValue?: number
    subTotal?: number
    lack?: number
    paid?: number
}