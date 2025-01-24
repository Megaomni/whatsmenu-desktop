import React, { useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PrintEnvironmentConfig } from '../types_print-environment'
import PrintContext from '../contexts/PrintContext'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['fiscal', 'production'] as const),
  categories: z.array(z.string()).optional(),
})

export default function AddOrEditEnvironment() {
    const context = useContext(PrintContext);

    if (!context) {
      throw new Error('PrintContext must be used within a PrintProvider');
    }

    const {
      envId,
      envType,
      setEnvType,
      envName,
      setEnvName,
      envCategories,
      setEnvCategories,
      currentPage,
      setCurrentPage,
      selectedType,
      setSelectedType,
      productCategories
    } = context;

  const form = useForm<PrintEnvironmentConfig>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'fiscal',
      categories: [],
    },
  })

  useEffect(() => {
    if (currentPage !== 'edit') return;

    form.setValue('name', envName);
    setSelectedType(envType);
    form.setValue('type', envType);
  }, [])

  const handleCategoriesChange = (category: string) => {
    if (envCategories.includes(category)) {
      setEnvCategories(envCategories.filter((cat) => cat !== category));
    } else {
      setEnvCategories([...envCategories, category]);
    }
  }

  const onUpdate = (data: PrintEnvironmentConfig) => {
    console.log('Dados do formulário:', data)
    window.DesktopApi.onUpdatePrint({
        id: envId,
        type: data.type,
        name: data.name,
        categories: envCategories
      })
    setCurrentPage('main');
  }

  const onSubmit = (data: PrintEnvironmentConfig) => {
      console.log('Dados do formulário:', data)
      window.DesktopApi.onSubmitPrint(data);
      setCurrentPage('main');
    }

    return (
      <div className="w-full max-w-2xl mx-auto border rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold">
            {currentPage === 'edit' ? "Editar Ambiente de Impressão" : "Configuração de Ambiente de Impressão"}
          </h2>
        </div>
        <form
          onSubmit={form.handleSubmit(currentPage === 'edit' ? onUpdate : onSubmit)}
          className="space-y-6"
        >
          {/* Tipo de Impressão */}
          <div>
            <label className="block text-sm font-medium">Tipo de Impressão</label>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="type"
                  value="fiscal"
                  checked={selectedType === 'fiscal'}
                  onChange={() => {
                    setSelectedType('fiscal');
                    setEnvType('fiscal');
                    form.setValue('type', 'fiscal');
                  }}
                />
                <label className="font-normal">Impressão Fiscal</label>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="type"
                  value="production"
                  checked={selectedType === 'production'}
                  onChange={() => {
                    setSelectedType('production');
                    setEnvType('production');
                    form.setValue('type', 'production');
                  }}
                />
                <label className="font-normal">Impressão de Produção de Pedido</label>
              </div>
            </div>
          </div>
    
          {/* Nome do Ambiente */}
          <div>
            <label htmlFor="env-name" className="block text-sm font-medium">
              Nome do Ambiente
            </label>
            <input
              type="text"
              id="env-name"
              name="name"
              className="block w-full border rounded p-2"
              placeholder="Digite o nome do ambiente"
              value={envName}
              onChange={(e) => {
                setEnvName(e.target.value);
                form.setValue('name', e.target.value);
              }}
            />
          </div>
    
          {/* Categorias de Produtos */}
          {selectedType === 'production' && (
            <div>
              <label className="block text-sm font-medium">Categorias de Produtos</label>
              <p className="text-sm text-gray-600">
                Selecione as categorias de produtos para incluir na impressão.
              </p>
              <div className="space-y-2">
                {productCategories.map((category) => (
                  <div key={category.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={`category-${category.id}`}
                      value={category.name}
                      checked={envCategories.includes(category.name)}
                      onChange={() => handleCategoriesChange(category.name)}
                    />
                    <label htmlFor={`category-${category.id}`} className="font-normal">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
    
          {/* Botão de Submissão */}
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {currentPage === 'edit' ? 'Salvar Edição' : 'Salvar'}
          </button>
        </form>
      </div>
    );
}