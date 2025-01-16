export type PrintEnvironmentType = 'fiscal' | 'production';

export interface PrintEnvironmentConfig {
  name: string;
  type: PrintEnvironmentType;
  productCategories?: string[];
}

export interface ProductCategory {
  id: number;
  name: string;
}

