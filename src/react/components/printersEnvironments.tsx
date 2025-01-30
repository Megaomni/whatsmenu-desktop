import React, { useContext, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from "../shadcn-ui/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../shadcn-ui/components/ui/form"
import { Button } from "../shadcn-ui/components/ui/button"
import { Checkbox } from "../shadcn-ui/components/ui/checkbox"
import PrintContext from '../contexts/PrintContext'


export default function PrintersEnvironments() {
    const context = useContext(PrintContext);

    if (!context) {
      throw new Error('PrintContext must be used within a PrintProvider');
    }

    const {
      setCurrentPage,
      locations,
      selectedPrinter,
      selectedPrinterEnvs,
      setSelectedPrinterEnvs,
    } = context;

  const form = useForm({
    defaultValues: {
      environments: [] as number[],
    },
  })

  useEffect(() => {
    if (selectedPrinter) {
      const environments = selectedPrinter.options["printer-location"] || [];
      form.setValue("environments", environments);
      setSelectedPrinterEnvs(environments);
    }
  }, [selectedPrinter, form.setValue, setSelectedPrinterEnvs]);

  const handleEnvironmentChange = (envId: number) => {
    setSelectedPrinterEnvs((prev) => {
      const updatedEnvs = prev.includes(envId) ? prev.filter((env) => env !== envId) : [...prev, envId];
      form.setValue("environments", updatedEnvs);
      return updatedEnvs;
    });
  };

  const onUpdate = (data: { environments: number[] }) => {
    window.DesktopApi.onUpdatePrinter({
      id: selectedPrinter.id,
      options: {
        ...selectedPrinter.options,
        "printer-location": data.environments,
      },
    });
    setCurrentPage("main");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{`Editar Ambientes da ${selectedPrinter.name}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6">
              <FormField
                control={form.control}
                name="environments"
                render={() => (
                  <FormItem>
                    <FormLabel>Ambientes de impressão</FormLabel>
                    <FormDescription>
                      {`Selecione os ambientes que deseja atribuir à ${selectedPrinter.name}.`}
                    </FormDescription>
                    <div className="space-y-2">
                      {locations.map((environment) => (
                        <FormField
                          key={environment.id.toString()}
                          control={form.control}
                          name="environments"
                          render={() => {
                            return (
                              <FormItem
                                key={environment.id.toString()}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={selectedPrinterEnvs.includes(environment.id)}
                                    onCheckedChange={() => handleEnvironmentChange(environment.id)}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {environment.name}
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

            <Button type="submit">Salvar Edição</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}