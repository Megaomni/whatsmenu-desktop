export interface AddressType {
  id?: number;
  street: string;
  number: string | number;
  zipcode?: string | null;
  complement?: string;
  reference?: string;
  uf?: string;
  city: string;
  distance: number;
  neighborhood: string;
  controls?: any;
  created_at?: string;
  deleted_at?: string;
  updated_at?: string;
}