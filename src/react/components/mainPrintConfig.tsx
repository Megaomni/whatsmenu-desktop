import React, { useEffect, useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn-ui/components/ui/card"
import { Button } from "../shadcn-ui/components/ui/button"
import AddNewEnvironment from './addNewEnvironment'
import PrintContext from '../contexts/PrintContext'

export default function MainPrintConfig() {
    const context = useContext(PrintContext);

    if (!context) {
      throw new Error('PrintContext must be used within a PrintProvider');
    }

    const { currentPage, setCurrentPage, setProductCategories, setLocations, locations } = context;

    useEffect(() => {
      window.DesktopApi.onCategoriesChange((_, categories) => {
        setProductCategories(categories);
      });

      window.DesktopApi.onPrinterLocationsChange((_, locations) => {
        setLocations(locations);
      });

      // window.DesktopApi.onRemovePrint( id da localização );

      // window.DesktopApi.onUpdatePrint({
      //   id: 3,
      //   type: "production",
      //   name: "Fifinha dos Cria",
      //   categories: [
      //     "Bebidas",
      //   ]
      // })

      window.DesktopApi.getCategories();
      window.DesktopApi.getPrinterLocations();
    }, [locations]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      { currentPage === 'main' && (
        <div>
          <CardHeader className='text-center'>
            <CardTitle>Configuração de Ambiente de Impressão</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCurrentPage('add')}>Adicionar Ambiente de Impressão</Button>

            <CardTitle className='text-center mt-6'>Ambientes de Impressão Cadastrados</CardTitle>
            {locations.map((location) => (
              <Card className="flex-row items-center my-4">
                <CardContent className='text-xl'>
                  {location.name}
                </CardContent>
              </Card>
            ))}
          </CardContent>

        </div>
      )}
      {currentPage === 'add' && <AddNewEnvironment />}
    </Card>
  )
}