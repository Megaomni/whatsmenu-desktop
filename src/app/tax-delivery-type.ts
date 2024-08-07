export interface NeighborhoodType {
    code: string
    name: string
    time: string
    value: number
}
export interface TaxDeliveryType extends CityType {
    code?: string;
    distance?: any;
    time?: string;
    value?: number;
}

export interface CityType {
    city: string;
    code?: string;
    neighborhoods: NeighborhoodType[];
}
