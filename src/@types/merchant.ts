export interface MerchantType {
    id: number
    merchantId: string
    name: string
    wm_id: number
    controls: ControlsType
    status: boolean
    created_at: string
    updated_at: string
}

type ControlsType = {
    dateTokenCreated: string
}