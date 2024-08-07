export interface CupomType {
    id: number;
    profileId: number;
    code: string;
    type: 'value' | 'percent' | 'freight';
    value: number;
    minValue: number;
    status: boolean;
    firstOnly?: boolean;
    deleted_at?: string;
}
