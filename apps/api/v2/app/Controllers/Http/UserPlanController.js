'use strict'
const WmProvider = use("WmProvider")
const gatewayPagarme = require("../../Services/gateways/strategyPagarme")
const UserPlan = use('App/Models/UserPlan')
const User = use('App/Models/User')
const SystemProduct = use('App/Models/SystemProduct')
const FlexPlan = use("App/Models/FlexPlan")
const Database = use('Database')
const { DateTime } = require("luxon");

class UserPlanController {

  async delete({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'UserPlanController', linha: 10, metodo: 'delete' })
      const data = request.except(['_csrf'])
      const user = await User.find(data.userId)
      const profile = await user.profile().fetch()
      const tables = await profile.tables().fetch()
      const plan = await UserPlan.query().where('userId', data.userId).fetch()

      for (const table of tables.rows) {
        table.status = 0;
        await table.save();
      }

      if (plan && plan.rows.length) {
        for (let planD of plan.rows) {
          await planD.delete()
        }
      }

      // await plan.delete()

      return response.json(data)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async update({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'UserPlanController', linha: 46, metodo: 'update' })
      // console.log(request.except(['_csrf']))
      const data = request.except(['_csrf'])
      const user = await User.find(data.userId)
      const profile = await user.profile().fetch()
      const userPlans = await UserPlan.query().where({ userId: user.id }).fetch();
      data.plansItems = typeof data.plansItems === 'string' ? JSON.parse(data.plansItems) : data.plansItems;
      data.deletedPlans = typeof data.deletedPlans === 'string' ? JSON.parse(data.deletedPlans) : data.deletedPlans;

      const newUserPlans = await Database.transaction(async trx => {
        const newPlansIds = [];
        const plansDeletedIds = [];

        if (data.deletedPlans) {
          for (const userPlan of userPlans.rows) {
            if (data.deletedPlans.some(item => item.planId === userPlan.flexPlanId)) {
              plansDeletedIds.push(userPlan.flexPlanId);
              await userPlan.delete(trx);
            }
          }
        }


        if (data.plansItems) {
          for (const item of data.plansItems) {
            if (!userPlans.rows.some(uPlan => uPlan.flexPlanId === item.planId)) {
              await UserPlan.create({
                userId: user.id,
                flexPlanId: item.planId
              }, trx);

              newPlansIds.push(item.planId);
            }
          }
        }

        const addProductsIds = data.plansItems.filter(item => newPlansIds.includes(item.planId)).map(item => item.product_id);
        const delProductsIds = data.deletedPlans.filter(item => plansDeletedIds.includes(item.planId)).map(item => item.product_id);

        const systemProducts = await SystemProduct.query().whereIn("id", [...addProductsIds, ...delProductsIds]).fetch();

        const newUserPlans = await trx.table("user_plans").where("userId", user.id);
        const newUserPlansId = newUserPlans.map(uPlan => uPlan.flexPlanId);
        const definitePlans = await FlexPlan.query().whereIn("id", newUserPlansId).with("relateds").fetch();

        if (definitePlans.length && profile) {
          const categories = await profile.categories().where("type", "default").fetch();
          const plansCategories = definitePlans.map(plan => plan.category === 'basic' ? 'delivery' : plan.category);

          if (categories) {

            for (const category of categories.rows) {
              const products = await category.products().fetch();

              for (const product of products.rows) {
                for (const planCategory of plansCategories) {
                  product.disponibility.store[planCategory] = true;
                }

                await product.save(trx);
              }
            }
          }
        }

        if (
          user.controls.paymentInfo &&
          user.controls.paymentInfo.gateway &&
          user.controls.paymentInfo.subscription
        ) {

          const gateway = user.controls.paymentInfo.gateway;
          const subscriptionId = user.controls.paymentInfo.subscription.id;

          switch (gateway) {
            case "pagarme":
              const { data: subscription } = await gatewayPagarme.getSubscription(subscriptionId);

              const productItemsId = subscription.items
                .filter(item => item.id.includes("plan"))
                .map(item => item.id);


              for (const systemProduct of systemProducts.rows) {


                if (delProductsIds.includes(systemProduct.id)) {
                  const id = `${systemProduct.service}_${systemProduct.id}_${systemProduct.default_price}`;
                  const productItemFoundedId = productItemsId.find(item => item.includes(id));

                  if (productItemFoundedId) {
                    const { data: deleted } = await gatewayPagarme.deleteSubscriptionItem(productItemFoundedId, subscriptionId);
                    console.log("delete", id, deleted);

                  }

                }

                if (addProductsIds.includes(systemProduct.id)) {
                  const planItem = data.plansItems.find(item => item.product_id === systemProduct.id);

                  if (!planItem) {
                    continue;
                  }

                  const item = {
                    id: `${systemProduct.service}_${systemProduct.id}_${systemProduct.default_price}_${WmProvider.hash(8)}`,
                    pricing_scheme: {
                      scheme_type: 'Unit',
                      price: planItem.value
                    },
                    discounts: data.discounts,
                    increments: data.increments,
                    description: systemProduct.name,
                    quantity: 1,
                    name: systemProduct.name
                  }

                  const { data: newItem } = await gatewayPagarme.addSubscriptionItem(item, subscriptionId);
                  const now = DateTime.local().set({ hour: 0, seconds: 0, millisecond: 0 });
                  const endDate = DateTime.local().set({ day: user.due, hour: 0, seconds: 0, millisecond: 0 })
                  const planValue = planItem.value / 100;
                  let discountValue = 0;

                  if (now.day > endDate.day) {
                    const newEndDate = endDate.plus({ month: 1 });
                    const diffDays = newEndDate.diff(now, "days").days;
                    const valuePaid = (planValue / 30) * diffDays;
                    discountValue = planValue - valuePaid;

                  } else {
                    const diffDays = endDate.diff(now, "days").days;
                    const valuePaid = (planValue / 30) * 30;
                    discountValue = planValue - valuePaid;
                  }

                  if (discountValue > 0) {
                    await gatewayPagarme.addSubscriptionDiscount({
                      value: Number(discountValue.toFixed(2)) * 100,
                      discountType: "flat",
                      cycles: 1,
                      itemId: newItem.id
                    }, user.controls.paymentInfo.subscription.id)
                  }

                }

              }
              break;
          }
        }

        return definitePlans;

      });

      return response.json(newUserPlans)

    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getUserPlans({ response, auth }) {
    const user = await auth.getUser();
    try {
      const userPlans = await user.plans().with("relateds").fetch();
      return response.json(userPlans);
    } catch (error) {
      console.log(error);
      throw error
    }
  }

}

module.exports = UserPlanController
