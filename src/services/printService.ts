import { PosPrintData, PosPrinter } from "electron-pos-printer";
import { getProfile } from "../main/store";
import { DateTime } from "luxon";

export const printTest = async (cart: any) => {
    console.log("xxxxxxxxxxxxxxxxxxxxxxx", cart);

    const profile = getProfile();

    const hr: PosPrintData = {
        type: 'text',
        value: '------------------------------------------------------',
        style: { fontWeight: "bold", fontSize: "15px" }
    }
    // Dados de teste
    const upperPrint: PosPrintData[] = [
        {
            type: 'text',
            position: 'center',
            value: profile.name,
            style: { fontWeight: "700", textAlign: 'center', fontSize: "24px", marginBottom: "15px" }
        }, {
            type: 'text',
            value: DateTime.fromSQL(cart.created_at, { zone: profile.timeZone }).toFormat("dd/MM/yyyy HH:mm:ss"),
            style: { fontWeight: "bold", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Pedido: wm${cart.code}-${cart.type}`,
            style: { fontWeight: "bold", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Cliente: ${cart.client.name}`,
            style: { fontWeight: "bold", fontSize: "15px" }
        }, {
            type: 'text',
            value: `Tel: ${cart.client?.whatsapp}`,
            style: { fontWeight: "bold", fontSize: "15px" }
        }
    ];

    const getPrintBody = (item: any, finalArray: any[]) => {
        const array: PosPrintData[] = [];
        const valueArray: number[] = [item.details.value];

        const mainItem = {
            type: 'text',
            value: `${item.quantity}x | ${item.name} (${item.details.value.toFixed(2)})`,
            style: { fontWeight: "bold", fontSize: "17px" }
        }

        if (item.details.complements.length > 0) {
            item.details.complements.map((complement: any) => {
                const complementItem: PosPrintData = {
                    type: 'text',
                    value: `${complement.itens[0].quantity}x - ${complement.itens[0].name}   ${complement.itens[0].value.toFixed(2)}`,
                    style: { fontWeight: "bold", fontSize: "14px" }
                }
                array.push(complementItem);
                valueArray.push(complement.itens[0].value);
            });
        }

        const price = Number(valueArray.reduce((acc, value) => acc + value, 0).toFixed(2));

        const finalPrice = {
            type: 'text',
            value: `R$${price * Number(item.quantity)}`,
            style: { fontWeight: "bold", fontSize: "15px", marginBottom: "10px", marginRight: "10px", textAlign: "right" }
        }

        finalArray.push(hr, mainItem, ...array, finalPrice);
    };

    const printBody: PosPrintData[] = [];

    cart.itens.map((item: any) => getPrintBody(item, printBody));

    const printPayment: PosPrintData[] = [hr];

    const getPayments = () => {
        const array: PosPrintData[] = [];
        const valueArray: number[] = [cart.total];

        const subtotal: PosPrintData = {
            type: 'text',
            value: `<div style="display: flex; justify-content: space-between;">
                    <span>Sub-total:</span>
                    <span>${cart.total.toFixed(2)}</span>
                </div>`,
            style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
        }
        array.push(subtotal);

        const taxDelivery: PosPrintData = {
            type: 'text',
            value: `<div style="display: flex; justify-content: space-between;">
                    <span>Taxa de entrega:</span>
                    <span>${typeof cart.taxDelivery !== "number" ? "A Consultar" : cart.taxDelivery > 0 ? `${cart.taxDelivery.toFixed(2)}` : "Grátis"}</span>
                </div>`,
            style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
        }
        array.push(taxDelivery);

        if (typeof cart.taxDelivery === "number" && cart.taxDelivery > 0) {
            valueArray.push(cart.taxDelivery);
        }

        if (cart.formsPayment.some((form: { payment: string; }) => form.payment === "cashback")) {
            const cashback: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>Cashback:</span>
                        <span>${cart.formsPayment.length === 1 ?
                        `-${cart.total.toFixed(2)}` :
                        `-${cart.formsPayment.find((form: { payment: string; }) => form.payment === "cashback").value.toFixed(2)}`}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
            }
            const cashbackValue = cart.formsPayment.length === 1 ?
                cart.total.toFixed(2) * -1 :
                cart.formsPayment.find((form: { payment: string; }) => form.payment === "cashback").value.toFixed(2) * -1;
            array.push(cashback);
            valueArray.push(cashbackValue);
        }

        const total: PosPrintData = {
            type: 'text',
            value: `<div style="display: flex; justify-content: space-between;">
                    <span>Total:</span>
                    <span>${valueArray.reduce((acc, value) => acc + value, 0).toFixed(2)}</span>
                </div>`,
            style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
        }
        array.push(total);

        const paidWith: PosPrintData = {
            type: 'text',
            value: `<div style="display: flex; justify-content: space-between;">
                    <span>Pagamento em:</span>
                    <span>${cart.formsPayment.map((formPayment: any) => `${formPayment.label}`)}</span>
                </div>`,
            style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
        }
        array.push(paidWith);

        printPayment.push(...array);
    }
    getPayments();

    // const printPayment: PosPrintData[] = [
    //     hr,
    //     {
    //         type: 'text',
    //         value: `<div style="display: flex; justify-content: space-between;">
    //                 <span>Sub-total:</span>
    //                 <span>${cart.total.toFixed(2)}</span>
    //             </div>`,
    //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
    //     }, {
    //         type: 'text',
    //         value: `<div style="display: flex; justify-content: space-between;">
    //                 <span>Taxa de entrega:</span>
    //                 <span>${cart.taxDelivery ? `${cart.taxDelivery.toFixed(2)}` : "Grátis"}</span>
    //             </div>`,
    //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
    //     }, {
    //         type: 'text',
    //         value: `<div style="display: flex; justify-content: space-between;">
    //                 <span>Total:</span>
    //                 <span>${cart.total.toFixed(2)}</span>
    //             </div>`,
    //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
    //     }, {
    //         type: 'text',
    //         value: `<div style="display: flex; justify-content: space-between;">
    //                 <span>Pagamento em:</span>
    //                 <span>${cart.formsPayment.map((formPayment: any) => `${formPayment.label}`)}</span>
    //             </div>`,
    //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
    //     }
    // ];

    const printAdress: PosPrintData[] = [
        hr,
        {
            type: 'text',
            value: `${cart.address.street},`,
            style: { fontWeight: "bold", fontSize: "15px" }
        },
        {
            type: 'text',
            value: `${cart.address.number} ${cart.address.complement}`,
            style: { fontWeight: "bold", fontSize: "15px" }
        },
        {
            type: 'text',
            value: `${cart.address.neighborhood} - ${cart.address.city}`,
            style: { fontWeight: "bold", fontSize: "15px" }
        }
    ];

    const printFooter: PosPrintData[] = [
        hr,
        {
            type: 'text',
            value: "**Delivery**",
            style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px", marginBottom: "10px" }
        },
        {
            type: 'text',
            value: "Tecnologia",
            style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px" }
        },
        {
            type: 'text',
            value: "www.whatsmenu.com.br",
            style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px" }
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