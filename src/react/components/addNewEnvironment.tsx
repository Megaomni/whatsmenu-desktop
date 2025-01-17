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

export default function AddNewEnvironment() {
    const context = useContext(PrintContext);

    if (!context) {
      throw new Error('PrintContext must be used within a PrintProvider');
    }

    const { setCurrentPage, productCategories, selectedType, setSelectedType } = context;

  const form = useForm<PrintEnvironmentConfig>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'fiscal',
      categories: [],
    },
  })

  const onSubmit = (data: PrintEnvironmentConfig) => {
    console.log('Dados do formulário:', data)
    window.DesktopApi.onSubmitPrint(data);
    setCurrentPage('main');
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
                    <Input
                      placeholder="Digite o nome do ambiente"
                      {...field}
                    />
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
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id.toString()}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.name)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value || [], category.name])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== category.name
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