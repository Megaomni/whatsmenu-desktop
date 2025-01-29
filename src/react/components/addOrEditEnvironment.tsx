import React, { useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PrintEnvironmentConfig, PrintEnvironmentType, ProductCategory } from '../types_print-environment'
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn-ui/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../shadcn-ui/components/ui/form"
import { Input } from "../shadcn-ui/components/ui/input"
import { RadioGroup, RadioGroupItem } from "../shadcn-ui/components/ui/radio-group"
import { Button } from "../shadcn-ui/components/ui/button"
import { Checkbox } from "../shadcn-ui/components/ui/checkbox"
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
    if (currentPage === "add") {
      setEnvCategories([]);
    }

    if (currentPage === "edit") {
      form.setValue('name', envName);
      setSelectedType(envType);
      form.setValue('type', envType);
    }

  }, [])

  const handleCategoriesChange = (categoryId: number) => {
    const foundCat = productCategories.find((cat) => cat.id === categoryId);
    if (envCategories.some((cat) => cat.id === foundCat.id)) {
      setEnvCategories(envCategories.filter((cat) => cat.id !== foundCat.id));
    } else {
      setEnvCategories([...envCategories, { id: foundCat.id, name: foundCat.name }]);
    }
  };

  const onUpdate = (data: PrintEnvironmentConfig) => {
    window.DesktopApi.onUpdatePrint({
        id: envId,
        type: data.type,
        name: data.name,
        categories: envCategories
      })
    setCurrentPage('main');
  }

  const onSubmit = (data: PrintEnvironmentConfig) => {
      window.DesktopApi.onSubmitPrint({
        id: 0,
        type: data.type,
        name: data.name,
        categories: envCategories,
      });
      setCurrentPage('main');
    }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{currentPage === 'edit' ? "Editar Ambiente de Impressão" : "Configuração de Ambiente de Impressão"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(currentPage === 'edit' ? onUpdate : onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Impressão</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value: PrintEnvironmentType) => {
                        field.onChange(value)
                        setSelectedType(value)
                        setEnvType(value)
                      }}
                      defaultValue={currentPage === 'edit' ? envType : field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fiscal" className='focus:ring-black'/>
                        </FormControl>
                        <FormLabel className="font-normal">
                          Impressão Fiscal
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="production" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Impressão de Produção de Pedido
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Ambiente</FormLabel>
                  <FormControl>
                    <Input
                      onChange={(e) => setEnvName(e.target.value)}
                      placeholder="Digite o nome do ambiente"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedType === 'production' && (
              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <FormLabel>Categorias de Produtos</FormLabel>
                    <FormDescription>
                      Selecione as categorias de produtos para incluir na impressão.
                    </FormDescription>
                    <div className="space-y-2">
                      {productCategories.map((category) => (
                        <FormField
                          key={category.id.toString()}
                          control={form.control}
                          name="categories"
                          render={() => {
                            return (
                              <FormItem
                                key={category.id.toString()}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={envCategories.some((cat) => cat.id === category.id)}
                                    onCheckedChange={() => handleCategoriesChange(category.id)}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {category.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit">Salvar Edição</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}