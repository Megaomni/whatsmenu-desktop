import { PosPrintData, PosPrinter } from "electron-pos-printer";
import { DateTime } from "luxon";
import { CartItemType, CartType } from "../@types/cart";
import { AddonType, ProfileType } from "../@types/profile";
import { TableType } from "../@types/table";
import { CommandType } from "../@types/command";

type PrintPayloadType = {
    cart: CartType;
    profile: ProfileType;
    table?: TableType;
    command?: CommandType;
    printType?: 'table' | 'command';
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

const lineBreaker = (string: string, maxLength: number) => {
    let newString = '';
    for (let i = 0; i < string.length; i += maxLength) {
        newString += string.slice(i, i + maxLength) + " ";
    }
    return newString;
}

const generateUpper = (payload: PrintPayloadType, isGeneric: boolean, isTable: boolean, isIfood: boolean, marginLeft: number, maxLength: number, blankLine: PosPrintData): PosPrintData[] => {
    const { cart, profile, table, command } = payload;
    const upperPrint: PosPrintData[] = [];

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
            style: { fontWeight: "700", textAlign: 'center', fontSize: "24px", marginBottom: "15px", fontFamily: "monospace" }
        }

    const orderDate: PosPrintData = {
        type: 'text',
        value: DateTime.fromSQL(cart.created_at, { zone: profile.timeZone }).toFormat("dd/MM/yyyy HH:mm:ss"),
        style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
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
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }

        const clientName: PosPrintData = {
            type: 'text',
            value: `Cliente: ${cart.client ? cart.client.name : 'Venda sem cadastro'}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        upperPrint.push(orderCode, clientName);

        if (cart.type === 'P' && isIfood) {
            const packageDate: PosPrintData = {
                type: 'text',
                value: `Data de entrega: ${DateTime.fromISO(cart.packageDate, { zone: profile.timeZone }).toFormat("dd/MM/yyyy HH:mm")}`,
                style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            upperPrint.push(packageDate);
        }

        if (cart.type === 'P' && !isIfood) {
            const packageDate: PosPrintData = {
                type: 'text',
                value: `Data de entrega: ${DateTime.fromSQL(cart.packageDate, { zone: profile.timeZone }).toFormat("dd/MM/yyyy HH:mm")}`,
                style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            upperPrint.push(packageDate);
        }

        if (cart.client) {
            const clientPhone: PosPrintData = {
                type: 'text',
                value: `Tel: ${cart.client?.whatsapp}`,
                style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            upperPrint.push(clientPhone);
        }

        if (isIfood) {
            const ifoodCode: PosPrintData = {
                type: 'text',
                value: `Codigo localizador: ${cart.client?.codeLocalizer}`,
                style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            upperPrint.push(ifoodCode);
        }
    } else if (table?.opened) {
        const creationTime = DateTime.fromSQL(table.opened.created_at, { zone: profile.timeZone }).toFormat("HH:mm");
        const checkoutTime = DateTime.fromSQL(table.opened.updated_at, { zone: profile.timeZone }).toFormat("HH:mm");
        const stayingTime = DateTime.fromSQL(table.opened.updated_at, { zone: profile.timeZone }).diff(DateTime.fromSQL(table.opened.created_at, { zone: profile.timeZone }), ['minutes']).minutes;

        const orderCode: PosPrintData = {
            type: 'text',
            value: `Mesa: Mesa ${table.name}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        upperPrint.push(orderCode);

        const clientName: PosPrintData = payload.printType && payload.printType === 'command'
            ? {
                type: 'text',
                value: `Comanda: ${command.name}`,
                style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            : {
                type: 'text',
                value: `Comanda: ${table.opened?.commands.map((command) => command.name)}`,
                style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
        upperPrint.push(clientName);

        const totalStayingTime: PosPrintData = {
            type: 'text',
            value: `Tempo de permanência:
                ${creationTime} / ${checkoutTime} - ${Math.round(stayingTime)}min`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        upperPrint.push(totalStayingTime);
    } else {
        const orderCode: PosPrintData = {
            type: 'text',
            value: `Mesa: Mesa ${table.name}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        upperPrint.push(orderCode);

        const clientName: PosPrintData = {
            type: 'text',
            value: `Comanda: ${cart.command.name}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        upperPrint.push(clientName);

        const waiter: PosPrintData = {
            type: 'text',
            value: `Garcom: ${cart.bartender?.name}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        upperPrint.push(waiter);
    }

    if (cart.secretNumber) {
        const secretNumber: PosPrintData = {
            type: 'text',
            value: `CNPJ: ${cart.secretNumber}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        upperPrint.push(secretNumber);
    }

    return upperPrint;
}

const generateItens = (payload: PrintPayloadType, isGeneric: boolean, isTable: boolean, hr: PosPrintData, marginLeft: number, marginRight: number, maxLength: number): PosPrintData[] => {
    const { cart, table, command } = payload;
    const getPrintBody = (item: CartItemType | CartItemType[], finalArray: PosPrintData[]) => {
        let parsedItem: CartItemType;
        Array.isArray(item) ? parsedItem = item[0] : parsedItem = item;
        const array: PosPrintData[] = [];
        const valueArray: number[] = [parsedItem.details.value];

        const mainItem: PosPrintData = {
            type: 'text',
            value: `${parsedItem.quantity}x | ${parsedItem.name} (${parsedItem.details.value.toFixed(2)})`,
            style: { fontWeight: "bold", fontSize: "17px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }

        if (parsedItem.obs.length > 0) {
            const fullObs = `Obs.: ${parsedItem.obs}`;
            const obs: PosPrintData = {
                type: 'text',
                value: parsedItem.obs.includes(" ") ? fullObs : lineBreaker(fullObs, maxLength - 15),
                style: { fontWeight: "bold", fontSize: "14px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(obs);
        }

        if (parsedItem.details.complements.length > 0) {
            parsedItem.details.complements.map((complement) => {
                if (complement.itens.length > 1) {
                    const complementCategory: PosPrintData = {
                        type: 'text',
                        value: `${complement.name}`,
                        style: { fontWeight: "bold", fontSize: "16px", marginLeft: `${marginLeft + 6}px`, marginTop: "3px", fontFamily: "monospace" }
                    }
                    array.push(complementCategory);

                    complement.itens.map((parsedItem) => {
                        const complementsValue = parsedItem.quantity * parsedItem.value;
                        const complementItem: PosPrintData = {
                            type: 'text',
                            value: `${parsedItem.quantity}x - ${parsedItem.name} ${parsedItem.value > 0 ? `(${complementsValue.toFixed(2)})` : ''}`,
                            style: { fontWeight: "bold", fontSize: "14px", marginLeft: `${marginLeft + 12}px`, fontFamily: "monospace" }
                        }
                        array.push(complementItem);
                        valueArray.push(complementsValue);
                    })
                } else {
                    const complementCategory: PosPrintData = {
                        type: 'text',
                        value: `${complement.name}`,
                        style: { fontWeight: "bold", fontSize: "16px", marginLeft: `${marginLeft + 6}px`, marginTop: "3px", fontFamily: "monospace" }
                    }
                    array.push(complementCategory);

                    const complementsValue = complement.itens[0].quantity * complement.itens[0].value;
                    const complementItem: PosPrintData = {
                        type: 'text',
                        value: `${complement.itens[0].quantity}x - ${complement.itens[0].name} ${complement.itens[0].value > 0 ? `(${complementsValue.toFixed(2)})` : ''}`,
                        style: { fontWeight: "bold", fontSize: "14px", marginLeft: `${marginLeft + 12}px`, fontFamily: "monospace" }
                    }
                    array.push(complementItem);
                    valueArray.push(complementsValue);
                }

            });
        }

        const price = Number(valueArray.reduce((acc, value) => acc + value, 0).toFixed(2));

        const finalPrice: PosPrintData = isGeneric
            ? {
                type: 'text',
                value: characterPrint([`R$${(price * Number(parsedItem.quantity)).toFixed(2)}`], '‎', 'right', maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginBottom: "10px", marginRight: `${marginRight}px`, textAlign: "right" }
            }
            : {
                type: 'text',
                value: `R$${(price * Number(parsedItem.quantity)).toFixed(2)}`,
                style: { fontWeight: "bold", fontSize: "15px", marginBottom: "10px", marginRight: `${marginRight}px`, textAlign: "right", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }

        finalArray.push(hr, mainItem, ...array, finalPrice);
    };

    const groupEqualItems = (itens: CartItemType[]) => {
        const newArray: CartItemType[] = [];
        itens.forEach((item) => {
            if (!newArray.find((newItem) => newItem.name === item.name) || Boolean(item.obs) === true || item.details.complements.length > 0) {
                newArray.push(item);
            } else {
                newArray.find((newItem) => newItem.name === item.name).quantity += item.quantity;
            }
        });
        return newArray;
    };

    const printBody: PosPrintData[] = [];

    if (payload.printType && payload.printType === 'command') {
        const allItens = command.carts.map((cart) => cart.itens.map((item) => item));
        const groupedItens = groupEqualItems(allItens.flat());
        groupedItens.map((item) => getPrintBody(item, printBody));
    } else {
        if (isTable && table?.opened) {
            const { commands } = table.opened;
            const allItens = commands.map((command) => command.carts.map((cart) => cart.itens.map((item) => item)));
            if (allItens.flat(2).length === 0) {
                const groupedItens = groupEqualItems(cart.itens);
                groupedItens.map((item) => getPrintBody(item, printBody));
            } else {
                const groupedItens = groupEqualItems(allItens.flat(2));
                groupedItens.map((item) => getPrintBody(item, printBody));
            }
        } else {
            const allItens = cart.itens.map((item) => item);
            const groupedItens = groupEqualItems(allItens);
            groupedItens.map((item) => getPrintBody(item, printBody));
        }
    }

    return printBody;
}

const generateIndCommands = (table: TableType, marginLeft: number, marginRight: number, hr: PosPrintData) => {
    const finalArray: PosPrintData[] = [hr];
    table.opened?.commands.map((command) => {
        const commandName: PosPrintData = {
            type: 'text',
            value: `<div style="display: flex; justify-content: space-between;">
                    <span>${command.name}:</span>
                    <span>${command.carts.map((cart) => cart.total).reduce((acc: number, total: number) => acc + total, 0).toFixed(2)}</span>
                </div>`,
            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        finalArray.push(commandName);
    })

    return finalArray;
}

const generateObs = (cart: CartType, marginLeft: number, marginRight: number, maxLength: number, hr: PosPrintData): PosPrintData[] => {
    return [
        hr,
        {
            type: 'text',
            value: cart.obs.includes(" ") ? `Obs.: ${cart.obs}` : lineBreaker(`Obs.: ${cart.obs}`, maxLength - 15),
            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
    ]
}

const generatePayments = (payload: PrintPayloadType, isGeneric: boolean, isTable: boolean, isDelivery: boolean, isIfood: boolean, marginLeft: number, marginRight: number, maxLength: number, hr: PosPrintData, cartTotal: number): PosPrintData[] => {
    const { cart, table, command } = payload;
    const array: PosPrintData[] = [hr];
    const valueArray: number[] = [];

    const sponsorCupomIfood = ({ cart }: { cart: CartType }) => {
        if (cart.ifoodAditionalInfo?.metadata.benefits) {
            return cart.ifoodAditionalInfo?.metadata.benefits[0].sponsorshipValues
                .filter((sponsorValue) => sponsorValue.value > 0)
                .map((sponsorName) => {
                    switch (sponsorName.description) {
                        case 'Incentivo da Loja':
                            return 'LOJA'
                        case 'Incentivo do iFood':
                            return 'IFOOD'
                        case 'Incentivo da Industria':
                            return 'Industria'
                        case 'Incentivo da Rede':
                            return 'Rede'
                        default:
                            return ''
                    }
                })
        }
    }

    const valuesSponsorCupomIfood = ({ cart }: { cart: CartType }) => {
        if (cart.ifoodAditionalInfo?.metadata.benefits) {
            return cart.ifoodAditionalInfo?.metadata.benefits[0].sponsorshipValues
                .filter((sponsorValue) => sponsorValue.value > 0)
                .map((sponsorName) => {
                    switch (sponsorName.description) {
                        case 'Incentivo da Loja':
                            return sponsorName.value
                        case 'Incentivo do iFood':
                            return sponsorName.value
                        case 'Incentivo da Industria':
                            return sponsorName.value
                        case 'Incentivo da Rede':
                            return sponsorName.value
                        default:
                            return 0
                    }
                })
        }
    }

    if (isGeneric) {
        if (cart.cupom && !isIfood) {
            const cupomName: PosPrintData = {
                type: 'text',
                value: characterPrint(["Cupom usado:", `${cart.cupom.code}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            array.push(cupomName);
        }

        if (cart.cupom && isIfood) {
            const cupomName: PosPrintData = {
                type: 'text',
                value: characterPrint(["Cupom dado:", `${sponsorCupomIfood({ cart })}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            array.push(cupomName);
        }

        if (isIfood) {
            const cupomName: PosPrintData = {
                type: 'text',
                value: characterPrint(["Valores de Cada cupom:", `${valuesSponsorCupomIfood({ cart })}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            array.push(cupomName);
        }

        if (payload.printType && payload.printType === 'command') {
            const commandTotalPrices: number[] = command.carts.map((cart) => cart.total);
            cartTotal = commandTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
            const subtotal: PosPrintData = {
                type: 'text',
                value: characterPrint(["Sub-total:", `${cartTotal.toFixed(2)}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            array.push(subtotal);
            valueArray.push(cartTotal);
        } else if (isTable && table.opened) {
            const tableTotalPrices: number[] = table.opened?.commands.map((command) => command.carts.map((cart) => cart.total)).flat();
            cartTotal = tableTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
            const subtotal: PosPrintData = {
                type: 'text',
                value: characterPrint(["Sub-total:", `${cartTotal.toFixed(2)}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            array.push(subtotal);
            valueArray.push(cartTotal);
        } else if (isTable && !table.opened) {
            const tableTotalPrices: number[] = cart.itens.map((item) => item.details.value);
            cartTotal = tableTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
            const subtotal: PosPrintData = {
                type: 'text',
                value: characterPrint(["Sub-total:", `${cartTotal.toFixed(2)}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            array.push(subtotal);
            valueArray.push(cartTotal);
        } else {
            cartTotal = cart.total;
            const subtotal: PosPrintData = {
                type: 'text',
                value: characterPrint(["Sub-total:", `${cartTotal.toFixed(2)}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            array.push(subtotal);
            valueArray.push(cartTotal);
        }

        if (isTable && table.opened && payload.printType !== 'command') {
            cart.command?.fees.map((fee) => {
                if (fee.type === 'percent') {
                    const percentValue = (fee.value * cartTotal) / 100;
                    const tax: PosPrintData = {
                        type: 'text',
                        value: characterPrint([`${fee.code}:`, `${percentValue.toFixed(2)}`], "‎", "space-between", maxLength),
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                    }
                    array.push(tax);
                    valueArray.push(percentValue);
                }
            })

            if (table.opened && table.opened.commands.length > 1) {
                const allFixedFees = table.opened?.commands.map((command) => {
                    return command.fees.filter((fee) => fee.quantity > 0 && fee.type === 'fixed');
                })

                const totalFees = allFixedFees.flat().reduce((acc: number, fee) => acc + fee.quantity, 0);

                cart.command?.fees.map((fee) => {
                    if (fee.type === 'fixed' && totalFees > 0) {
                        const tax: PosPrintData = {
                            type: 'text',
                            value: characterPrint([`${fee.code} (${totalFees}x):`, `${(fee.value * totalFees).toFixed(2)}`], "‎", "space-between", maxLength),
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                        }
                        array.push(tax);
                        valueArray.push(fee.value * totalFees);
                    }
                })
            } else {
                cart.command?.fees.map((fee) => {
                    if (fee.type === 'fixed' && fee.quantity > 0) {
                        const tax: PosPrintData = {
                            type: 'text',
                            value: characterPrint([`${fee.code} (${fee.quantity}x):`, `${(fee.value * fee.quantity).toFixed(2)}`], "‎", "space-between", maxLength),
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                        }
                        array.push(tax);
                        valueArray.push(fee.value * fee.quantity);
                    }
                })
            }
        } else if (payload.printType === 'command') {
            command.fees.map((fee) => {
                if (fee.type === 'percent') {
                    const percentValue = (fee.value * cartTotal) / 100;
                    const tax: PosPrintData = {
                        type: 'text',
                        value: characterPrint([`${fee.code}:`, `${percentValue.toFixed(2)}`], "‎", "space-between", maxLength),
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                    }
                    array.push(tax);
                    valueArray.push(percentValue);
                }

                if (fee.type === 'fixed' && fee.quantity > 0) {
                    const tax: PosPrintData = {
                        type: 'text',
                        value: characterPrint([`${fee.code} (${fee.quantity}x):`, `${(fee.value * fee.quantity).toFixed(2)}`], "‎", "space-between", maxLength),
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
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
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            array.push(taxDelivery);

            if (typeof cart.taxDelivery === "number" && cart.taxDelivery > 0) {
                valueArray.push(cart.taxDelivery);
            }
        }

        if (isIfood && cart.taxIfood && cart.taxIfood > 0) {
            const taxIfood: PosPrintData = {
                type: 'text',
                value: characterPrint(["Taxa Servico Ifood:", `${cart.taxIfood.toFixed(2)}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px` }
            }
            array.push(taxIfood);
            valueArray.push(cart.taxIfood);
        }

        if (cart.cupom) {
            const { type, value } = cart.cupom;
            if (type === "percent") {
                const percentValue = (Number(value) * cartTotal) / 100;
                const cupomPercent: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Cupom:", `-${percentValue.toFixed(2)}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                }
                array.push(cupomPercent);
                valueArray.push(percentValue * -1);
            }

            if (type === "value") {
                const cupomFixed: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Cupom:", `-${Number(value).toFixed(2)}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                }
                array.push(cupomFixed);
                valueArray.push(Number(value) * -1);
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
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            const cashbackValue = cart.formsPayment.length === 1 ?
                Number((cartTotal * -1).toFixed(2)) :
                Number(cart.formsPayment.find((form: { payment: string; }) => form.payment === "cashback").value.toFixed(2)) * -1;

            array.push(cashback);
            valueArray.push(cashbackValue);
        }

        let totalValue = Number(valueArray.reduce((acc, value) => acc + value, 0).toFixed(2));

        if (
            (cart.formsPayment.some((form: { addon: AddonType }) => form.addon) && cart.formsPayment.some((form: { addon: { status: boolean; }; }) => form.addon.status === true))
            || (payload.printType && payload.printType === "command" && command.formsPayment.some((form: { addon: { status: boolean; }; }) => form.addon?.status === true))
        ) {
            let addonPayment = cart.formsPayment.find((form: { addon: { status: boolean; }; }) => form.addon.status);
            !addonPayment && (addonPayment = command.formsPayment.find((form: { addon: { status: boolean; }; }) => form.addon.status));
            const { type, value, valueType } = addonPayment.addon;
            const taxOrDiscount = type === "fee" ? "Taxa" : "Desconto";
            const addonValue = valueType === "fixed" ? value : (value / 100) * cartTotal;
            const convertedValue = taxOrDiscount === "Taxa" ? addonValue : addonValue * -1;
            const addon: PosPrintData = {
                type: 'text',
                value: characterPrint([`${taxOrDiscount} ${addonPayment.label}:`, `${convertedValue.toFixed(2)}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }
            totalValue += convertedValue;
            array.push(addon);
        }

        const total: PosPrintData = {
            type: 'text',
            value: characterPrint(["Total:", `${totalValue.toFixed(2)}`], "‎", "space-between", maxLength),
            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
        }
        array.push(total);

        if (isIfood) {
            const iFood: PosPrintData = {
                type: 'text',
                value: characterPrint(["PEDIDO IFOOD"], "‎", "center", maxLength),
                style: { fontWeight: "bold", fontSize: "15px" }
            }

            const pickupCode: PosPrintData = {
                type: 'text',
                value: characterPrint(["Código de coleta:", `${cart.controls.pickupCode}`], "‎", "space-between", maxLength),
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
            }

            array.push(iFood, pickupCode);
        }

        if (cart.statusPayment === "paid") {
            const paid: PosPrintData = {
                type: 'text',
                value: characterPrint(["PAGO ONLINE"], "‎", "center", maxLength),
                style: { fontWeight: "bold", fontSize: "15px" }
            }
            array.push(paid);
        } else {
            const paidWith: PosPrintData = payload.printType && payload.printType === 'command'
                ? {
                    type: 'text',
                    value: characterPrint(["Pagamento em:", `${command.formsPayment.map((formPayment) => `${formPayment.label}`)}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                }
                : {
                    type: 'text',
                    value: characterPrint(
                        [
                            "Pagamento em:",
                            `${isTable && table.opened
                                ? table.opened.formsPayment.map((formPayment) => `${formPayment.label}`)
                                : cart.formsPayment.map((formPayment) => `${formPayment.label}`)}`
                        ],
                        "‎",
                        "space-between",
                        maxLength
                    ),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                }
            array.push(paidWith);

            if (cart.formsPayment.some((form: { payment: string; }) => form.payment === "money") && cart.formsPayment.find((form: { payment: string; }) => form.payment === "money") && cart.type !== "T") {
                const moneyPayment = cart.formsPayment.find((form: { payment: string; }) => form.payment === "money");
                const moneyPaid: PosPrintData = {
                    type: 'text',
                    value: characterPrint(["Troco para:", `${Number(moneyPayment.change) !== totalValue ? `${Number(moneyPayment.change).toFixed(2)}` : "Não é necessário"}`], "‎", "space-between", maxLength),
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                }

                if (Number(moneyPayment.change) > totalValue) {
                    const change: PosPrintData = {
                        type: 'text',
                        value: characterPrint(["Troco:", `${(Number(moneyPayment.change) - totalValue).toFixed(2)}`], "‎", "space-between", maxLength),
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px` }
                    }
                    array.push(moneyPaid, change);
                } else {
                    array.push(moneyPaid);
                }
            }
        }
    } else {
        if (cart.cupom && !isIfood) {
            const cupomName: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                            <span>Cupom usado:</span>
                            <span>${cart.cupom.code}</span>
                        </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(cupomName);
        }

        if (cart.cupom && isIfood) {
            const cupomName: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                            <span>Cupom Dado:</span>
                            <span>${sponsorCupomIfood({ cart })}</span>
                        </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(cupomName);
        }

        if (isIfood) {
            const cupomName: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                            <span>Valores de cada cupom:</span>
                            <span>${valuesSponsorCupomIfood({ cart })}</span>
                        </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(cupomName);
        }

        if (payload.printType && payload.printType === 'command') {
            const commandTotalPrices: number[] = command.carts.map((cart) => cart.total);
            cartTotal = commandTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
            const subtotal: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>Sub-total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(subtotal);
            valueArray.push(cartTotal);
        } else if (isTable && table.opened) {
            const tableTotalPrices: number[] = table.opened?.commands.map((command) => command.carts.map((cart) => cart.total)).flat();
            cartTotal = tableTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
            const subtotal: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>Sub-total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(subtotal);
            valueArray.push(cartTotal);
        } else if (isTable && !table.opened) {
            const tableTotalPrices: number[] = cart.itens.map((item) => item.details.value);
            cartTotal = tableTotalPrices.reduce((acc: number, value: number) => acc + value, 0);
            const subtotal: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>Sub-total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
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
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(subtotal);
            valueArray.push(cartTotal);
        }

        if (isTable && table.opened && payload.printType !== 'command') {
            cart.command
                ? cart.command?.fees.map((fee) => {
                    if (fee.type === 'percent') {
                        const percentValue = (fee.value * cartTotal) / 100;
                        const tax: PosPrintData = {
                            type: 'text',
                            value: `<div style="display: flex; justify-content: space-between;">
                                    <span>${fee.code}:</span>
                                    <span>${percentValue.toFixed(2)}</span>
                                </div>`,
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                        }
                        array.push(tax);
                        valueArray.push(percentValue);
                    }
                })
                : table.opened.commands[0].fees.map((fee) => {
                    if (fee.type === 'percent') {
                        const percentValue = (fee.value * cartTotal) / 100;
                        const tax: PosPrintData = {
                            type: 'text',
                            value: `<div style="display: flex; justify-content: space-between;">
                                    <span>${fee.code}:</span>
                                    <span>${percentValue.toFixed(2)}</span>
                                </div>`,
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                        }
                        array.push(tax);
                        valueArray.push(percentValue);
                    }
                })

            if (table.opened && table.opened.commands.length > 1) {
                const allFixedFees = table.opened.commands.map((command) => {
                    return command.fees.filter((fee) => fee.quantity > 0 && fee.type === 'fixed');
                })

                const totalFees = allFixedFees.flat().reduce((acc: number, fee) => acc + fee.quantity, 0);

                cart.command ? cart.command?.fees.map((fee) => {
                    if (fee.type === 'fixed' && totalFees > 0) {
                        const tax: PosPrintData = {
                            type: 'text',
                            value: `<div style="display: flex; justify-content: space-between;">
                                        <span>${fee.code} (${totalFees}x):</span>
                                        <span>${(fee.value * totalFees).toFixed(2)}</span>
                                    </div>`,
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                        }
                        array.push(tax);
                        valueArray.push(fee.value * totalFees);
                    }
                }) : table.opened.commands[0].fees.map((fee) => {
                    if (fee.type === 'fixed' && totalFees > 0) {
                        const tax: PosPrintData = {
                            type: 'text',
                            value: `<div style="display: flex; justify-content: space-between;">
                                        <span>${fee.code} (${totalFees}x):</span>
                                        <span>${(fee.value * totalFees).toFixed(2)}</span>
                                    </div>`,
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                        }
                        array.push(tax);
                        valueArray.push(fee.value * totalFees);
                    }
                })
            } else {
                cart.command?.fees.map((fee) => {
                    if (fee.type === 'fixed' && fee.quantity > 0) {
                        const tax: PosPrintData = {
                            type: 'text',
                            value: `<div style="display: flex; justify-content: space-between;">
                                        <span>${fee.code} (${fee.quantity}x):</span>
                                        <span>${(fee.value * fee.quantity).toFixed(2)}</span>
                                    </div>`,
                            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                        }
                        array.push(tax);
                        valueArray.push(fee.value * fee.quantity);
                    }
                })
            }
        } else if (payload.printType === 'command') {
            command?.fees.map((fee) => {
                if (fee.type === 'percent') {
                    const percentValue = (fee.value * cartTotal) / 100;
                    const tax: PosPrintData = {
                        type: 'text',
                        value: `<div style="display: flex; justify-content: space-between;">
                                    <span>${fee.code}:</span>
                                    <span>${percentValue.toFixed(2)}</span>
                                </div>`,
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                    }
                    array.push(tax);
                    valueArray.push(percentValue);
                }

                if (fee.type === 'fixed' && fee.quantity > 0) {
                    const tax: PosPrintData = {
                        type: 'text',
                        value: `<div style="display: flex; justify-content: space-between;">
                                    <span>${fee.code} (${fee.quantity}x):</span>
                                    <span>${(fee.value * fee.quantity).toFixed(2)}</span>
                                </div>`,
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
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
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(taxDelivery);

            if (typeof cart.taxDelivery === "number" && cart.taxDelivery > 0) {
                valueArray.push(cart.taxDelivery);
            }
        }

        if (isIfood && cart.taxIfood && cart.taxIfood > 0) {
            const taxIfood: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                            <span>Taxa Servico Ifood:</span>
                            <span>${cart.taxIfood.toFixed(2)}</span>
                        </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            array.push(taxIfood);
            valueArray.push(cart.taxIfood);
        }

        if (cart.cupom) {
            const { type, value } = cart.cupom;
            if (type === "percent") {
                const percentValue = (Number(value) * cartTotal) / 100;
                const cupomPercent: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                                <span>Cupom:</span>
                                <span>-${percentValue.toFixed(2)}</span>
                            </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                }
                array.push(cupomPercent);
                valueArray.push(percentValue * -1);
            }

            if (type === "value") {
                const cupomFixed: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                                <span>Cupom:</span>
                                <span>-${Number(value).toFixed(2)}</span>
                            </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                }
                array.push(cupomFixed);
                valueArray.push(Number(value) * -1);
            }

            if (type === "freight") {
                const cupomFreight: PosPrintData = {
                    type: 'text',
                    value: "Cupom de frete grátis!",
                    style: { fontWeight: "bold", fontSize: "15px", fontFamily: "monospace" }
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
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            const cashbackValue = cart.formsPayment.length === 1 ?
                Number((cartTotal * -1).toFixed(2)) :
                Number(cart.formsPayment.find((form: { payment: string; }) => form.payment === "cashback").value.toFixed(2)) * -1;

            array.push(cashback);
            valueArray.push(cashbackValue);
        }

        let totalValue = Number(valueArray.reduce((acc, value) => acc + value, 0).toFixed(2));


        if (
            (cart.formsPayment.some((form: { addon: AddonType }) => form.addon) && cart.formsPayment.some((form: { addon: { status: boolean; }; }) => form.addon?.status === true))
            || (payload.printType && payload.printType === "command" && command.formsPayment.some((form: { addon: { status: boolean; }; }) => form.addon?.status === true))
        ) {
            let addonPayment = cart.formsPayment.find((form: { addon: { status: boolean; }; }) => form.addon.status);
            !addonPayment && (addonPayment = command.formsPayment.find((form: { addon: { status: boolean; }; }) => form.addon.status));
            const { type, value, valueType } = addonPayment.addon;
            const taxOrDiscount = type === "fee" ? "Taxa" : "Desconto";
            const addonValue = valueType === "fixed" ? value : (value / 100) * cartTotal;
            const convertedValue = taxOrDiscount === "Taxa" ? addonValue : addonValue * -1;
            const addon: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                            <span>${taxOrDiscount} ${addonPayment.label}:</span>
                            <span>${convertedValue.toFixed(2)}</span>
                        </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
            }
            totalValue += convertedValue;
            array.push(addon);
        }

        const total: PosPrintData = {
            type: 'text',
            value: `<div style="display: flex; justify-content: space-between;">
                        <span>Total:</span>
                        <span>${totalValue.toFixed(2)}</span>
                    </div>`,
            style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
        array.push(total);

        if (isIfood) {
            const iFood: PosPrintData = {
                type: 'text',
                value: "PEDIDO IFOOD",
                style: { fontWeight: "bold", textAlign: "center", fontSize: "15px", marginRight: `${marginRight}px`, fontFamily: "monospace" }
            }

            const pickupCode: PosPrintData = {
                type: 'text',
                value: `<div style="display: flex; justify-content: space-between;">
                        <span>Código de coleta:</span>
                        <span>${cart.controls.pickupCode}</span>
                    </div>`,
                style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, fontFamily: "monospace" }
            }

            array.push(iFood, pickupCode);
        }

        if (cart.statusPayment === 'paid') {
            const paid: PosPrintData = {
                type: 'text',
                value: "PAGO ONLINE",
                style: { fontWeight: "bold", textAlign: "center", fontSize: "15px", marginRight: `${marginRight}px`, fontFamily: "monospace" }
            }
            array.push(paid);
        } else {
            const paidWith: PosPrintData = payload.printType && payload.printType === 'command'
                ? {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                        <span>Pagamento em:</span>
                        <span>${command.formsPayment.map((formPayment) => `${formPayment.label}`)}</span>
                    </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                }
                : {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                        <span>Pagamento em:</span>
                        <span>${isTable && table.opened
                            ? table.opened.formsPayment.map((formPayment) => `${formPayment.label}`)
                            : cart.formsPayment.map((formPayment) => `${formPayment.label}`)}</span>
                    </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                }
            array.push(paidWith);

            if (cart.formsPayment.some((form: { payment: string; }) => form.payment === "money") && cart.formsPayment.find((form: { payment: string; }) => form.payment === "money").change && cart.type !== "T") {
                const moneyPayment = cart.formsPayment.find((form: { payment: string; }) => form.payment === "money");
                const moneyPaid: PosPrintData = {
                    type: 'text',
                    value: `<div style="display: flex; justify-content: space-between;">
                            <span>Troco para:</span>
                            <span>${Number(moneyPayment.change) !== totalValue ? `${Number(moneyPayment.change).toFixed(2)}` : "Não é necessário"}</span>
                        </div>`,
                    style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                }

                if (Number(moneyPayment.change) > totalValue) {
                    const change: PosPrintData = {
                        type: 'text',
                        value: `<div style="display: flex; justify-content: space-between;">
                                <span>Troco:</span>
                                <span>${(Number(moneyPayment.change) - totalValue).toFixed(2)}</span>
                            </div>`,
                        style: { fontWeight: "bold", fontSize: "15px", marginRight: `${marginRight}px`, marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
                    }
                    array.push(moneyPaid, change);
                } else {
                    array.push(moneyPaid);
                }
            }
        }
    }
    return array;
}

const generateAddress = (cart: CartType, hr: PosPrintData, marginLeft: number): PosPrintData[] => {
    return [
        hr,
        {
            type: 'text',
            value: `${cart.address.street},`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        },
        {
            type: 'text',
            value: `${cart.address.number} ${cart.address.complement ?? ""}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        },
        {
            type: 'text',
            value: `${cart.address.neighborhood} - ${cart.address.city}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        },
        {
            type: 'text',
            value: `${cart.address.reference ?? ""}`,
            style: { fontWeight: "bold", fontSize: "15px", marginLeft: `${marginLeft}px`, fontFamily: "monospace" }
        }
    ]
}

const generateNFCe = async (cart: CartType, isGeneric: boolean, hr: PosPrintData, marginLeft: number, marginRight: number): Promise<PosPrintData[]> => {
    if (!cart.controls.grovenfe) return
    const { fiscal_note } = cart.controls.grovenfe;
    const finalArray = [hr];

    const accessKey: PosPrintData = {
        type: 'text',
        value: "Consulte pela Chave de Acesso em:",
        style: { fontWeight: "bold", fontSize: "15px", textAlign: 'center', marginRight: `${marginRight}px`, fontFamily: "monospace" }
    }

    const keyUrl: PosPrintData = {
        type: 'text',
        value: `${fiscal_note.aditional_info.url_consulta_nf}`,
        style: { fontWeight: "bold", fontSize: "10px", textAlign: 'center', marginRight: `${marginRight}px`, marginBottom: "5px", fontFamily: "monospace" }
    }

    const key: PosPrintData = {
        type: 'text',
        value: "Chave de acesso:",
        style: { fontWeight: "bold", fontSize: "15px", textAlign: 'center', marginRight: `${marginRight}px`, fontFamily: "monospace" }
    }

    const keyValue: PosPrintData = {
        type: 'text',
        value: `${fiscal_note.aditional_info.chave_nfe.replace(/\D/g, "")}`,
        style: { fontWeight: "bold", fontSize: "10px", textAlign: 'center', marginRight: `${marginRight}px`, marginBottom: "5px", fontFamily: "monospace" }
    }

    const protocolLabel: PosPrintData = {
        type: 'text',
        value: "Protocolo:",
        style: { fontWeight: "bold", fontSize: "15px", textAlign: 'center', marginRight: `${marginRight}px`, fontFamily: "monospace" }
    }

    const protocol: PosPrintData = {
        type: 'text',
        value: `${fiscal_note.aditional_info.protocolo}`,
        style: { fontWeight: "bold", fontSize: "15px", textAlign: 'center', marginRight: `${marginRight}px`, fontFamily: "monospace" }
    }

    const protocolDate: PosPrintData = {
        type: 'text',
        value: `${DateTime.fromISO(fiscal_note.created_at).toFormat("dd/MM/yyyy HH:mm:ss")}`,
        style: { fontWeight: "bold", fontSize: "15px", textAlign: 'center', marginRight: `${marginRight}px`, marginBottom: "5px", fontFamily: "monospace" }
    }

    finalArray.push(accessKey, keyUrl, key, keyValue, protocolLabel, protocol, protocolDate);

    if (isGeneric) {
        const qrLabel: PosPrintData = {
            type: 'text',
            value: "Consulta via link:",
            style: { fontWeight: "bold", fontSize: "15px", textAlign: 'center', marginRight: `${marginRight}px` }
        }

        const printData: PosPrintData = {
            type: 'text',
            value: fiscal_note.aditional_info.qrcode_url,
            style: { fontWeight: 'bold', fontSize: '14px' }
        };

        finalArray.push(qrLabel, printData);
    } else {
        const qrLabel: PosPrintData = {
            type: 'text',
            value: "Consulta via leitor de QR Code:",
            style: { fontWeight: "bold", fontSize: "15px", textAlign: 'center', marginRight: `${marginRight}px`, fontFamily: "monospace" }
        }

        const qrCode: PosPrintData = {
            type: 'qrCode',
            position: 'center',
            value: fiscal_note.aditional_info.qrcode_url,
            style: { textAlign: 'center', marginBottom: "5px", marginRight: `${marginRight}px`, fontFamily: "monospace" }
        }
        finalArray.push(qrLabel, qrCode);
    }

    return finalArray;
}

const generateFooter = (isTable: boolean, isDelivery: boolean, isGeneric: boolean, hr: PosPrintData, maxLength: number): PosPrintData[] => {
    const printFooter: PosPrintData[] = isGeneric
        ? [
            hr,
            {
                type: 'text',
                value: characterPrint([`**${isTable ? "Pedido Mesa" : isDelivery ? "Delivery" : "Vou retirar no local"}**`], '‎', 'center', maxLength),
                style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px", marginBottom: "0px" }
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
                style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px", marginBottom: "0px", fontFamily: "monospace" }
            },
            {
                type: 'text',
                value: "Tecnologia",
                style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px", fontFamily: "monospace" }
            },
            {
                type: 'text',
                value: "www.whatsmenu.com.br",
                style: { fontWeight: "bold", textAlign: 'center', fontSize: "15px", fontFamily: "monospace" }
            }
        ];

    return printFooter;
}

export const printService = async (payload: PrintPayloadType, printOptions: Electron.WebContentsPrintOptions, paperSize: number, isGeneric: boolean) => {
    const { cart, table } = payload;
    const { left, right } = printOptions.margins;
    const marginLeft = left && left > 0 ? left : 0;
    const marginRight = right && right > 0 ? right : 0;
    const isDelivery = (cart.type === 'D' || cart.type === 'P') && cart.address;
    const isTable = cart.type === 'T';
    const isIfood = cart.origin === 'ifood';
    const isNFCe = cart.controls.grovenfe?.fiscal_note?.url_consulta_nf;
    let maxLength = 0;
    if (isGeneric) {
        if (paperSize <= 58) {
            maxLength = 32;
        } else {
            maxLength = 48;
        }
    } else {
        if (paperSize <= 58) {
            maxLength = 38;
        } else {
            maxLength = 54;
        }
    }

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

    const upperPrint: PosPrintData[] = generateUpper(payload, isGeneric, isTable, isIfood, marginLeft, maxLength, blankLine);

    const itensPrint: PosPrintData[] = generateItens(payload, isGeneric, isTable, hr, marginLeft, marginRight, maxLength);

    const printIndividualCommands: PosPrintData[] = isTable && table?.opened?.commands.length > 1 && table?.opened?.formsPayment.length > 0 && payload.printType !== 'command'
        ? generateIndCommands(table, marginLeft, marginRight, hr)
        : [];

    const orderObs: PosPrintData[] = isDelivery && cart.obs
        ? generateObs(cart, marginLeft, marginRight, maxLength, hr)
        : [];

    const cartTotal = 0

    const printPayment: PosPrintData[] = isTable && !payload.printType
        ? []
        : generatePayments(payload, isGeneric, isTable, isDelivery, isIfood, marginLeft, marginRight, maxLength, hr, cartTotal);

    const printAdress: PosPrintData[] = isDelivery
        ? generateAddress(cart, hr, marginLeft)
        : [];

    const printNFCe: PosPrintData[] = isNFCe ? await generateNFCe(cart, isGeneric, hr, marginLeft, marginRight) : [];

    const printFooter: PosPrintData[] = generateFooter(isTable, isDelivery, isGeneric, hr, maxLength);

    const fullPrint: PosPrintData[] = [
        ...upperPrint,
        ...itensPrint,
        ...printIndividualCommands,
        ...orderObs,
        ...printPayment,
        ...printAdress,
        ...printNFCe,
        ...printFooter,
    ];

    await PosPrinter.print(fullPrint, {
        printerName: printOptions.deviceName,
        preview: false,
        silent: printOptions.silent,
        pageSize: paperSize > 59 ? "80mm" : "58mm",
        margin: '0 0 0 0',
        boolean: undefined
    }).catch((error) =>
        console.error("Erro na impressão:", error)
    );
};