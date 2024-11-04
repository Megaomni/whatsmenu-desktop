import { PosPrintData, PosPrinter } from "electron-pos-printer";
import { getProfile } from "../main/store";
import { DateTime } from "luxon";

export const printTest = async (cart: any) => {
    console.log("xxxxxxxxxxxxxxxxxxxxxxx", cart);
    console.log("yyyyyyyyyyyyyyyyyyyyyyy", cart.itens[0].details.value);


    const profile = getProfile();
    // Dados de teste
    const upperPrint: PosPrintData[] = [
        {
            type: 'text',
            position: 'center',
            value: profile.name,
            style: { fontWeight: "700", textAlign: 'center', fontSize: "24px" }
        }, {
            type: 'text',
            value: DateTime.fromSQL(cart.created_at, { zone: profile.timeZone }).toFormat("dd/MM/yyyy HH:mm:ss"),
            style: { fontWeight: "300", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Pedido: wm${cart.code}-${cart.type}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Cliente: ${cart.client.name}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Tel: ${cart.client?.whatsapp}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }
    ];

    const printBody: PosPrintData[] = cart.itens.map((item: any) => {
        return {
            type: 'text',
            value: `${item.quantity}x | ${item.name} R$${item.details.value}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }
    });

    const fullPrint: PosPrintData[] = [
        ...upperPrint,
        ...printBody
    ];

    await PosPrinter.print(fullPrint, {
        printerName: 'POS-80C',
        preview: false,
        silent: true,
        pageSize: '80mm',
        margin: '0 0 0 0',
    }).catch((error) =>
        console.error("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Erro na impressão:", error)
    );
};