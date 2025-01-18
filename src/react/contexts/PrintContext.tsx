import { createContext, Dispatch, SetStateAction } from "react";
import { PrintEnvironmentConfig, PrintEnvironmentType, ProductCategory } from "../types_print-environment";

interface PrintTypes {
  currentPage: string;
  setCurrentPage: Dispatch<SetStateAction<string>>
  productCategories: ProductCategory[];
  setProductCategories: Dispatch<SetStateAction<ProductCategory[]>>
  locations: PrintEnvironmentConfig[];
  setLocations: Dispatch<SetStateAction<PrintEnvironmentConfig[]>>
  selectedType: PrintEnvironmentType;
  setSelectedType: Dispatch<SetStateAction<PrintEnvironmentType>>;
  id: number;
  setId: Dispatch<SetStateAction<number>>;
  type: PrintEnvironmentType;
  setType: Dispatch<SetStateAction<PrintEnvironmentType>>;
  envName: string;
  setEnvName: Dispatch<SetStateAction<string>>;
  envCategories: string[];
  setEnvCategories: Dispatch<SetStateAction<string[]>>
}

const PrintContext = createContext<PrintTypes | undefined>(undefined);

export default PrintContext;