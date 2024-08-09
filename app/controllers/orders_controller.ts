import Customer from '#models/customer'
import Item from '#models/item'
import Merchant from '#models/merchant'
import Order from '#models/order'
import Payment from '#models/payment'
import IfoodService from '#services/ifood_integration_service'
import { updateOrderStatusValidator } from '#validators/order'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

export default class OrdersController {
  /**
   * Realiza o polling para novos pedidos, atualiza o banco de dados com informações do pedido
   * e retorna os pedidos atualizados.
   *
   * @param {HttpContext} response - O objeto de resposta HTTP
   * @param {HttpContext} request - O objeto de solicitação HTTP
   * @return {Object} Os pedidos atualizados em formato JSON
   */
  async polling({ response, request }: HttpContext) {
    try {
      const { pollingData, token } = request.all()

      const filteredEvents = pollingData.reduce((acc: any, event: any) => {
        acc[event.orderId] = event
        return acc
      }, {})

      const uniqueEvents = Object.values(filteredEvents) as any[]

      for await (const event of uniqueEvents) {
        console.log('MERCHANT TOKEN:', { token })
        const responseOrderId = await IfoodService.getOrder(event, token)
        let order = await Order.findBy('orderId', event.orderId)
        const payment = await Payment.findBy('orderId', event.orderId)
        const item = await Item.findBy('orderId', event.orderId)
        const customer = await Customer.findBy('customerId', responseOrderId.customer.id)

        if (order) {
          order.orderStatus = event.fullCode
          order.statusCode = event.code
          order.customerId = responseOrderId.customer.id
          order.displayId = responseOrderId.displayId
          order.orderTiming = responseOrderId.orderTiming
          order.orderType = responseOrderId.orderType
          order.delivery = responseOrderId.delivery

          order.total = responseOrderId.total
          order.additionalInfo = responseOrderId.additionalInfo

          await order.save()
        } else {
          order = await Order.create({
            orderId: event.orderId,
            orderStatus: event.fullCode,
            statusCode: event.code,
            merchantId: event.merchantId,
            customerId: customer?.customerId,
            displayId: responseOrderId.displayId,
            orderTiming: responseOrderId.orderTiming,
            orderType: responseOrderId.orderType,
            delivery: responseOrderId.delivery,
            total: responseOrderId.total,
            additionalInfo: responseOrderId.additionalInfo,
          })
        }

        if (!payment && order) {
          await Payment.create({
            orderId: event.orderId,
            prepaid: responseOrderId.payments.prepaid,
            pending: responseOrderId.payments.pending,
            methods: responseOrderId.payments.methods,
            additionalFees: responseOrderId.payments.additionalFees,
          })
        }

        if (!customer && order) {
          await Customer.create({
            customerId: responseOrderId.customer.id,
            name: responseOrderId.customer.name,
            phone: responseOrderId.customer.phone,
            ordersCountOnMerchant: responseOrderId.customer.ordersCountOnMerchant,
            segmentation: responseOrderId.customer.segmentation,
            merchant_customers: {
              id: 1,
              id_merchant: responseOrderId.merchant.id,
              id_customer: responseOrderId.customer.id,
            },
          })
        }

        if (!item && order) {
          for await (const itemOrder of responseOrderId.items) {
            await Item.create({
              orderId: event.orderId,
              itemId: itemOrder.itemId,
              index: itemOrder.index,
              uniqueId: itemOrder.uniqueId,
              name: itemOrder.name,
              ean: itemOrder.ean,
              quantity: itemOrder.quantity,
              unit: itemOrder.unit,
              unitPrice: itemOrder.unitPrice,
              totalPrice: itemOrder.totalPrice,
              price: itemOrder.price,
              observations: itemOrder.observations,
              imageUrl: itemOrder.imageUrl,
            })
          }
        }
      }

      const orders = await Order.query()
        .whereIn(
          'orderId',
          uniqueEvents.flatMap((event: any) => event.orderId)
        )
        .preload('customer')
        .preload('itens')
        .preload('payments')
        .preload('merchant')

      return response.status(200).json({ orders })
    } catch (error) {
      throw error
    }
  }

  /**
   * Atualiza o status de um pedido.
   *
   * @param {HttpContext} request - O objeto de contexto HTTP contendo os dados da requisição.
   * @return {Promise<JsonResponse>} Uma resposta JSON contendo o novo status do pedido.
   */
  async updateStatus({ request, response }: HttpContext) {
    try {
      const data = request.all()
      const { orderId, status, cancellationReason } =
        await updateOrderStatusValidator.validate(data)
      const order = await Order.findBy('orderId', orderId)
      if (!order) {
        return response.status(404).json({ message: 'Order not found' })
      }
      await IfoodService.updateStatus(order, status, cancellationReason)

      order.orderStatus = status
      await order.save()
      return response.json({ order })
    } catch (error) {
      throw error
    }
  }

  /**
   * Executa a lógica de motivos de cancelamento com base no ID do pedido.
   *
   * @param {HttpContext} params - Os parâmetros contendo o ID do pedido.
   * @param {HttpContext} response - O objeto de resposta HTTP.
   * @return {JsonResponse} Resposta JSON contendo os motivos de cancelamento.
   */
  async cancellationReasons({ params, response }: HttpContext) {
    try {
      const { orderId } = params
      const order = await Order.findBy('orderId', orderId)
      if (!order) {
        return response.status(404).json({ message: 'Pedido não encontrado!' })
      }

      const responseCancellationReasons = await IfoodService.cancellationReasons(order)

      return response.status(200).json(responseCancellationReasons)
    } catch (error) {
      throw error
    }
  }

  /**
   * Recupera os dados dos pedidos com base no ID do comerciante e no fuso horário fornecido.
   *
   * @param {HttpContext} request - O contexto HTTP contendo os dados da requisição.
   * @param {HttpContextResponse} response - O contexto HTTP para enviar os dados dos pedidos em formato JSON.
   * @return {Promise<JsonResponse>} Uma promessa que resolve para os dados dos pedidos em formato JSON.
   */
  async getOrdersData({ request, response }: HttpContext) {
    try {
      const { id, timeZone } = request.all()

      const merchant = await Merchant.findBy('wm_id', id)
      let orders

      let fuso = { hour: '-03:00', zone: 'UTC-3' }
      switch (timeZone) {
        case 'America/Rio_Branco':
          fuso = { hour: '-05:00', zone: 'UTC-5' }
          break
        case 'America/Manaus':
          fuso = { hour: '-04:00', zone: 'UTC-4' }
          break
        case 'America/Noronha':
          fuso = { hour: '-02:00', zone: 'UTC-2' }
          break
      }

      const condition =
        DateTime.local().toMillis() >
        DateTime.fromObject({ hour: 4, minute: 0 }).setZone(fuso.zone).toMillis()

      const hourFuso = DateTime.local()
        .setZone(fuso.zone)
        .minus({
          day: condition ? 0 : 1,
        })
        .toFormat('yyyy-MM-dd')
      const addDayInFuso = DateTime.local().plus({ day: 1 }).toFormat('yyyy-MM-dd')

      if (merchant) {
        orders = await Order.query()
          .preload('itens')
          .preload('customer')
          .preload('payments')
          .where('merchantId', merchant?.merchantId)
          .whereRaw(
            `(CONVERT_TZ(created_at,'-03:00','${fuso.hour}') BETWEEN '${hourFuso}' and '${addDayInFuso}')`
          )
        return response.status(200).json(orders)
      }
    } catch (error) {
      throw error
    }
  }
}
