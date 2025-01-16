import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PrintEnvironmentConfig, PrintEnvironmentType, ProductCategory } from './types_print-environment'
import { Card, CardContent, CardHeader, CardTitle } from "./shadcn-ui/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./shadcn-ui/components/ui/form"
import { Input } from "./shadcn-ui/components/ui/input"
import { RadioGroup, RadioGroupItem } from "./shadcn-ui/components/ui/radio-group"
import { Button } from "./shadcn-ui/components/ui/button"
import { Checkbox } from "./shadcn-ui/components/ui/checkbox"
import { createRoot } from 'react-dom/client'


const root = createRoot(document.body);

// Mock data for product categories
// const productCategories: ProductCategory[] =
//   [
//     {
//       "id": 18,
//       "name": "Sanduíches"
//     },
//     {
//       "id": 22,
//       "name": "Bebidas"
//     },
//     {
//       "id": 23,
//       "name": "Sobremesas"
//     },
//     {
//       "id": 67431,
//       "name": "Fritas e Saladas"
//     }
//   ]

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['fiscal', 'production'] as const),
  productCategories: z.array(z.string()).optional(),
})

const PrintEnvironmentForm = () => {
  const [selectedType, setSelectedType] = useState<PrintEnvironmentType>('fiscal')
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])

  // useEffect(() => {
  //   setProductCategories(window.DesktopApi.getCategories());
  // }, [])

  const form = useForm<PrintEnvironmentConfig>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'fiscal',
      productCategories: [],
    },
  })

  const onSubmit = (data: PrintEnvironmentConfig) => {
    console.log('Dados do formulário:', data)
    // Aqui você pode adicionar a lógica para enviar os dados para o servidor
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configuração de Ambiente de Impressão</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Ambiente</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do ambiente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      }}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="fiscal" />
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

            {selectedType === 'production' && (
              <FormField
                control={form.control}
                name="productCategories"
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
                          name="productCategories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id.toString()}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id.toString())}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], category.id.toString()])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== category.id.toString()
                                            )
                                          )
                                    }}
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

            <Button type="submit">Salvar Configuração</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

root.render(<PrintEnvironmentForm />);