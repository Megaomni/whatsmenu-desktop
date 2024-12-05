import { PosPrintData, PosPrinter } from "electron-pos-printer";
import { getProfile } from "../main/store";
import { DateTime } from "luxon";

export const printTest = async (cart: any) => {
    console.log("xxxxxxxxxxxxxxxxxxxxxxx", cart);

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
            value: `${item.quantity}x | ${item.name} (${item.details.value.toFixed(2)})\n
            ${item.details.complements.length > 0
                    ? item.details.complements.map((complement: any) =>
                        `${complement.itens[0].quantity}x | ${complement.itens[0].name} - ${complement.itens[0].value.toFixed(2)}\n`)
                    : ''}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }
    });

    const printPayment: PosPrintData[] = [
        {
            type: 'text',
            value: `Sub-total: ${cart.total.toFixed(2)}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Taxa de entrega: ${cart.taxDelivery ? `${cart.taxDelivery.toFixed(2)}` : "Grátis"}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Total: ${cart.total.toFixed(2)}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Pagamento em: ${cart.formsPayment.map((formPayment: any) => `${formPayment.label}`)}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }
    ];

    const printAdress: PosPrintData[] = [
        {
            type: 'text',
            value: `${cart.address.street},`,
            style: { fontWeight: "300", fontSize: "15px" }
        },
        {
            type: 'text',
            value: `${cart.address.number} ${cart.address.complement}`,
            style: { fontWeight: "300", fontSize: "15px" }
        },
        {
            type: 'text',
            value: `${cart.address.number} - ${cart.address.complement}`,
            style: { fontWeight: "300", fontSize: "15px" }
        }
    ];

    const printFooter: PosPrintData[] = [
        {
            type: 'text',
            value: "**Delivery**",
            style: { fontWeight: "300", textAlign: 'center', fontSize: "15px" }
        },
        {
            type: 'text',
            value: "Tecnologia",
            style: { fontWeight: "300", textAlign: 'center', fontSize: "15px" }
        },
        {
            type: 'text',
            value: "www.whatsmenu.com.br",
            style: { fontWeight: "300", textAlign: 'center', fontSize: "15px" }
        }
    ];

    const fullPrint: PosPrintData[] = [
        ...upperPrint,
        ...printBody,
        ...printPayment,
        ...printAdress,
        ...printFooter
    ];

    await PosPrinter.print(fullPrint, {
        printerName: 'POS-80C',
        preview: false,
        silent: true,
        pageSize: '76mm',
        margin: '0 0 0 0',
        boolean: undefined
    }).catch((error) =>
        console.error("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX Erro na impressão:", error)
    );
};