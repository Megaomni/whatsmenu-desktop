export type PrintEnvironmentType = 'fiscal' | 'production';

export interface PrintEnvironmentConfig {
  id: number;
  type: PrintEnvironmentType;
  name: string;
  categories?: string[];
}

export interface ProductCategory {
  id: number;
  name: string;
}

