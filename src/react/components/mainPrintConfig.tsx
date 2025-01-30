import React, { useEffect, useContext, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn-ui/components/ui/card"
import { Button } from "../shadcn-ui/components/ui/button"
import PrintContext from '../contexts/PrintContext'
import { PrintEnvironmentConfig } from '../types_print-environment'
import AddOrEditEnvironment from './addOrEditEnvironment'
import { Printer } from '../../@types/store'
import PrintersEnvironments from './printersEnvironments'

export default function MainPrintConfig() {
    const context = useContext(PrintContext);
    const [showPrinters, setShowPrinters] = useState(false);

    if (!context) {
      throw new Error('PrintContext must be used within a PrintProvider');
    }

    const {
      setEnvId, 
      setEnvType, 
      setEnvName, 
      setEnvCategories, 
      currentPage, 
      setCurrentPage, 
      setProductCategories, 
      setLocations, 
      locations, 
      allPrinters,
      setAllPrinters,
      setSelectedPrinter
    } = context;

    useEffect(() => {
      window.DesktopApi.onCategoriesChange((_, categories) => {
        setProductCategories(categories);
      });

      window.DesktopApi.onPrinterLocationsChange((_, locations) => {
        setLocations(locations);
      });

      window.DesktopApi.onPrinterChange((_, printers) => {
        setAllPrinters(printers);
      });
      
      window.DesktopApi.getAllPrinters();
      window.DesktopApi.getCategories();
      window.DesktopApi.getPrinterLocations();
    }, [locations]);

    const handleRemovePrint = (id: number) => {
      if (id === 1) return alert('Ambiente caixa não pode ser removido.');
      window.DesktopApi.onRemovePrint(id);
    }

    const handleUpdatePrint = (location: PrintEnvironmentConfig) => {
      if (location.id === 1) return alert('Ambiente Caixa não pode ser atualizado.');
      setEnvId(location.id);
      setEnvType(location.type);
      setEnvName(location.name);
      setEnvCategories(location.categories || []);
      setCurrentPage('edit');
    }

    const handleUpdatePrinterEnvironments = (printer: Printer) => {
      setSelectedPrinter(printer);
      setCurrentPage('printer');
    }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      { currentPage === 'main' && (
        <div>
          <CardHeader className='flex'>
            <div className='flex flex-row justify-between items-center'>
              <CardTitle className='font-bold'>Ambiente de Impressão</CardTitle>
              <Button className='px-10 py-6 bg-black hover:bg-gray-800' onClick={() => setCurrentPage('add')}>Cadastrar Ambiente</Button>
            </div>
            <Button className='px-10 py-6 my-52 bg-black hover:bg-gray-800' onClick={() => setShowPrinters(!showPrinters)}>Configurar Impressoras</Button>
          </CardHeader>

          { showPrinters && (
            <CardContent>
            <CardTitle className='mt-6'>Impressoras</CardTitle>

            <div className='h-1 rounded-full w-full bg-black mt-2' />

            {allPrinters.map((printer, index) => (
              <div className={`flex flex-row justify-between items-center h-16 ${index % 2 !== 0 && 'bg-gray-100'}`}>
                <p className='ml-2 text-lg text-blue-700 font-semibold'>
                  {printer.name}
                </p>
                <div>
                  <Button
                    className='font-semibold text-lg bg-transparent hover:bg-transparent text-blue-700'
                    onClick={() => handleUpdatePrinterEnvironments(printer)}
                  >
                    Editar
                  </Button>
                </div>
              </div>
            ))}
            </CardContent>
          )}

          <CardContent>
            <CardTitle className='mt-6'>Ambiente</CardTitle>

            <div className='h-1 rounded-full w-full bg-black mt-2' />

            {locations.map((location, index) => (
              <div className={`flex flex-row justify-between items-center h-16 ${index % 2 !== 0 && 'bg-gray-100'}`}>
                <p className='ml-2 text-lg text-blue-700 font-semibold'>
                  {location.name}
                </p>
                <div>
                  <Button
                    className='font-semibold text-lg bg-transparent hover:bg-transparent text-blue-700'
                    onClick={() => handleUpdatePrint(location)}
                  >
                    Editar
                  </Button>
                  <Button
                    className='font-semibold text-lg bg-transparent hover:bg-transparent text-red-600'
                    onClick={() => handleRemovePrint(location.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </div>
      )}
      { currentPage === 'printer' && <PrintersEnvironments /> }
      { (currentPage === 'edit' || currentPage === 'add') && <AddOrEditEnvironment /> }
    </Card>
  )
}