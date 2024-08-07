export interface DeliveryType {
    formPayment: string;
    formPaymentFlag?: string;
    transshipment: string;
    name: string;
    contact: string;
    zipCode: string;
    street: string;
    number: string;
    id?:number | null;
    complement: string;
    reference: string;
    neighborhood: string;
    city: string;
    uf?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    distance: number;
    textAddress?: string;
}
