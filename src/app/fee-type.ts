export interface FeeType {
  id?: number | null;
  code: string | null;
  profileId?: number | null;
  type: "percent" | "fixed" | null;
  value: number;
  quantity?: number;
  oldQuantity?: number;
  status: boolean | null;
  automatic: boolean;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}
