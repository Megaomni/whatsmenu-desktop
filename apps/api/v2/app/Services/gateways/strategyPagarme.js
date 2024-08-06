const axios = require("axios");
const { DateTime } = require("luxon");
const Gateway = require("./strategy/gateway");
const Env = use("Env");
const Ws = use("Ws");
const User = use("App/Models/User");
const Invoice = use("App/Models/Invoice");
const SystemProduct = use("App/Models/SystemProduct");
const FlexPlan = use("App/Models/FlexPlan");
const SystemRequest = use("App/Models/SystemRequest");


class StrategyPagarme {
    constructor(security_key, public_key) {
        this.security_key = security_key;
        this.public_key = public_key;
        this.headers = {
            accept: 'application/json',
            'content-type': 'application/json',
            authorization: `Basic ${Buffer.from(`${security_key}:*`).toString("base64")}`
        }
    }

    async addSubscriptionDiscount(data, subscriptionId) {
        return await axios({
            url: `https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/discounts`,
            method: "POST",
            data: {
                value: data.value,
                discount_type: data.discountType,
                cycles: data.cycles,
                item_id: data.itemId
            },
            headers: this.headers
        });

    }

    async addSubscriptionIncrement(data, subscriptionId) {
        return await axios({
            url: `https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/discounts`,
            method: "POST",
            data: {
                value: data.value,
                increment_type: data.typeIncrement,
                cycles: data.cycles,
                item_id: data.itemId
            },
            headers: this.headers
        });
    }

    async addSubscriptionItem(data, subscriptionId) {
        return await axios({
            url: `https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/items`,
            method: "POST",
            headers: this.headers,
            data
        });
    }

    async changeChargeCard(chargeId, cardId, updateSubscriptionCard = false) {
        return await axios({
            url: `https://api.pagar.me/core/v5/charges/${chargeId}/card`,
            method: "PATCH",
            data: {
                card_id: cardId,
                update_subscription: updateSubscriptionCard
            },
            headers: this.headers
        })
    }

    async changeSubscriptionCard(subcriptionId, cardId) {
        return await axios({
            url: `https://api.pagar.me/core/v5/subscriptions/${subcriptionId}/card`,
            method: "PATCH",
            data: {
                card_id: cardId
            },
            headers: this.headers
        })
    }

    async createCard(data) {

        return await axios({
            url: `https://api.pagar.me/core/v5/customers/${data.customerId}/cards`,
            method: "POST",
            data: {
                token: data.token,
                billing_address_id: data.billing_address_id
            },
            headers: this.headers
        });
    }

    async createCheckoutOrPurchaseCard(data) {
        try {
            return await axios({
                url: "https://api.pagar.me/core/v5/orders",
                method: "POST",
                data: {
                    customer_id: data.user.controls.paymentInfo.customerId,
                    items: data.items,
                    metadata: {
                        userId: data.user.id,
                        invoices: data.invoices,
                        installments: data.metaInstallments
                    },
                    ip: data.clientIp,
                    payments: data.payments,
                },
                billing_address_id: data.billing_address_id,
                headers: this.headers
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createCustomer(userData) {
        try {
            if (userData) {
                const secretNumber = userData.secretNumber.replace(/[^0-9]/g, "");


                if (!userData.controls.paymentInfo.customerId) {
                    const area_code = userData.whatsapp.slice(0, 2);
                    const number = userData.whatsapp.slice(2)

                    return await axios({
                        url: 'https://api.pagar.me/core/v5/customers',
                        method: "POST",
                        data: {
                            code: userData.id,
                            email: userData.email,
                            metadata: {
                                userId: userData.id
                            },
                            name: userData.name,
                            document: secretNumber,
                            document_type: secretNumber.length > 11 ? "CNPJ" : "CPF",
                            type: secretNumber.length > 11 ? "company" : "individual",
                            phones: {
                                mobile_phone: {
                                    country_code: '55',
                                    area_code: area_code,
                                    number: number
                                }
                            },
                            address: {
                                country: 'BR',
                                state: 'SP',
                                city: 'Santos',
                                zip_code: '11025100',
                                line_1: '400, Major Santos Silva, Embare',
                                line_2: 'Espaço coletivo'
                            }
                        },
                        headers: this.headers
                    });
                }

                throw {
                    status: 403,
                    message: 'Forbidden, this user is already a registered user'
                }
            }

            throw {
                status: 400,
                message: 'Parameter userData is required'
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async createSubscription(data, billing_type = "prepaid") {

        try {
            return await axios({
                url: "https://api.pagar.me/core/v5/subscriptions",
                method: "POST",
                data: {
                    payment_method: data.paymentMethod,
                    interval: data.interval,
                    interval_count: 1,
                    billing_type: billing_type,
                    installments: data.installments,
                    items: data.items.map(item => {
                        const service = isNaN(item.id) ? item.id.split("_")[0] : item.service;

                        return {
                            id: isNaN(item.id) ? item.id : `${item.service}_${item.id}_${item.price_id}`,
                            cycles: service !== "plan" ? 1 : undefined,
                            pricing_scheme: {
                                scheme_type: 'Unit',
                                price: parseInt(item.value)
                            },
                            name: item.name,
                            quantity: item.quantity,
                            description: item.description ? item.description : `${item.name} ${item.service}`,
                        }
                    }),
                    card_id: data.card_id,
                    currency: 'BRL',
                    customer_id: data.customer_id,
                    metadata: data.metadata
                },
                headers: this.headers
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteCard(data) {
        return await axios.delete(`https://api.pagar.me/core/v5/customers/${data.customerId}/cards/${data.cardId}`, {
            headers: this.headers,
        });
    }

    async cancelSubscription(subscriptionId, data = {}) {
        return await axios({
            url: `https://api.pagar.me/core/v5/subscriptions/${subscriptionId}`,
            method: "DELETE",
            data: {
                cancel_pending_invoices: data.cancel_pending_invoices
            },
            headers: this.headers
        });
    }

    async deleteSubscriptionItem(itemId, subscriptionId, cancel_pending_invoices) {
        return await axios({
            url: `https://api.pagar.me/core/v5/subscriptions/${subscriptionId}/items/${itemId}`,
            method: "DELETE",
            data: {
                cancel_pending_invoices: cancel_pending_invoices
            },
            headers: this.headers
        });

    }

    async getSubscription(subscription_id) {
        return await axios({
            url: `https://api.pagar.me/core/v5/subscriptions/${subscription_id}`,
            method: "GET",
            headers: this.headers
        })
    }

    async updateChargeOrSubscriptionCard(data) {
        if (data.chargeId) {
            return await axios({
                url: `https://api.pagar.me/core/v5/charges/${data.chargeId}/card`,
                method: "PATCH",
                data: {
                    card_id: data.cardId
                },
                headers: this.headers
            })
        }

        return await axios({
            url: `https://api.pagar.me/core/v5/subscriptions/${data.subscriptionId}/card`,
            method: "PATCH",
            data: {
                card_id: data.cardId
            },
            headers: this.headers
        })
    }

    //WEBHOOKS

    async webhookOrderPaid(event) {
      console.log(`profile:${event.data.id}`);
        const orderTopic = Ws.getChannel('profile:*').topic(`profile:${event.data.id}`);
        console.log(orderTopic);
        orderTopic.broadcast(`profile:${event.data.id}`, { paid: true })
    }

    async webhookDeletedCard(event) {
        const data = event.data;
        const user = await User.find(data.customer.code);

        if (user) {
            console.log('Starting: ', { webhook: 'pagarme:card.updated', linha: 282, metodo: `webhookDeletedCard:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
            const newCards = user.controls.paymentInfo.cards.filter(card => card.id !== data.id);

            user.controls.paymentInfo.cards = newCards;
            await user.save();

            return user.toJSON();
        }
    }

    async webhookExpiredCard(event) {
        const data = event.data;
        const user = await User.find(data.customer.code);

        if (user) {
            console.log('Starting: ', { webhook: 'pagarme:card.expired', linha: 297, metodo: `webhookExpiredCard:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
            for (const card of user.controls.paymentInfo.cards) {
                if (card.id === data.id) {
                    card.status = "expired";
                }
            }

            await user.save();

            return user.toJSON();
        }
    }

    async webhookUpdatedCard(event) {
        const data = event.data;
        const user = await User.find(data.customer.code);

        if (user && user.controls.paymentInfo.cards) {
            console.log('Starting: ', { webhook: 'pagarme:card.updated', linha: 315, metodo: `webhookUpdatedCard:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
            for (const card of user.controls.paymentInfo.cards) {
                if (card.id === data.id) {
                    card.brand = data.brand;
                    card.exp_month = data.exp_month,
                        card.exp_year = data.exp_year,
                        card.firstDigits = data.first_six_digits,
                        card.holderName = data.holder_name
                }
            }
        }

        await user.save();

        return user.toJSON();
    }

    async webhookChargePaid(event) {
        const data = event.data;

        if (data.order && data.order.status === "paid" && data.order.metadata.invoices) {
            const user = await User.find(data.customer.code);
            const invoicesIds = JSON.parse(data.order.metadata.invoices);
            const installments = data.order.metadata.installments;

            if (user) {
                console.log('Starting: ', { webhook: 'pagarme:charge.paid', linha: 337, metodo: `webhookChargePaid:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
                const invoices = await user.invoices().whereIn("id", invoicesIds).fetch();
                const items = [];
                const subscription = user.controls.paymentInfo.subscription;

                if (invoices.rows.length) {
                    for (let i = 0; i < invoices.rows.length; i++) {
                        const invoice = invoices.rows[i]
                        invoice.status = "paid";

                        const systemRequest = await invoice.requests().where({ status: "paid" }).last();

                        if (!(DateTime.local().toFormat("yyyy-MM-dd") === DateTime.fromSQL(systemRequest).toFormat("yyyy-MM-dd"))) {
                            await this.__generateRequest(`${data.last_transaction.id}-${i + 1}`, invoice, data, "paid");
                        }

                        await invoice.save();

                        if (invoice.type === "monthly" && subscription.status !== "active") {
                            const invItems = invoice.itens.filter(ivItem => ivItem.service === "plan").map(item => {
                                item.value = (item.value * 100)
                                return item
                            });

                            items.push(...invItems);
                        }
                    }

                    if (invoices.rows.length && invoices.rows.some(invoice => invoice.type === "monthly" || invoice.type === "first")) {
                        if (subscription.status !== "active") {
                            const dataSubscription = {
                                payment_method: `${data.last_transaction.card.type}_card`,
                                interval: user.controls.period.replace("ly", ""),
                                minimum_price: 1000,
                                interval_count: 1,
                                installments: installments ? installments : 1,
                                items: items,
                                card_id: data.last_transaction.card.id,
                                quantity: null,
                                currency: 'BRL',
                                customer_id: user.controls.paymentInfo.customerId
                            }
                            const { data: subscription } = await this.createSubscription(dataSubscription, "postpaid")

                            if (subscription.status !== "failed") {
                                const profile = await user.profile().fetch();

                                user.controls.paymentInfo.subscription = {
                                    id: subscription.id,
                                    status: "active"
                                }

                                if (profile && profile.status === 0) {
                                    profile.status = 1;
                                    await profile.save();
                                }

                                if (user.controls.paymentInfo.cards) {
                                    const card = user.controls.paymentInfo.cards.find(card => card.id === subscription.card.id);
                                    if (card) {
                                        user.controls.paymentInfo.default_card = card.id;
                                    }
                                }
                                await user.save();
                            }

                            return data
                        }
                    }

                }
            }
        }
    }

    async webhookChargePaymentFailed(event) {
        const data = event.data;

        if (data.order && data.order.status === "failed" && data.order.metadata.invoices) {
            const user = await User.find(data.customer.code);
            const invoicesIds = JSON.parse(data.order.metadata.invoices);

            if (user) {
                console.log('Starting: ', { webhook: 'pagarme:charge.payment_failed', linha: 421, metodo: `webhookChargePaymentFailed:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
                const profile = await user.profile().fetch();

                if (profile) {
                    await profile.status
                }
                const invoices = await user.invoices().whereIn("id", invoicesIds).fetch();

                if (invoices.rows) {
                    for (let i = 0; i < invoices.rows.length; i++) {
                        const invoice = invoices.rows[i];
                        await this.__generateRequest(`${data.last_transaction.id}-${i + 1}`, invoice, data, "canceled");
                    }
                }

                return data
            }
        }
    }

    async webhookCanceledInvoice(event) {
        const data = event.body;
        const user = await User.find(data.customer.code);

        if (user) {
            console.log('Starting: ', { webhook: 'pagarme:invoice.canceled', linha: 421, metodo: `webhookCanceledInvoice:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
            const invoice = await user.invoices().where({ invoice_code: data.id });

            if (invoice) {
                invoice.status = "canceled";
                await this.__generateRequest(data.charge.last_transaction.id, invoice, data);
                await invoice.save();
            } else {
                const items = this.__getDataItems(data.items);
                const newInvoice = await this.__generateInvoice(data.id, data, items, user.id, "canceled");
                await this.__generateRequest(data.charge.last_transaction.id, newInvoice, data);
            }
        }
    }

    async webhookInvoiceCreated(event) {

        try {
            const data = event.data;
            const user = await User.find(data.customer.code);
            console.log('Starting: ', { webhook: 'pagarme:invoice.created', linha: 469, metodo: `webhookInvoiceCreated:${data.customer.code}`, user: user ? user.id : null, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })

            if (user && user.controls.paymentInfo) {
                let where = { userId: user.id, type: 'monthly', status: 'pending' };

                if (data.charge.recurrence_cycle === 'first') {
                    const invoicesIds = JSON.parse(data.charge.metadata.invoices);
                    where = { id: invoicesIds[0] }
                }

                let invoice = await user.invoices().where(where).last()

                if (invoice && invoice.invoice_code === data.id) {
                    return;
                }

                const systemProducts = await SystemProduct.all();
                const flexPlans = await FlexPlan.all();
                const invoiceItems = this.__getDataItems(data.items, flexPlans.toJSON(), systemProducts.toJSON());

                switch (data.status) {
                    case "scheduled":
                        await this.__generateInvoice(data.id, data, invoiceItems, user.id, "upcoming");
                        break;
                    case "paid":
                    case "failed":
                        const status = data.status === 'paid' ? 'paid' : 'pending';
                        if (!invoice) {
                            invoice = await this.__generateInvoice(data.id, data, invoiceItems, user.id, status);
                        } else {
                            if (invoice.invoice_code == data.id || !invoice.invoice_code) {
                                invoice.status = status;
                                invoice.invoice_code = data.id
                                await invoice.save();
                            }
                        }

                        if (status === "paid" && invoice) {
                            await this.__generateRequest(data.charge.last_transaction.id, invoice, data, status);
                        } else {
                            console.log(`Não foi encontrada nenhuma invoice com invoice_code ${data.id} para o usuário ${user.id}`)
                        }

                        break;

                }
                // await this.__generateRequest(data.charge.last_transaction.id, invoice, data);

                return data
            } else if (user) {
                throw {
                    message: `Usuário não encontrado, ${user.id}`,
                    status: 404
                }
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async webhookInvoicePaid(event) {
        const data = event.data;
        const user = await User.find(data.customer.code);
        console.log('Starting: ', { webhook: 'pagarme:invoice.paid', linha: 516, metodo: `webhookInvoicePaid:${data.customer.code}`, user: user ? user.id : null, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })

        try {
            if (user && user.controls.paymentInfo) {
                const profile = await user.profile().fetch();
                const subscription = user.controls.paymentInfo.subscription;
                const invoice = await user.invoices().where({ invoice_code: data.id }).orWhere({ type: data.charge.recurrence_cycle === 'first' ? 'first' : 'monthly', status: 'pending' }).last();

                if (invoice) {
                    if (invoice.status !== "paid") {
                        invoice.status = "paid";
                        await invoice.save();
                    }

                    const systemRequest = await invoice.requests().where({ transactionId: data.charge.last_transaction.id }).last();
                    if (!systemRequest) {
                        await this.__generateRequest(data.charge.last_transaction.id, invoice, data, "paid");
                    } else if (systemRequest.status === "pending") {
                        systemRequest.status = "paid";
                        await systemRequest.save();
                    }
                } else {
                    const pendingInvoice = await user.invoices()
                        .where({ invoice_code: data.id, status: "pending" })
                        .orWhere({ type: "first", status: "pending" })
                        .orWhere({ type: "monthly", status: "pending" })
                        .last();

                    if (pendingInvoice) {
                        pendingInvoice.status = "paid";

                        if (pendingInvoice.invoice_code !== data.id) {
                            pendingInvoice.invoice_code = data.id;
                        }

                        const systemRequest = await pendingInvoice.requests().where({ status: "paid" }).last();

                        if (!(DateTime.local().toFormat("yyyy-MM-dd") === DateTime.fromSQL(systemRequest).toFormat("yyyy-MM-dd")) || !systemRequest) {
                            await this.__generateRequest(data.charge.last_transaction.id, pendingInvoice, data, "paid");
                        }

                        await pendingInvoice.save();

                        if (subscription && subscription.status === 'canceled') {

                            const oldSubscription = await axios({ url: `https://api.pagar.me/core/v5/subscriptions/${subscription.id}`, headers: this.headers })
                            const dataSubscription = {
                                payment_method: `${data.last_transaction.card.type}_card`,
                                interval: user.controls.period.replace("ly", ""),
                                minimum_price: 1000,
                                interval_count: 1,
                                installments: oldSubscription.installments,
                                items: pendingInvoice.itens,
                                card_id: data.last_transaction.card.id,
                                quantity: null,
                                currency: 'BRL',
                                customer_id: user.controls.paymentInfo.customerId
                            }
                            const { data: subscription } = await this.createSubscription(dataSubscription, "postpaid");

                            if (subscription.status === 'active') {
                                user.controls.paymentInfo.subscription = {
                                    id: subscription.id,
                                    status: 'active'
                                }

                                if (profile && profile.status === 0) {
                                    profile.status = 1;
                                    await profile.save()
                                }
                                await user.save();
                            }

                        }
                    }

                }
            }

        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async webhookFailedInvoicePayment(event) {
        const data = event.data;
        const user = await User.find(data.customer.code);

        if (user) {
            console.log('Starting: ', { webhook: 'pagarme:invoice.payment_failed', linha: 510, metodo: `webhookFailedInvoicePayment:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })

            const invoice = await user.invoices()
                .whereNot("type", "addon")
                .where({ invoice_code: data.id, status: "pending" })
                .orWhere({ type: 'first', status: 'pending' })
                .orWhere({ status: 'pending' })
                .last()

            if (invoice) {
                invoice.status = "pending";
                const systemRequest = await invoice.requests().where({ transactionId: data.charge.last_transaction.id, status: "canceled" }).last();

                if (!systemRequest) {
                    await this.__generateRequest(data.charge.last_transaction.id, invoice, data, "canceled");
                }
                await invoice.save();
            } else {
                const flexPlans = await FlexPlan.all();
                const systemProducts = await SystemProduct.all();

                const items = this.__getDataItems(data.items, flexPlans.toJSON(), systemProducts.toJSON())
                const newInvoice = await this.__generateInvoice(data.id, data, items, user.id, "pending");
                const systemRequests = await SystemRequest.query().where({ transactionId: data.charge.last_transaction.id }).fetch();

                if (systemRequests.rows.length) {
                    await this.__generateRequest(`${data.charge.last_transaction.id}-${systemRequests.rows.length}`, newInvoice, data, "canceled");
                } else {
                    await this.__generateRequest(data.charge.last_transaction.id, newInvoice, data, "canceled");
                }
            }

            if (data.recurrence_cycle === "subsequent") {
                const profile = await user.profile().fetch();
                profile.status = 0;
                await profile.save();
            }

            if (user.controls.paymentInfo.subscription) {
                if (user.controls.paymentInfo.subscription.status !== "canceled") {
                    const { data: canceledSubscription } = await gatewayPagarme.cancelSubscription(user.controls.paymentInfo.subscription.id, { cancel_pending_invoices: true });

                    if (canceledSubscription.canceled_at) {
                        user.controls.paymentInfo.subscription.status = "canceled";
                        await user.save()
                    }
                }
            }
        }
    }

    async webhookUpdatedInvoice(event) {
        const data = event.data;
        const user = await User.find(data.customer.code);

        if (user) {
            console.log('Starting: ', { webhook: 'pagarme:invoice.updated', linha: 653, metodo: `webhookUpdatedInvoice:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
            const flexPlans = await FlexPlan.all();
            const systemProducts = await SystemRequest.all();

            const invoice = await user.invoice({ invoice_code: data.id });
            if (invoice) {
                const items = this.__getDataItems(data.items, flexPlans.toJSON(), systemProducts.toJSON());
                invoice.items = items;
                const systemRequests = await invoice.requests().fetch();

                if (systemRequests) {
                    for (const systemRequest of systemRequests.rows) {
                        if (systemRequest.status !== "canceled") {
                            systemRequest.pagahiper = [data];
                        }
                    }
                }

                if (data.charge.recurrence_cycle === "subsequent") {
                    const profile = await user.profile().fetch();
                    profile.status = 0;
                    await profile.save();
                }

                await invoice.save();
            }

        }
    }

    async webhookSubscriptionCreated(event) {
        const data = event.data;
        const user = await User.find(data.customer.code);

        if (user) {
            console.log('Starting: ', { webhook: 'pagarme:subscription.created', linha: 688, metodo: `webhookSubscriptionCreated:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
            const profile = await user.profile().fetch();

            user.controls.paymentInfo.subscription = {
                id: data.id,
                status: data.status === "active" ? data.status : "disabled"
            }

            if (data.status === 'active' && profile) {
                const cards = user.controls.paymentInfo.cards;

                if (cards && cards.some(card => card.id === data.card.id)) {
                    user.controls.paymentInfo.default_card = data.card.id;
                }

                if (!profile.status) {
                    profile.status = 1;
                    await profile.save();
                }
            }

            await user.save();
            return user.toJSON();
        }

        throw {
            message: "User not found for this user subscription code"
        }

    }

    async webhookSubscriptionCanceled(event) {
        const data = event.data;
        const user = await User.find(data.customer.code);
        if (user) {
            console.log('Starting: ', { webhook: 'pagarme:subscription.canceled', linha: 724, metodo: `webhookSubscriptionCanceled:${user.id}`, data: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss") })
            const profile = await user.profile().fetch();
            user.controls.paymentInfo.subscription.status = "canceled"
            await user.save();

            if (profile) {
                profile.status = 0;
                await profile.save();
            }

            return user.toJSON();
        }
    }

    //FUNÇÕES PRIVADAS
    async __generateInvoice(invoiceCode, transaction, items, userId, status) {
        return await Invoice.create({
            userId: userId,
            invoice_code: invoiceCode,
            status: status,
            type: "monthly",
            expiration: DateTime.fromISO(transaction.due_at).toFormat("yyyy-MM-dd"),
            value: transaction.amount / 100,
            itens: items
        });
    }

    async __generateRequest(transactionId, invoice, transaction, status) {
        const newStatus = status === "pending" ? "canceled" : status;

        return await SystemRequest.create({
            invoiceId: invoice.id,
            transactionId: transactionId,
            status: newStatus,
            type: "M",
            expiration: invoice.expiration,
            userId: invoice.userId,
            planId: 1,
            paghiper: [transaction]
        });


    }

    __getDataItems(items, flexPlans, systemProducts) {
        const invoiceItems = [];
        for (const item of items) {
            const itemId = item.id ? item.id : item.subscription_item_id;
            const splitId = itemId.split("_");
            const product = systemProducts.find(prod => prod.id === parseInt(splitId[1]));
            if (product) {
                const plan = flexPlans.find(pl => pl.id === (product.plan_id));
                const price = product.operations.prices.find(prc => prc.id === splitId[2]);
                if (price && plan) {
                    const value = price.currencies.brl.unit_amount;
                    if (product.plan_id) {
                        invoiceItems.push({
                            id: product.id,
                            name: product.name,
                            value: value / 100,
                            service: product.service,
                            quantity: item.quantity,
                            price_id: price.id,
                            plan_id: product.plan_id,
                            category: plan.category
                        })
                    } else {
                        invoiceItems.push({
                            id: product.id,
                            name: product.name,
                            value: value / 100,
                            service: product.service,
                            quantity: item.quantity,
                            price_id: price.id
                        })
                    }
                }
            }
        }

        return invoiceItems;
    }

}

const gatewayPagarme = new Gateway(
    new StrategyPagarme(Env.get("PAGARME_SECURITY_KEY"), Env.get("PAGARME_PUBLIC_KEY"))
);

module.exports = gatewayPagarme;
