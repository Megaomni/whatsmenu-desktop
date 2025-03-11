import React, { useState } from "react";
import PrintContext from "./PrintContext";
import { PrintEnvironmentType, ProductCategory } from "../types_print-environment";
import { Printer } from "../../@types/store";

export default function PrintProvider({ children }: any) {
  const [envId, setEnvId] = useState(0);
  const [envType, setEnvType] = useState<PrintEnvironmentType>('fiscal');
  const [envName, setEnvName] = useState('');
  const [envCategories, setEnvCategories] = useState<ProductCategory[]>([]);
  const [currentPage, setCurrentPage] = useState('main');
  const [productCategories, setProductCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [allPrinters, setAllPrinters] = useState<Printer[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<Printer>({
    name: "",
    displayName: "",
    description: "",
    status: 0,
    isDefault: false,
    options: {
      "printer-location": [
        1
      ],
      "printer-make-and-model": "",
      system_driverinfo: ""
    },
    id: "",
    silent: true,
    paperSize: 58,
    copies: 1,
    margins: {
      marginType: "none",
    },
    scaleFactor: 70
  })
  const [selectedPrinterEnvs, setSelectedPrinterEnvs] = useState([])
  const [selectedType, setSelectedType] = useState<PrintEnvironmentType>('fiscal')

  const printValue = {
    currentPage,
    setCurrentPage,
    productCategories,
    setProductCategories,
    locations,
    setLocations,
    selectedType,
    setSelectedType,
    envId,
    setEnvId,
    envType,
    setEnvType,
    envName,
    setEnvName,
    envCategories,
    setEnvCategories,
    allPrinters,
    setAllPrinters,
    selectedPrinter,
    setSelectedPrinter,
    selectedPrinterEnvs,
    setSelectedPrinterEnvs
  }

  return (
    <PrintContext.Provider value={ printValue }>
      { children }
    </PrintContext.Provider>
  )
}