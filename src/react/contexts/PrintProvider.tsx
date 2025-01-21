import React, { useState } from "react";
import PrintContext from "./PrintContext";
import { PrintEnvironmentType } from "../types_print-environment";

export default function PrintProvider({ children }: any) {
  const [envId, setEnvId] = useState(0);
  const [envType, setEnvType] = useState<PrintEnvironmentType>('fiscal');
  const [envName, setEnvName] = useState('');
  const [envCategories, setEnvCategories] = useState([]);
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
    setSelectedType,
    envId,
    setEnvId,
    envType,
    setEnvType,
    envName,
    setEnvName,
    envCategories,
    setEnvCategories
  }

  return (
    <PrintContext.Provider value={ printValue }>
      { children }
    </PrintContext.Provider>
  )
}