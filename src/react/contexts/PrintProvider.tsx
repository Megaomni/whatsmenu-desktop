import React, { useState } from "react";
import PrintContext from "./PrintContext";
import { PrintEnvironmentType } from "../types_print-environment";

export default function PrintProvider({ children }: any) {
  const [currentPage, setCurrentPage] = useState('main');
  const [productCategories, setProductCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedType, setSelectedType] = useState<PrintEnvironmentType>('fiscal')

  const printValue = {
    currentPage,
    setCurrentPage,
    productCategories,
    setProductCategories,
    locations,
    setLocations,
    selectedType,
    setSelectedType
  }

  return (
    <PrintContext.Provider value={ printValue }>
      { children }
    </PrintContext.Provider>
  )
}