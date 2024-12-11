import { PosPrintData, PosPrinter } from "electron-pos-printer";
import { DateTime } from "luxon";

export const printTest = async (payload: any, printOptions: Electron.WebContentsPrintOptions, paperSize: number, isGeneric: boolean) => {
    const { cart, profile, table, command } = payload;
    console.log({ payload });
    const isDelivery = (cart.type === 'D' || cart.type === 'P') && cart.address;
    const isTable = cart.type === 'T';

    let maxLength = 0;
    if (isGeneric) {
        maxLength = 48;
    } else {
        maxLength = 54;
    }

    const characterPrint = (originalStrings: string[], character: string, position: 'space-between' | 'center' | 'right' | 'left', pageLength: number) => {
        let finalString = ''
        const originalStringLength = originalStrings[0].length;
        const secondStringLength = originalStrings.length > 1 ? originalStrings[1].length : 0;
        const totalPadding = pageLength - originalStringLength;
        const leftPadding = Math.floor(totalPadding / 2);
        const rightPadding = totalPadding - leftPadding;
        switch (position) {
            case 'space-between':
                finalString = originalStrings[0];
                for (let i = originalStringLength; i < pageLength - secondStringLength; i++) {
                    finalString += character
                }
                finalString += originalStrings[1];
                break;
            case 'center':
                for (let i = 0; i < leftPadding; i++) {
                    finalString += character;
                }
                finalString += originalStrings[0];
                for (let i = 0; i < rightPadding; i++) {
                    finalString += character;
                }
                break;
            case 'right':
                for (let i = 0; i < pageLength - originalStringLength; i++) {
                    finalString += character
                }
                finalString += originalStrings[0];
                break;
            case 'left':
                for (let i = 0; i < pageLength; i++) {
                    finalString += character
                }
                break;
            default:
                break;
        }
        return finalString;
    }

    // const hr: PosPrintData = {
    //     type: 'text',
    //     value: '------------------------------------------------------',
    //     style: { fontWeight: "bold", fontSize: "15px" }
    // }

    const hr: PosPrintData = {
        type: 'text',
        value: characterPrint([''], '-', 'left', maxLength),
        style: { fontWeight: "bold", fontSize: "15px" }
    }

    const blankLine: PosPrintData = {
        type: 'text',
        value: '‎',
        style: { fontWeight: "bold", fontSize: "15px" }
    }

    const upperPrint: PosPrintData[] = [];

    const getUpperPrint = () => {
        const storeName: PosPrintData = isGeneric
            ? {
                type: 'text',
                position: 'center',
                value: characterPrint([`${profile.name}`], '‎', 'center', maxLength),
                style: { fontWeight: "700", textAlign: 'center', fontSize: "24px", marginBottom: "15px" }
            }
            : {
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

        if (isGeneric) {
            upperPrint.push(storeName, blankLine, orderDate);
        } else {
            upperPrint.push(storeName, orderDate);
        }

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
            const creationTime = DateTime.fromSQL(table.opened.created_at, { zone: profile.timeZone }).toFormat("HH:mm");
            const checkoutTime = DateTime.fromSQL(table.opened.updated_at, { zone: profile.timeZone }).toFormat("HH:mm");
            const stayingTime = DateTime.fromSQL(table.opened.updated_at, { zone: profile.timeZone }).diff(DateTime.fromSQL(table.opened.created_at, { zone: profile.timeZone }), ['minutes']).minutes;

            const orderCode: PosPrintData = {
                type: 'text',
                value: `Mesa: Mesa ${table.name}`,
                style: { fontWeight: "bold", fontSize: "15px" }
            }
            upperPrint.push(orderCode);

            const clientName: PosPrintData = payload.printType && payload.printType === 'command'
                ? {
                    type: 'text',
                    value: `Comanda: ${command.name}`,
                    style: { fontWeight: "bold", fontSize: "15px" }
                }
                : {
                    type: 'text',
                    value: `Comanda: ${table.opened.commands.map((command: any) => command.name)}`,
                    style: { fontWeight: "bold", fontSize: "15px" }
                }
            upperPrint.push(clientName);

            const totalStayingTime: PosPrintData = {
                type: 'text',
                value: `Tempo de permanência:
                ${creationTime} / ${checkoutTime} - ${Math.round(stayingTime)}min`,
                style: { fontWeight: "bold", fontSize: "15px" }
            }
            upperPrint.push(totalStayingTime);
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

        if (item.obs.length > 0) {
            const obs: PosPrintData = {
                type: 'text',
                value: `Obs.: ${item.obs}`,
                style: { fontWeight: "bold", fontSize: "14px" }
            }
            array.push(obs);
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

        const finalPrice = isGeneric
            ? {
                type: 'text',
                value: characterPrint([`R$${(price * Number(item.quantity)).toFixed(2)}`], '‎', 'right', maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginBottom: "10px", marginRight: "15px", textAlign: "right" }
            }
            : {
                type: 'text',
                value: `R$${(price * Number(item.quantity)).toFixed(2)}`,
                style: { fontWeight: "bold", fontSize: "15px", marginBottom: "10px", marginRight: "15px", textAlign: "right" }
            }

        finalArray.push(hr, mainItem, ...array, finalPrice);
    };

    const groupEqualItems = (itens: any[]) => {
        const newArray: any[] = [];
        itens.forEach((item: any) => {
            if (!newArray.find((newItem: any) => newItem.name === item.name) || item.obs.length > 0 || item.details.complements.length > 0) {
                newArray.push(item);
            } else {
                newArray.find((newItem: any) => newItem.name === item.name).quantity += item.quantity;
            }
        });
        return newArray;
    };

    const printBody: PosPrintData[] = [];

    if (payload.printType && payload.printType === 'command') {
        const allItens = command.carts.map((cart: any) => cart.itens.map((item: any) => item));
        const groupedItens = groupEqualItems(allItens);
        groupedItens.map((item: any) => getPrintBody(item, printBody));
    } else {
        if (isTable) {
            const { commands } = table.opened;
            const allItens = commands.map((command: any) => command.carts.map((cart: any) => cart.itens.map((item: any) => item)));
            const groupedItens = groupEqualItems(allItens.flat(2));
            groupedItens.map((item: any) => getPrintBody(item, printBody));
        } else {
            const allItens = cart.itens.map((item: any) => item);
            const groupedItens = groupEqualItems(allItens);
            groupedItens.map((item: any) => getPrintBody(item, printBody));
        }
    }


    const printIndividualCommands: PosPrintData[] = isTable && table.opened.commands.length > 1 && payload.printType !== 'command' ? [hr] : [];

    if (isTable && table.opened.commands.length > 1 && payload.printType !== 'command') {
        table.opened.commands.map((command: any) => {
            const commandName: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>${command.name}:</span>
                        <span>${command.carts.map((cart: any) => cart.total).reduce((acc: number, total: number) => acc + total, 0).toFixed(2)}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
            }
            printIndividualCommands.push(commandName);
        })
    }

    const printPayment: PosPrintData[] = [hr];

    let cartTotal = 0

    const getPayments = () => {
        const array: PosPrintData[] = [];
        const valueArray: number[] = [];

        if (isGeneric) {
            if (cart.cupom) {
                const cupomName: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Cupom usado:", `${cart.cupom.code}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(cupomName);
            }

            if (payload.printType && payload.printType === 'command') {
                const commandTotalPrices: number[] = command.carts.map((cart: any) => cart.total);
                cartTotal = commandTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
                const subtotal: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Sub-total:", `${cartTotal.toFixed(2)}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(subtotal);
                valueArray.push(cartTotal);
            } else if (isTable) {
                const tableTotalPrices: number[] = table.opened.commands.map((command: any) => command.carts.map((cart: any) => cart.total)).flat();
                cartTotal = tableTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
                const subtotal: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Sub-total:", `${cartTotal.toFixed(2)}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(subtotal);
                valueArray.push(cartTotal);
            } else {
                cartTotal = cart.total;
                const subtotal: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Sub-total:", `${cartTotal.toFixed(2)}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(subtotal);
                valueArray.push(cartTotal);
            }

            if (isTable && payload.printType !== 'command') {
                cart.command.fees.map((fee: any) => {
                    if (fee.type === 'percent') {
                        const percentValue = (fee.value * cartTotal) / 100;
                        const tax: PosPrintData = {
                            type: 'text',
                            value: characterPrint([`${fee.code}:`, `${percentValue.toFixed(2)}`], "‎", "space-between", maxLength),
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                        }
                        array.push(tax);
                        valueArray.push(percentValue);
                    }
                })

                if (table.opened.commands.length > 1) {
                    const allFixedFees = table.opened.commands.map((command: any) => {
                        return command.fees.filter((fee: any) => fee.quantity > 0 && fee.type === 'fixed');
                    })

                    const totalFees = allFixedFees.flat().reduce((acc: number, fee: any) => acc + fee.quantity, 0);

                    cart.command.fees.map((fee: any) => {
                        if (fee.type === 'fixed') {
                            const tax: PosPrintData = {
                                type: 'text',
                                value: characterPrint([`${fee.code} (${totalFees}x):`, `${(fee.value * totalFees).toFixed(2)}`], "‎", "space-between", maxLength),
                                style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                            }
                            array.push(tax);
                            valueArray.push(fee.value * totalFees);
                        }
                    })
                } else {
                    cart.command.fees.map((fee: any) => {
                        if (fee.type === 'fixed') {
                            const tax: PosPrintData = {
                                type: 'text',
                                value: characterPrint([`${fee.code} (${fee.quantity}x):`, `${fee.value.toFixed(2)}`], "‎", "space-between", maxLength),
                                style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                            }
                            array.push(tax);
                            valueArray.push(fee.value);
                        }
                    })
                }
            } else if (payload.printType === 'command') {
                command.fees.map((fee: any) => {
                    if (fee.type === 'percent') {
                        const percentValue = (fee.value * cartTotal) / 100;
                        const tax: PosPrintData = {
                            type: 'text',
                            value: characterPrint([`${fee.code}:`, `${percentValue.toFixed(2)}`], "‎", "space-between", maxLength),
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                        }
                        array.push(tax);
                        valueArray.push(percentValue);
                    }

                    if (fee.type === 'fixed') {
                        const tax: PosPrintData = {
                            type: 'text',
                            value: characterPrint([`${fee.code} (${fee.quantity}x):`, `${(fee.value * fee.quantity).toFixed(2)}`], "‎", "space-between", maxLength),
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                        }
                        array.push(tax);
                        valueArray.push(fee.value * fee.quantity);
                    }
                })
            }

            if (isDelivery) {
                const taxDelivery: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Taxa de entrega:", `${typeof cart.taxDelivery !== "number" ? "A Consultar" : cart.taxDelivery > 0 ? `${cart.taxDelivery.toFixed(2)}` : "Grátis"}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(taxDelivery);

                if (typeof cart.taxDelivery === "number" && cart.taxDelivery > 0) {
                    valueArray.push(cart.taxDelivery);
                }
            }

            if (cart.cupom) {
                const { type, value } = cart.cupom;
                if (type === "percent") {
                    const percentValue = (value * cartTotal) / 100;
                    const cupomPercent: PosPrintData = {
                        type: 'text',
                        value: characterPrint(["Cupom:", `-${percentValue.toFixed(2)}`], "‎", "space-between", maxLength),
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                    }
                    array.push(cupomPercent);
                    valueArray.push(percentValue * -1);
                }

                if (type === "value") {
                    const cupomFixed: PosPrintData = {
                        type: 'text',
                        value: characterPrint(["Cupom:", `-${value.toFixed(2)}`], "‎", "space-between", maxLength),
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
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
                    value: characterPrint(
                        [
                            "Cashback:",
                            `${cart.formsPayment.length === 1 ?
                                `-${cartTotal.toFixed(2)}` :
                                `-${cart.formsPayment.find((form: { payment: string; }) => form.payment === "cashback").value.toFixed(2)}`}`
                        ],
                        "‎",
                        "space-between",
                        maxLength
                    ),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                const cashbackValue = cart.formsPayment.length === 1 ?
                    Number((cartTotal * -1).toFixed(2)) :
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
                    value: characterPrint([`${taxOrDiscount} ${addonPayment.label}:`, `${addonValue}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                totalValue += addonValue;
                array.push(addon);
            }

            const total: PosPrintData = {
                type: 'text',
                value: characterPrint(["Total:", `${totalValue.toFixed(2)}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
            }
            array.push(total);

            const paidWith: PosPrintData = payload.printType && payload.printType === 'command'
                ? {
                    type: 'text',
                    value: characterPrint(["Pagamento em:", `${command.formsPayment.map((formPayment: any) => `${formPayment.label}`)}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                : {
                    type: 'text',
                    value: characterPrint(
                        [
                            "Pagamento em:",
                            `${isTable
                                ? table.opened.formsPayment.map((formPayment: any) => `${formPayment.label}`)
                                : cart.formsPayment.map((formPayment: any) => `${formPayment.label}`)}`
                        ],
                        "‎",
                        "space-between",
                        maxLength
                    ),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
            array.push(paidWith);

            if (cart.formsPayment.some((form: { payment: string; }) => form.payment === "money") || cart.type !== "T") {
                const moneyPayment = cart.formsPayment.find((form: { payment: string; }) => form.payment === "money");
                const moneyPaid: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Troco para:", `${typeof moneyPayment.value === "number" && moneyPayment.value !== totalValue ? `${moneyPayment.value.toFixed(2)}` : "Não é necessário"}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }

                if (typeof moneyPayment.value === "number" && moneyPayment.value > totalValue) {
                    const change: PosPrintData = {
                        type: 'text',
                        value: characterPrint(["Troco:", `${(moneyPayment.value - totalValue).toFixed(2)}`], "‎", "space-between", maxLength),
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                    }
                    array.push(moneyPaid, change);
                } else {
                    array.push(moneyPaid);
                }
            }
            printPayment.push(...array);
        } else {
            if (cart.cupom) {
                const cupomName: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                            <span>Cupom usado:</span>
                            <span>${cart.cupom.code}</span>
                        </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(cupomName);
            }

            if (payload.printType && payload.printType === 'command') {
                const commandTotalPrices: number[] = command.carts.map((cart: any) => cart.total);
                cartTotal = commandTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
                const subtotal: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                        <span>Sub-total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(subtotal);
                valueArray.push(cartTotal);
            } else if (isTable) {
                const tableTotalPrices: number[] = table.opened.commands.map((command: any) => command.carts.map((cart: any) => cart.total)).flat();
                cartTotal = tableTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
                const subtotal: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                        <span>Sub-total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(subtotal);
                valueArray.push(cartTotal);
            } else {
                cartTotal = cart.total;
                const subtotal: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                            <span>Sub-total:</span>
                            <span>${cartTotal.toFixed(2)}</span>
                        </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(subtotal);
                valueArray.push(cartTotal);
            }

            if (isTable && payload.printType !== 'command') {
                cart.command.fees.map((fee: any) => {
                    if (fee.type === 'percent') {
                        const percentValue = (fee.value * cartTotal) / 100;
                        const tax: PosPrintData = {
                            type: 'text',
                            value: `<div style="display: flex; justify-content: space-between;">
                                    <span>${fee.code}:</span>
                                    <span>${percentValue.toFixed(2)}</span>
                                </div>`,
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                        }
                        array.push(tax);
                        valueArray.push(percentValue);
                    }
                })

                if (table.opened.commands.length > 1) {
                    const allFixedFees = table.opened.commands.map((command: any) => {
                        return command.fees.filter((fee: any) => fee.quantity > 0 && fee.type === 'fixed');
                    })

                    const totalFees = allFixedFees.flat().reduce((acc: number, fee: any) => acc + fee.quantity, 0);

                    cart.command.fees.map((fee: any) => {
                        if (fee.type === 'fixed') {
                            const tax: PosPrintData = {
                                type: 'text',
                                value: `<div style="display: flex; justify-content: space-between;">
                                        <span>${fee.code} (${totalFees}x):</span>
                                        <span>${(fee.value * totalFees).toFixed(2)}</span>
                                    </div>`,
                                style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                            }
                            array.push(tax);
                            valueArray.push(fee.value * totalFees);
                        }
                    })
                } else {
                    cart.command.fees.map((fee: any) => {
                        if (fee.type === 'fixed') {
                            const tax: PosPrintData = {
                                type: 'text',
                                value: `<div style="display: flex; justify-content: space-between;">
                                        <span>${fee.code} (${fee.quantity}x):</span>
                                        <span>${fee.value.toFixed(2)}</span>
                                    </div>`,
                                style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                            }
                            array.push(tax);
                            valueArray.push(fee.value);
                        }
                    })
                }
            } else if (payload.printType === 'command') {
                command.fees.map((fee: any) => {
                    if (fee.type === 'percent') {
                        const percentValue = (fee.value * cartTotal) / 100;
                        const tax: PosPrintData = {
                            type: 'text',
                            value: `<div style="display: flex; justify-content: space-between;">
                                    <span>${fee.code}:</span>
                                    <span>${percentValue.toFixed(2)}</span>
                                </div>`,
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                        }
                        array.push(tax);
                        valueArray.push(percentValue);
                    }

                    if (fee.type === 'fixed') {
                        const tax: PosPrintData = {
                            type: 'text',
                            value: `<div style="display: flex; justify-content: space-between;">
                                    <span>${fee.code} (${fee.quantity}x):</span>
                                    <span>${(fee.value * fee.quantity).toFixed(2)}</span>
                                </div>`,
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                        }
                        array.push(tax);
                        valueArray.push(fee.value * fee.quantity);
                    }
                })
            }

            if (isDelivery) {
                const taxDelivery: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                        <span>Taxa de entrega:</span>
                        <span>${typeof cart.taxDelivery !== "number" ? "A Consultar" : cart.taxDelivery > 0 ? `${cart.taxDelivery.toFixed(2)}` : "Grátis"}</span>
                    </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                array.push(taxDelivery);

                if (typeof cart.taxDelivery === "number" && cart.taxDelivery > 0) {
                    valueArray.push(cart.taxDelivery);
                }
            }

            if (cart.cupom) {
                const { type, value } = cart.cupom;
                if (type === "percent") {
                    const percentValue = (value * cartTotal) / 100;
                    const cupomPercent: PosPrintData = {
                        type: 'text',
                        value: `<div style="display: flex; justify-content: space-between;">
                                <span>Cupom:</span>
                                <span>-${percentValue.toFixed(2)}</span>
                            </div>`,
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
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
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
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
                            `-${cartTotal.toFixed(2)}` :
                            `-${cart.formsPayment.find((form: { payment: string; }) => form.payment === "cashback").value.toFixed(2)}`}</span>
                        </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                const cashbackValue = cart.formsPayment.length === 1 ?
                    Number((cartTotal * -1).toFixed(2)) :
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
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
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
                style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
            }
            array.push(total);

            const paidWith: PosPrintData = payload.printType && payload.printType === 'command'
                ? {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                        <span>Pagamento em:</span>
                        <span>${command.formsPayment.map((formPayment: any) => `${formPayment.label}`)}</span>
                    </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
                : {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                        <span>Pagamento em:</span>
                        <span>${isTable
                            ? table.opened.formsPayment.map((formPayment: any) => `${formPayment.label}`)
                            : cart.formsPayment.map((formPayment: any) => `${formPayment.label}`)}</span>
                    </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }
            array.push(paidWith);

            if (cart.formsPayment.some((form: { payment: string; }) => form.payment === "money") || cart.type !== "T") {
                const moneyPayment = cart.formsPayment.find((form: { payment: string; }) => form.payment === "money");
                const moneyPaid: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                            <span>Troco para:</span>
                            <span>${typeof moneyPayment.value === "number" && moneyPayment.value !== totalValue ? `${moneyPayment.value.toFixed(2)}` : "Não é necessário"}</span>
                        </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                }

                if (typeof moneyPayment.value === "number" && moneyPayment.value > totalValue) {
                    const change: PosPrintData = {
                        type: 'text',
                        value: `<div style="display: flex; justify-content: space-between;">
                                <span>Troco:</span>
                                <span>${(moneyPayment.value - totalValue).toFixed(2)}</span>
                            </div>`,
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
                    }
                    array.push(moneyPaid, change);
                } else {
                    array.push(moneyPaid);
                }
            }
            printPayment.push(...array);
        }

        // if (cart.cupom) {
        //     const cupomName: PosPrintData = {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //                 <span>Cupom usado:</span>
        //                 <span>${cart.cupom.code}</span>
        //             </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        //     array.push(cupomName);
        // }

        // if (payload.printType && payload.printType === 'command') {
        //     const commandTotalPrices: number[] = command.carts.map((cart: any) => cart.total);
        //     cartTotal = commandTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
        //     const subtotal: PosPrintData = {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //             <span>Sub-total:</span>
        //             <span>${cartTotal.toFixed(2)}</span>
        //         </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        //     array.push(subtotal);
        //     valueArray.push(cartTotal);
        // } else if (isTable) {
        //     const tableTotalPrices: number[] = table.opened.commands.map((command: any) => command.carts.map((cart: any) => cart.total)).flat();
        //     cartTotal = tableTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
        //     const subtotal: PosPrintData = {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //             <span>Sub-total:</span>
        //             <span>${cartTotal.toFixed(2)}</span>
        //         </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        //     array.push(subtotal);
        //     valueArray.push(cartTotal);
        // } else {
        //     cartTotal = cart.total;
        //     const subtotal: PosPrintData = {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //                 <span>Sub-total:</span>
        //                 <span>${cartTotal.toFixed(2)}</span>
        //             </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        //     array.push(subtotal);
        //     valueArray.push(cartTotal);
        // }

        // if (isTable && payload.printType !== 'command') {
        //     cart.command.fees.map((fee: any) => {
        //         if (fee.type === 'percent') {
        //             const percentValue = (fee.value * cartTotal) / 100;
        //             const tax: PosPrintData = {
        //                 type: 'text',
        //                 value: `<div style="display: flex; justify-content: space-between;">
        //                         <span>${fee.code}:</span>
        //                         <span>${percentValue.toFixed(2)}</span>
        //                     </div>`,
        //                 style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //             }
        //             array.push(tax);
        //             valueArray.push(percentValue);
        //         }
        //     })

        //     if (table.opened.commands.length > 1) {
        //         const allFixedFees = table.opened.commands.map((command: any) => {
        //             return command.fees.filter((fee: any) => fee.quantity > 0 && fee.type === 'fixed');
        //         })

        //         const totalFees = allFixedFees.flat().reduce((acc: number, fee: any) => acc + fee.quantity, 0);

        //         cart.command.fees.map((fee: any) => {
        //             if (fee.type === 'fixed') {
        //                 const tax: PosPrintData = {
        //                     type: 'text',
        //                     value: `<div style="display: flex; justify-content: space-between;">
        //                             <span>${fee.code} (${totalFees}x):</span>
        //                             <span>${(fee.value * totalFees).toFixed(2)}</span>
        //                         </div>`,
        //                     style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //                 }
        //                 array.push(tax);
        //                 valueArray.push(fee.value * totalFees);
        //             }
        //         })
        //     } else {
        //         cart.command.fees.map((fee: any) => {
        //             if (fee.type === 'fixed') {
        //                 const tax: PosPrintData = {
        //                     type: 'text',
        //                     value: `<div style="display: flex; justify-content: space-between;">
        //                             <span>${fee.code} (${fee.quantity}x):</span>
        //                             <span>${fee.value.toFixed(2)}</span>
        //                         </div>`,
        //                     style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //                 }
        //                 array.push(tax);
        //                 valueArray.push(fee.value);
        //             }
        //         })
        //     }
        // } else if (payload.printType === 'command') {
        //     command.fees.map((fee: any) => {
        //         if (fee.type === 'percent') {
        //             const percentValue = (fee.value * cartTotal) / 100;
        //             const tax: PosPrintData = {
        //                 type: 'text',
        //                 value: `<div style="display: flex; justify-content: space-between;">
        //                         <span>${fee.code}:</span>
        //                         <span>${percentValue.toFixed(2)}</span>
        //                     </div>`,
        //                 style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //             }
        //             array.push(tax);
        //             valueArray.push(percentValue);
        //         }

        //         if (fee.type === 'fixed') {
        //             const tax: PosPrintData = {
        //                 type: 'text',
        //                 value: `<div style="display: flex; justify-content: space-between;">
        //                         <span>${fee.code} (${fee.quantity}x):</span>
        //                         <span>${(fee.value * fee.quantity).toFixed(2)}</span>
        //                     </div>`,
        //                 style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //             }
        //             array.push(tax);
        //             valueArray.push(fee.value * fee.quantity);
        //         }
        //     })
        // }

        // if (isDelivery) {
        //     const taxDelivery: PosPrintData = {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //             <span>Taxa de entrega:</span>
        //             <span>${typeof cart.taxDelivery !== "number" ? "A Consultar" : cart.taxDelivery > 0 ? `${cart.taxDelivery.toFixed(2)}` : "Grátis"}</span>
        //         </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        //     array.push(taxDelivery);

        //     if (typeof cart.taxDelivery === "number" && cart.taxDelivery > 0) {
        //         valueArray.push(cart.taxDelivery);
        //     }
        // }

        // if (cart.cupom) {
        //     const { type, value } = cart.cupom;
        //     if (type === "percent") {
        //         const percentValue = (value * cartTotal) / 100;
        //         const cupomPercent: PosPrintData = {
        //             type: 'text',
        //             value: `<div style="display: flex; justify-content: space-between;">
        //                     <span>Cupom:</span>
        //                     <span>-${percentValue.toFixed(2)}</span>
        //                 </div>`,
        //             style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //         }
        //         array.push(cupomPercent);
        //         valueArray.push(percentValue * -1);
        //     }

        //     if (type === "value") {
        //         const cupomFixed: PosPrintData = {
        //             type: 'text',
        //             value: `<div style="display: flex; justify-content: space-between;">
        //                     <span>Cupom:</span>
        //                     <span>-${value.toFixed(2)}</span>
        //                 </div>`,
        //             style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //         }
        //         array.push(cupomFixed);
        //         valueArray.push(value * -1);
        //     }

        //     if (type === "freight") {
        //         const cupomFreight: PosPrintData = {
        //             type: 'text',
        //             value: "Cupom de frete grátis!",
        //             style: { fontWeight: "bold", fontSize: "15px" }
        //         }
        //         array.push(cupomFreight);
        //     }
        // }

        // if (cart.formsPayment.some((form: { payment: string; }) => form.payment === "cashback")) {
        //     const cashback: PosPrintData = {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //                 <span>Cashback:</span>
        //                 <span>${cart.formsPayment.length === 1 ?
        //                 `-${cartTotal.toFixed(2)}` :
        //                 `-${cart.formsPayment.find((form: { payment: string; }) => form.payment === "cashback").value.toFixed(2)}`}</span>
        //             </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        //     const cashbackValue = cart.formsPayment.length === 1 ?
        //         Number((cartTotal * -1).toFixed(2)) :
        //         cart.formsPayment.find((form: { payment: string; }) => form.payment === "cashback").value.toFixed(2) * -1;

        //     array.push(cashback);
        //     valueArray.push(cashbackValue);
        // }

        // let totalValue = Number(valueArray.reduce((acc, value) => acc + value, 0).toFixed(2));

        // if (cart.formsPayment.some((form: { addon: any }) => form.addon) && cart.formsPayment.some((form: { addon: { status: boolean; }; }) => form.addon.status)) {
        //     const addonPayment = cart.formsPayment.find((form: { addon: { status: boolean; }; }) => form.addon.status);
        //     const taxOrDiscount = addonPayment.addon.type === "fee" ? "Taxa" : "Desconto";
        //     const addonValue = Number((addonPayment.value - totalValue).toFixed(2));
        //     const addon: PosPrintData = {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //                 <span>${taxOrDiscount} ${addonPayment.label}:</span>
        //                 <span>${addonValue}</span>
        //             </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        //     totalValue += addonValue;
        //     array.push(addon);
        // }

        // const total: PosPrintData = {
        //     type: 'text',
        //     value: `<div style="display: flex; justify-content: space-between;">
        //             <span>Total:</span>
        //             <span>${totalValue.toFixed(2)}</span>
        //         </div>`,
        //     style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        // }
        // array.push(total);

        // const paidWith: PosPrintData = payload.printType && payload.printType === 'command'
        //     ? {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //             <span>Pagamento em:</span>
        //             <span>${command.formsPayment.map((formPayment: any) => `${formPayment.label}`)}</span>
        //         </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        //     : {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //             <span>Pagamento em:</span>
        //             <span>${isTable
        //                 ? table.opened.formsPayment.map((formPayment: any) => `${formPayment.label}`)
        //                 : cart.formsPayment.map((formPayment: any) => `${formPayment.label}`)}</span>
        //         </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }
        // array.push(paidWith);

        // if (cart.formsPayment.some((form: { payment: string; }) => form.payment === "money") || cart.type !== "T") {
        //     const moneyPayment = cart.formsPayment.find((form: { payment: string; }) => form.payment === "money");
        //     const moneyPaid: PosPrintData = {
        //         type: 'text',
        //         value: `<div style="display: flex; justify-content: space-between;">
        //                 <span>Troco para:</span>
        //                 <span>${typeof moneyPayment.value === "number" && moneyPayment.value !== totalValue ? `${moneyPayment.value.toFixed(2)}` : "Não é necessário"}</span>
        //             </div>`,
        //         style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //     }

        //     if (typeof moneyPayment.value === "number" && moneyPayment.value > totalValue) {
        //         const change: PosPrintData = {
        //             type: 'text',
        //             value: `<div style="display: flex; justify-content: space-between;">
        //                     <span>Troco:</span>
        //                     <span>${(moneyPayment.value - totalValue).toFixed(2)}</span>
        //                 </div>`,
        //             style: { fontWeight: "bold", fontSize: "15px", marginRight: "15px" }
        //         }
        //         array.push(moneyPaid, change);
        //     } else {
        //         array.push(moneyPaid);
        //     }
        // }
        // printPayment.push(...array);
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

    const printFooter: PosPrintData[] = isGeneric
        ? [
            hr,
            {
                type: 'text',
                value: characterPrint([`**${isTable ? "Pedido Mesa" : isDelivery ? "Delivery" : "Vou retirar no local"}**`], '‎', 'center', maxLength),
                style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px", marginBottom: "10px" }
            },
            {
                type: 'text',
                value: characterPrint(["Tecnologia"], '‎', 'center', maxLength),
                style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px" }
            },
            {
                type: 'text',
                value: characterPrint(["www.whatsmenu.com.br"], '‎', 'center', maxLength),
                style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px" }
            },
            hr
        ]
        : [
            hr,
            {
                type: 'text',
                value: `**${isTable ? "Pedido Mesa" : isDelivery ? "Delivery" : "Vou retirar no local"}**`,
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
        ...printIndividualCommands,
        ...printPayment,
        ...printAdress,
        ...printFooter,
    ];

    await PosPrinter.print(fullPrint, {
        printerName: printOptions.deviceName,
        preview: false,
        silent: printOptions.silent,
        pageSize: paperSize === 80 ? "80mm" : "58mm",
        margin: '0 0 0 0',
        boolean: undefined
    }).catch((error) =>
        console.error("Erro na impressão:", error)
    );
};