"use strict"

class Gateway {
    // gateway

    constructor(gatewayStrategy) {
        this.gateway = gatewayStrategy
    }

    setSecret(secret) {
        if (this.gateway.setSecret) {
            return this.gateway.setSecret(secret)
        }

        throw {
            message: "This gateway does not have an method setSecret"
        }
    }

    async retrieveLoginToken() {
        if (this.gateway.retrieveLoginToken) {
            return await this.gateway.retrieveLoginToken()
        }

        throw {
            message: "This gateway does not have an method createPixOrder"
        }
    }

    async createCardOrder(data) {
        if (this.gateway.createCardOrder) {
            return await this.gateway.createCardOrder(data)
        }

        throw {
            message: "This gateway does not have an method createCardOrder"
        }
    }

    async createPixOrder(data) {
        if (this.gateway.createPixOrder) {
            return await this.gateway.createPixOrder(data)
        }

        throw {
            message: "This gateway does not have an method createPixOrder"
        }
    }

    async createPixOrderSplit(data) {
        if (this.gateway.createPixOrderSplit) {
            return await this.gateway.createPixOrderSplit(data)
        }

        throw {
            message: "This gateway does not have an method createPixOrderSplit"
        }
    }

    async retrieveOrder(data) {
        if (this.gateway.retrieveOrder) {
            return await this.gateway.retrieveOrder(data)
        }

        throw {
            message: "This gateway does not have an method retrieveOrder"
        }
    }

    async createRecipient(data) {
        if (this.gateway.createRecipient){
            return await this.gateway.createRecipient(data)
        }

        throw {
            message: "This gateway does not have an method createRecipient"
        }
    }
    

    async updateRecipient(data, recipientId) {
        if (this.gateway.updateRecipient){
            return await this.gateway.updateRecipient(data, recipientId)
        }

        throw {
            message: "This gateway does not have an method updateRecipient"
        }
    }

    async getRecipient(data) {
        if (this.gateway.getRecipient){
            return await this.gateway.getRecipient(data)
        }

        throw {
            message: "This gateway does not have an method getRecipient"
        }
    }

    async addSubscriptionDiscount(data, subscriptionId) {
        if (this.gateway.addSubscriptionDiscount) {
            return await this.gateway.addSubscriptionDiscount(data, subscriptionId)
        }

        throw {
            message: "This gateway does not have an method addSubscriptionDiscount"
        }
    }

    async addSubscriptionIncrement(data, subscriptionId) {
        if (this.gateway.addSubscriptionIncrement) {
            return await this.gateway.addSubscriptionIncrement(data, subscriptionId)
        }

        throw {
            message: "This gateway does not have an method addSubscriptionIncrement"
        }
    }

    async addSubscriptionItem(data, subscriptionId) {
        if (this.gateway.addSubscriptionItem) {
            return await this.gateway.addSubscriptionItem(data, subscriptionId)
        }

        throw {
            message: "This gateway does not have an method addSubscriptionItem"
        }
    }

    async changeChargeCard(chargeId, cardId) {
        return await this.gateway.changeChargeCard(chargeId, cardId)
    }

    async changeSubscriptionCard(subscriptionId, cardId) {
        return await this.gateway.changeSubscriptionCard(subscriptionId, cardId)
    }

    async createCard(data) {
        return await this.gateway.createCard(data)
    }

    async createCardToken(data) {
        return await this.gateway.createCardToken(data)
    }

   async createCardOrder(data){
        if (this.gateway.createCardOrder){
            return await this.gateway.createCardOrder(data)

        }

        throw {
            message: "This gateway does not have an method retrievePixOrder"
        }
    }

    async createCheckoutOrPurchaseCard(data) {
        return await this.gateway.createCheckoutOrPurchaseCard(data)
    }

    async createCustomer(userData) {
        return await this.gateway.createCustomer(userData)
    }

    async createSubscription(data, billing_type) {
        return await this.gateway.createSubscription(data, billing_type)
    }

    async cancelSubscription(subscriptionId, data) {
        return await this.gateway.cancelSubscription(subscriptionId, data)
    }

    async deleteCard(data) {
        return await this.gateway.deleteCard(data)
    }

    async getSubscription(subscription_id) {
        return await this.gateway.getSubscription(subscription_id)
    }

    async deleteSubscriptionItem(itemId, subscriptionId, cancel_pending_invoices) {
        return await this.gateway.deleteSubscriptionItem(itemId, subscriptionId, cancel_pending_invoices)
    }

    async updateChargeOrSubscriptionCard(data) {
        return await this.gateway.updateChargeOrSubscriptionCard(data)
    }

    //WEBHOOKS



    async webhookCardCreated(event) {
        return await this.gateway.webhookCardCreated(event)
    }

    async webhookDeletedCard(event) {
        return await this.gateway.webhookDeletedCard(event)
    }

    async webhookExpiredCard(event) {
        return await this.gateway.webhookExpiredCard(event)
    }

    async webhookUpdatedCard(event) {
        return await this.gateway.webhookUpdatedCard(event)
    }

    async webhookChargePaid(event) {
        return await this.gateway.webhookChargePaid(event)
    }

    async webhookChargePaymentFailed(event) {
        this.gateway.webhookChargePaymentFailed(event)
    }

    async webhookInvoiceCanceled(event) {
        return await this.gateway.webhookInvoiceCanceled(event)
    }

    async webhookInvoiceCreated(event) {
        return await this.gateway.webhookInvoiceCreated(event)
    }

    async webhookInvoicePaid(event) {
        return await this.gateway.webhookInvoicePaid(event)
    }

    async webhookFailedInvoicePayment(event) {
        return await this.gateway.webhookFailedInvoicePayment(event)
    }

    async webhookOrderPaid(event) {
        return await this.gateway.webhookOrderPaid(event)
    }

    async webhookUpdatedInvoice(event) {
        return await this.gateway.webhookUpdatedInvoice(data)
    }

    async webhookSubscriptionCreated(event) {
        return await this.gateway.webhookSubscriptionCreated(event)
    }

    async webhookSubscriptionCanceled(event) {
        return await this.gateway.webhookSubscriptionCanceled(event)
    }
}

module.exports = Gateway