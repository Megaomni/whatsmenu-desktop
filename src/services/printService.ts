import { PosPrintData, PosPrinter } from "electron-pos-printer";
import { getProfile } from "../main/store";
import { DateTime } from "luxon";

export const printTest = async (cart: any) => {
    console.log("xxxxxxxxxxxxxxxxxxxxxxx", cart);
    // console.log("yyyyyyyyyyyyyyyyyyyyyyy", cart.command.opened.commands[0].carts);
    const profile = getProfile();
    const isDelivery = (cart.type === 'D' || cart.type === 'P') && cart.address;
    const isTable = cart.type === 'T';

    const hr: PosPrintData = {
        type: 'text',
        value: '------------------------------------------------------',
        style: { fontWeight: "bold", fontSize: "15px" }
    }

    const upperPrint: PosPrintData[] = [];

    const getUpperPrint = () => {
        const storeName: PosPrintData = {
            type: 'text',
            position: 'center',
            value: profile.name,
            style: { fontWeight: "700", textAlign: 'center', fontSize: "24px", marginBottom: "15px" }
        }

        const orderDate: PosPrintData = {
            type: 'text',
            value: DateTime.fromSQL(cart.created_at, { zone: profile.timeZone }).toFormat("dd/MM/yyyy HH:mm:ss"),
            style: { fontWeight: "bold", fontSize: "15px" }
        }
        upperPrint.push(storeName, orderDate);

        if (!isTable) {
            const orderCode: PosPrintData = {
                type: 'text',
                value: `Pedido: wm${cart.code}-${cart.type}`,
                style: { fontWeight: "bold", fontSize: "15px" }
            }

            const clientName: PosPrintData = {
                type: 'text',
                value: `Cliente: ${cart.client.name}`,
                style: { fontWeight: "bold", fontSize: "15px" }
            }
            upperPrint.push(orderCode, clientName);

            if (cart.type === 'P') {
                const packageDate: PosPrintData = {
                    type: 'text',
                    value: DateTime.fromSQL(cart.packageDate, { zone: profile.timeZone }).toFormat("dd/MM/yyyy HH:mm"),
                    style: { fontWeight: "bold", fontSize: "15px" }
                }
                upperPrint.push(packageDate);
            }

            const clientPhone: PosPrintData = {
                type: 'text',
                value: `Tel: ${cart.client?.whatsapp}`,
                style: { fontWeight: "bold", fontSize: "15px" }
            }
            upperPrint.push(clientPhone);
        } else {
            const orderCode: PosPrintData = {
                type: 'text',
                value: `Mesa: Mesa ${cart.command.opened.table.name}`,
                style: { fontWeight: "bold", fontSize: "15px" }
            }
            upperPrint.push(orderCode);
        }

    }
    getUpperPrint();

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

        if (cart.cupom) {
            const cupomName: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>Cupom usado:</span>
                        <span>${cart.cupom.code}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
            }
            array.push(cupomName);
        }

        const subtotal: PosPrintData = {
            type: 'text',
            value: `<div style="display: flex; justify-content: space-between;">
                    <span>Sub-total:</span>
                    <span>${cart.total.toFixed(2)}</span>
                </div>`,
            style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
        }
        array.push(subtotal);

        if (isDelivery) {
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
        }

        if (cart.cupom) {
            const { type, value } = cart.cupom;
            if (type === "percent") {
                const percentValue = (value * cart.total) / 100;
                const cupomPercent: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                            <span>Cupom:</span>
                            <span>-${percentValue.toFixed(2)}</span>
                        </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
                }
                array.push(cupomPercent);
                valueArray.push(percentValue * -1);
            }

            if (type === "value") {
                const cupomFixed: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                            <span>Cupom:</span>
                            <span>-${value.toFixed(2)}</span>
                        </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
                }
                array.push(cupomFixed);
                valueArray.push(value * -1);
            }

            if (type === "freight") {
                const cupomFreight: PosPrintData = {
                    type: 'text',
                    value: "Cupom de frete grátis!",
                    style: { fontWeight: "bold", fontSize: "15px" }
                }
                array.push(cupomFreight);
            }
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

        let totalValue = Number(valueArray.reduce((acc, value) => acc + value, 0).toFixed(2));

        if (cart.formsPayment.some((form: { addon: any }) => form.addon) && cart.formsPayment.some((form: { addon: { status: boolean; }; }) => form.addon.status)) {
            const addonPayment = cart.formsPayment.find((form: { addon: { status: boolean; }; }) => form.addon.status);
            const taxOrDiscount = addonPayment.addon.type === "fee" ? "Taxa" : "Desconto";
            const addonValue = Number((addonPayment.value - totalValue).toFixed(2));
            const addon: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>${taxOrDiscount} ${addonPayment.label}:</span>
                        <span>${addonValue}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
            }
            totalValue += addonValue;
            array.push(addon);
        }

        const total: PosPrintData = {
            type: 'text',
            value: `<div style="display: flex; justify-content: space-between;">
                    <span>Total:</span>
                    <span>${totalValue.toFixed(2)}</span>
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

        if (cart.formsPayment.some((form: { payment: string; }) => form.payment === "money")) {
            const moneyPayment = cart.formsPayment.find((form: { payment: string; }) => form.payment === "money");
            const moneyPaid: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>Troco para:</span>
                        <span>${typeof moneyPayment.value === "number" && moneyPayment.value !== totalValue ? `${moneyPayment.value.toFixed(2)}` : "Não é necessário"}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
            }

            if (typeof moneyPayment.value === "number" && moneyPayment.value > totalValue) {
                const change: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                            <span>Troco:</span>
                            <span>${(moneyPayment.value - totalValue).toFixed(2)}</span>
                        </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "10px" }
                }
                array.push(moneyPaid, change);
            } else {
                array.push(moneyPaid);
            }
        }
        printPayment.push(...array);
    }
    getPayments();

    const printAdress: PosPrintData[] = isDelivery ? [
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
    ] : [];

    const printFooter: PosPrintData[] = [
        hr,
        {
            type: 'text',
            value: `**${isDelivery ? "Delivery" : "Vou retirar no local"}**`,
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
        console.error("Erro na impressão:", error)
    );
};