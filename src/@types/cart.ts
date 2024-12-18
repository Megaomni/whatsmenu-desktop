import { CommandType } from "./command"
import { ProfileFormPayment } from "./profile"
import { TableOpenedType } from "./table"

export interface CartType {
    id: number
    profileId: number
    clientId?: number
    client?: any
    addressId?: number
    address?: any
    cupomId?: number
    cupom?: CupomType
    commandId?: number
    command?: CommandType
    bartenderId?: number
    bartender?: BartenderType
    cashierId?: number
    cashier?: any
    motoboyId?: number
    motoboy?: any
    secretNumber?: string
    code: string
    status: null | 'transport' | 'production' | 'canceled' | 'motoboy'
    obs?: any
    type: 'D' | 'T' | 'P'
    taxDelivery: number
    timeDelivery: string
    formsPayment: CartFormPayment[]
    print: number
    tentatives: number
    total: number
    controls: Controls
    statusPayment: 'paid' | 'pending' | 'canceled' | 'offline'
    packageDate?: any
    created_at: string
    updated_at: string
    itens: CartItemType[]
    origin?: 'whatsmenu' | 'portal' | 'ifood'
    ifoodStatus?: string
    ifoodAditionalInfo?: IfoodOrderType['additionalInfo']
    taxIfood?: number
    orderId?: string
    sendMB?: boolean
}

export interface CartFormPayment extends ProfileFormPayment {
    value: number
    label: string
    change?: number
    code?: string
    flag?: { code: string; image: string; name: string }
    paid?: boolean
    paymentId?: string
    online?: boolean
}

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

export interface BartenderType {
    id: number
    profileId: number
    name: string
    password: string
    status: boolean
    controls: any
    cashiers?: CashierType[]
    deleted_at: null | string
    created_at: string
    updated_at: string
    defaultCashier: boolean
}

export interface Controls {
    pickupCode?: string | null
    grovenfe?: {
        fiscal_note: any
    }
}

export interface CartItemType {
    id: number
    cartId: number
    productId: number | null
    pizzaId: number | null
    type: 'pizza' | 'default'
    quantity: number
    obs: string
    details: Details
    name: string
    controls: Controls
    deleted_at?: any
    created_at: string
    updated_at: string
}

export interface Details {
    value: number
    isPromote?: boolean
    complements: ComplementType[]
    ncm_code?: string
    implementations: PizzaImplementationType[]
    flavors: PizzaFlavorType[]
    sizeCode?: string
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

export interface PizzaImplementationType {
    code: string
    name: string
    value: number
    status: boolean
}

export interface PizzaFlavorType {
    code: string
    amount?: number
    amount_alert?: number
    bypass_amount?: boolean
    name: string
    description: string
    image: string
    status: boolean
    complements?: ComplementType[]
    implementations?: PizzaImplementationType[]
    values: {
        [key: string]: number | string
    }
    valuesTable: {
        [key: string]: number | string
    }
    // category?: Category;
}

export interface IfoodOrderType {
    id: number
    orderId: string
    orderStatus: string
    statusCode: string
    merchantId: string
    customerId: string
    customer: any
    paymentId: string
    payements: any
    displayId: string
    orderTiming: 'SCHEDULED' | 'IMMEDIATE'
    orderType: 'DELIVERY' | 'INDOOR' | 'TAKEOUT'
    delivery: IfoodOrderDelivery
    total: IfoodOrderTotal
    itens: any[]
    additionalInfo: IfoodOrderAdditionalInfo
    createdAt: string
    updatedAt: string
    payments: any[]
    extraInfo: string
    preparationStartDateTime: string
    benefits: any[]
}

export interface IfoodOrderDelivery {
    mode: string
    deliveredBy: string
    deliveryDateTime: string
    observations: string
    deliveryAddress: IfoodOrderDeliveryAddress
    pickupCode: string
}

export interface IfoodOrderTotal {
    additionalFees: number
    subTotal: number
    deliveryFee: number
    benefits: number
    orderAmount: number
}

export interface IfoodOrderAdditionalInfo {
    schedule?: {
        deliveryDateTimeStart: string
        deliveryDateTimeEnd: string
    }
    metadata: {
        deliveryProduct: string
        logisticProvider: string
        message?: string
        alternatives?: any
        benefits?: [
            {
                sponsorshipValues: [
                    {
                        name: string
                        value: number
                        description: string
                    },
                ]
            },
        ]
    }
}

export interface IfoodOrderDeliveryAddress {
    streetName: string
    streetNumber: string
    formattedAddress: string
    neighborhood: string
    complement: string
    postalCode: string
    city: string
    state: string
    country: string
    reference: string
    coordinates: {
        latitude: string
        longitude: string
    }
}

export interface CashierType {
    id: number
    profileId: number
    bartenderId: number
    initialValue: number
    transactions: TransactionType[]
    carts: CartType[]
    openeds: TableOpenedType[]
    closedValues_user: any
    closedValues_system: any
    closed_at: null
    created_at: string
    updated_at: string
}

export interface TransactionType {
    obs: string
    type: 'income' | 'outcome'
    value: number
    finality?: string
    finalityLabel?: string
    created_at: string
    formatedDate?: string
}

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