import { PosPrintData, PosPrinter } from "electron-pos-printer";

export const printTest = async () => {
    // Dados de teste
    const data: PosPrintData[] = [
        {
            type: "text",
            value: 'Impressão de Teste',
            style: { 'fontSize': '12' }
        },
    ];

    await PosPrinter.print(data, {
        printerName: 'POS-80C',
        preview: false,
        silent: true,
        pageSize: '80mm',
        margin: '0 0 0 0',
    }).catch((error) =>
        console.error("Erro na impressão:", error)
    );
};