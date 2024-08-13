"use strict";
const Env = use("Env");
const Mail = use("Mail");
const User = use("App/Models/User");
const UserPlan = use("App/Models/UserPlan");
const Invoice = use("App/Models/Invoice");
const Profile = use("App/Models/Profile");
const SystemRequest = use("App/Models/SystemRequest");
const SystemProduct = use("App/Models/SystemProduct");
const BonusSupport = use("App/Models/BonusSupport");
const QueueController = use("App/Controllers/Http/QueueController");
const moment = use("moment");
const axios = use("axios");
const Database = use("Database");
const { DateTime } = require("luxon");
const gatewayPagarme = require("../../Services/gateways/strategyPagarme");

class PaymentController {
  async generateRequest({ response }) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 20,
        metodo: "generateRequest",
      });
      let users = await User.query()
        .where("due", moment().add(7, "days").format("DD"))
        .whereRaw(
          `controls->"$.canceled" is null or (due = ${moment()
            .add(7, "days")
            .format("DD")} && controls->"$.canceled" = false)`
        )
        .whereRaw('controls->"$.type" is null')
        .whereRaw('controls->"$.migrated_at" is null')
        .whereRaw('controls->"$.paymentInfo" is null')
        .with("invoices", (invoice) => {
          invoice.where({
            type: "first",
            status: "paid",
          });
        })
        .fetch();

      const itens = [];

      if (moment().add(7, "days").format("MM-DD") === "02-28") {
        console.log("28 de fevereiro");
        users = await User.query()
          .where("due", ">=", 28)
          .whereRaw(
            'controls->"$.canceled" is null or controls->"$.canceled" = false'
          )
          .whereRaw('controls->"$.type" is null')
          .whereRaw('controls->"$.migrated_at" is null')
          .whereRaw('controls->"$.paymentInfo" is null')
          .with("invoices", (invoice) => {
            invoice
              .where({
                type: "first",
                status: "paid",
              })
              .orWhere({
                type: "first",
              });
          })
          .fetch();
      }

      if (
        moment().add(7, "days").format("DD") === "30" &&
        moment().add(8, "days").format("DD") === "01"
      ) {
        console.log("Mês com 30 dias");
        users = await User.query()
          .where("due", ">=", 30)
          .whereRaw(
            '(controls->"$.canceled" is null or controls->"$.canceled" = false)'
          )
          .whereRaw('controls->"$.type" is null')
          .whereRaw('controls->"$.migrated_at" is null')
          .whereRaw('controls->"$.paymentInfo" is null')
          .with("invoices", (invoice) => {
            invoice.where({
              type: "first",
              status: "paid",
            });
          })
          .fetch();
      }

      // return response.json(users.rows.map(u => {return {id: u.id, due: u.due}}))
      const products = await SystemProduct.all();

      for (const user of users.rows) {
        if (user.controls.paymentInfo) {
          continue;
        }

        const plans = await user.plans().fetch();
        const userPlans = await UserPlan.query()
          .where("userId", user.id)
          .fetch();

        const { value, items } = PaymentController.getDataItemsAndValue(
          plans,
          userPlans,
          products,
          user
        );

        const userParser = user.toJSON();
        let invoice = await user
          .invoices()
          .where((query) => {
            if (userParser.invoices.length > 0) {
              return query.where(
                "expiration",
                "like",
                `${moment().add(7, "days").format("YYYY-MM-")}%`
              );
            }

            return query.where("type", "first");
          })
          .first();

        if (
          !invoice ||
          (invoice.status === "paid" &&
            !moment().format("YYYY-MM") ===
              moment().add(7, "days").format("YYYY-MM"))
        ) {
          invoice = await Invoice.create({
            expiration: moment().add(7, "days").format("YYYY-MM-DD"),
            userId: user.id,
            type: "monthly",
            status: user.controls.disableInvoice ? "paid" : "pending",
            value: value,
            itens: items,
          });

          if (invoice.status === "paid") {
            const checkBonusSupport = await Invoice.query()
              .where({ userId: user.id, type: "monthly" })
              .limit(3)
              .fetch();
            if (
              checkBonusSupport.rows.length === 1 &&
              moment().diff(moment(user.created_at), "days") < 40
            ) {
              BonusSupport.create({
                userId: user.id,
                supportId: user.supportId,
                invoiceId: invoice.id,
                status: "paid",
                month: 2,
              });
            }
          }
        }

        if (
          invoice &&
          !user.controls.disableInvoice &&
          (!user.controls.period ||
            user.controls.period == "monthly" ||
            user.controls.nextInvoice ==
              moment().add(7, "days").format("YYYY-MM-DD"))
        ) {
          // const requests = await user.requests().where('type', 'M').where('expiration', 'like', `${moment().add(7, 'days').format('YYYY-MM-')}%`).whereIn('status', ['paid', 'pending', 'reserved', 'completed']).last()

          if (invoice.type === "first") {
            const requests = await invoice
              .requests()
              .where("status", "pending")
              .whereNull("limit")
              .fetch();

            requests.rows.forEach(async (sr) => {
              await PaymentController.cancelInvoice(sr.transactionId);
            });

            await this.createFirstPaghiper(invoice.id);
          } else if (invoice.type === "monthly") {
            const requests = await invoice.requests().fetch();

            // console.log(requests);

            if (requests.rows.length === 0) {

              let limitPayment = moment().add(10, 'day')

              if (invoice.type === 'addon' || invoice.type === 'upgrade') {
                limitPayment = moment().add(1, 'day')
              }

              switch (limitPayment.format('dddd')) {
                case 'Saturday':
                  limitPayment = limitPayment.add(2, 'days').format('YYYY-MM-DD')
                  break;
                case 'Sunday':
                  limitPayment = limitPayment.add(1, 'days').format('YYYY-MM-DD')
                  break;

                default:
                  limitPayment = limitPayment.format('YYYY-MM-DD')
                  break;
              }

              const request = await SystemRequest.create({
                invoiceId: invoice.id,
                expiration: moment().add(7, "days").format("YYYY-MM-DD"),
                limit: limitPayment,
                userId: user.id,
                planId: 1,
                paghiper: {},
              });

              const data = {
                apiKey: Env.get("PAGHIPER_APIKEY"),
                order_id: request.id,
                payer_email: user.email,
                payer_name: user.name,
                payer_cpf_cnpj: user.secretNumber
                  .split(".")
                  .join("")
                  .replace("/", "")
                  .replace("-", ""),
                type_bank_slip: "boletoA4",
                days_due_date: 7,
                payer_phone: user.whatsapp.replace(" ", "").replace("-", ""),
                notification_url: Env.get(
                  user.controls.migrated_at
                    ? "PAGHIPER_RETURN_NEXT"
                    : "PAGHIPER_RETURN"
                ),
                // items: []
                items: plans.rows.map((plan) => {
                  const item = items.find(
                    (item) => item.category === plan.category
                  );

                  return {
                    item_id: plan.id,
                    description: `${plan.name}`,
                    seller_description: `Referente a utilização do sistema WhatsMenu de ${moment(
                      request.expiration
                    ).format("DD-MM-YYYY")} até ${moment(request.expiration)
                      .add(29, "days")
                      .format("DD-MM-YYYY")}`,
                    quantity: 1,
                    price_cents: item.value * 100,
                  };
                }),
              };

              const paghiper = await axios.post(
                "https://api.paghiper.com/transaction/create/",
                data
              );

              request.paghiper = [paghiper.data];
              request.transactionId =
                paghiper.data["create_request"]["transaction_id"];
              await request.save();

              itens.push(request.toJSON());
              // console.log(itens)
            }
          }
        }
      }
      console.log("enviar email de relatório");
      Mail.send(
        "email.reports.generateinvoices",
        { invoices: itens },
        (message) => {
          message
            .to("jasonaries@gmail.com")
            .from("jasonaries@whatsmenu.com.br")
            .subject(
              `Geração de mensalidades ${moment().format(
                "YYYY-MM-DD HH:mm:ss"
              )}`
            );
        }
      );

      return response.json(itens);
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      });
      throw error;
    }
  }
  async generateRequestForUsers({ response, request }) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 20,
        metodo: "generateRequest",
      });
      const req = request.all()
      let users = await User.query()
        .whereIn('id', req.users)
        .whereRaw(
          `(controls->"$.canceled" is null or controls->"$.canceled" = false)`
        )
        .whereRaw('controls->"$.type" is null')
        .whereRaw('controls->"$.paymentInfo" is null')
        .with("invoices", (invoice) => {
          invoice.where({
            type: "first",
            status: "paid",
          });
        })
        .fetch();

      const itens = [];

      if (moment().add(req.days, "days").format("MM-DD") === "02-28") {
        console.log("28 de fevereiro");
        users = await User.query()
          .whereIn('id', req.users)
          .whereRaw(
            '(controls->"$.canceled" is null or controls->"$.canceled" = false)'
          )
          .whereRaw('controls->"$.type" is null')
          .whereRaw('controls->"$.paymentInfo" is null')
          .with("invoices", (invoice) => {
            invoice
              .where({
                type: "first",
                status: "paid",
              })
              .orWhere({
                type: "first",
              });
          })
          .fetch();
      }

      if (
        moment().add(req.days, "days").format("DD") === "30" &&
        moment().add(req.days + 1, "days").format("DD") === "01"
      ) {
        console.log("Mês com 30 dias");
        users = await User.query()
          .where("due", ">=", 30)
          .whereRaw(
            '(controls->"$.canceled" is null or controls->"$.canceled" = false)'
          )
          .whereRaw('controls->"$.type" is null')
          .whereRaw('controls->"$.paymentInfo" is null')
          .with("invoices", (invoice) => {
            invoice.where({
              type: "first",
              status: "paid",
            });
          })
          .fetch();
      }

      // return response.json(users.rows.map(u => {return {id: u.id, due: u.due}}))
      const products = await SystemProduct.all();

      for (const user of users.rows) {
        if (user.controls.paymentInfo) {
          continue;
        }

        const plans = await user.plans().fetch();
        const userPlans = await UserPlan.query()
          .where("userId", user.id)
          .fetch();

        const { value, items } = PaymentController.getDataItemsAndValue(
          plans,
          userPlans,
          products,
          user
        );

        const userParser = user.toJSON();
        let invoice = await user
          .invoices()
          .where((query) => {
            if (userParser.invoices.length > 0) {
              return query.where(
                "expiration",
                "like",
                `${moment().add(req.days, "days").format("YYYY-MM-")}%`
              );
            }

            return query.where("type", "first");
          })
          .first();

        if (
          !invoice ||
          (invoice.status === "paid" &&
            !moment().format("YYYY-MM") ===
              moment().add(req.days, "days").format("YYYY-MM"))
        ) {
          invoice = await Invoice.create({
            expiration: moment().add(req.days, "days").format("YYYY-MM-DD"),
            userId: user.id,
            type: "monthly",
            status: user.controls.disableInvoice ? "paid" : "pending",
            value: value,
            itens: items,
          });

          if (invoice.status === "paid") {
            const checkBonusSupport = await Invoice.query()
              .where({ userId: user.id, type: "monthly" })
              .limit(3)
              .fetch();
            if (
              checkBonusSupport.rows.length === 1 &&
              moment().diff(moment(user.created_at), "days") < 40
            ) {
              BonusSupport.create({
                userId: user.id,
                supportId: user.supportId,
                invoiceId: invoice.id,
                status: "paid",
                month: 2,
              });
            }
          }
        }

        if (
          invoice &&
          !user.controls.disableInvoice &&
          (!user.controls.period ||
            user.controls.period == "monthly" ||
            user.controls.nextInvoice ==
              moment().add(req.days, "days").format("YYYY-MM-DD"))
        ) {
          // const requests = await user.requests().where('type', 'M').where('expiration', 'like', `${moment().add(7, 'days').format('YYYY-MM-')}%`).whereIn('status', ['paid', 'pending', 'reserved', 'completed']).last()

          if (invoice.type === "first") {
            const requests = await invoice
              .requests()
              .where("status", "pending")
              .whereNull("limit")
              .fetch();

            requests.rows.forEach(async (sr) => {
              await PaymentController.cancelInvoice(sr.transactionId);
            });

            await this.createFirstPaghiper(invoice.id);
          } else if (invoice.type === "monthly") {
            const requests = await invoice.requests().fetch();

            // console.log(requests);

            if (requests.rows.length === 0) {

              let limitPayment = moment().add(req.days, 'day')

              if (invoice.type === 'addon' || invoice.type === 'upgrade') {
                limitPayment = moment().add(1, 'day')
              }

              switch (limitPayment.format('dddd')) {
                case 'Saturday':
                  limitPayment = limitPayment.add(2, 'days').format('YYYY-MM-DD')
                  break;
                case 'Sunday':
                  limitPayment = limitPayment.add(1, 'days').format('YYYY-MM-DD')
                  break;

                default:
                  limitPayment = limitPayment.format('YYYY-MM-DD')
                  break;
              }

              const request = await SystemRequest.create({
                invoiceId: invoice.id,
                expiration: moment().add(req.days, "days").format("YYYY-MM-DD"),
                limit: limitPayment,
                userId: user.id,
                planId: 1,
                paghiper: {},
              });

              const data = {
                apiKey: Env.get("PAGHIPER_APIKEY"),
                order_id: request.id,
                payer_email: user.email,
                payer_name: user.name,
                payer_cpf_cnpj: user.secretNumber
                  .split(".")
                  .join("")
                  .replace("/", "")
                  .replace("-", ""),
                type_bank_slip: "boletoA4",
                days_due_date: req.days,
                payer_phone: user.whatsapp.replace(" ", "").replace("-", ""),
                notification_url: Env.get(
                  user.controls.migrated_at
                    ? "PAGHIPER_RETURN_NEXT"
                    : "PAGHIPER_RETURN"
                ),
                // items: []
                items: plans.rows.map((plan) => {
                  const item = items.find(
                    (item) => item.category === plan.category
                  );

                  return {
                    item_id: plan.id,
                    description: `${plan.name}`,
                    seller_description: `Referente a utilização do sistema WhatsMenu de ${moment(
                      request.expiration
                    ).format("DD-MM-YYYY")} até ${moment(request.expiration)
                      .add(29, "days")
                      .format("DD-MM-YYYY")}`,
                    quantity: 1,
                    price_cents: item.value * 100,
                  };
                }),
              };

              const paghiper = await axios.post(
                "https://api.paghiper.com/transaction/create/",
                data
              );

              request.paghiper = [paghiper.data];
              request.transactionId = paghiper.data["create_request"]["transaction_id"];
              await request.save();

              itens.push(request.toJSON());
              // console.log(itens)
            }
          }
        }
      }
      console.log("enviar email de relatório");
      Mail.send(
        "email.reports.generateinvoices",
        { invoices: itens },
        (message) => {
          message
            .to("jasonaries@gmail.com")
            .from("jasonaries@whatsmenu.com.br")
            .subject(
              `Geração de mensalidades ${moment().format(
                "YYYY-MM-DD HH:mm:ss"
              )}`
            );
        }
      );

      return response.json(itens);
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      });
      throw error;
    }
  }

  async returnPaghiper({ request, response }) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 214,
        metodo: "returnPaghiper",
      });
      const data = request.all();
      console.log({ id: data.idPlataforma });
      console.log(data);
      const systemRequest = await SystemRequest.find(data.idPlataforma);
      if (!systemRequest) {
        throw new Error('system_request inexistente')
      }
      const user = await systemRequest.user().fetch();
      const invoice = await systemRequest.invoice().fetch();
      const profile = await user.profile().fetch();

      // if (profile && profile.options.migrated_at && data) {
      //   console.log(
      //     `Cliente migrado PDV`,
      //     profile.options.migrated_at,
      //     profile.id
      //   );
      //   const { data: result } = await axios.post(
      //     "https://api2.whatsmenu.com.br/paghiper",
      //     { ...data }
      //   );
      //   return response.json(result);
      // }

      const getDateLimit = () => {
        let limit = moment().add(3, "day");

        if (invoice.type === "addon" || invoice.type === "upgrade") {
          limit = moment().add(1, "day");
        }

        switch (limit.format("dddd")) {
          case "Saturday":
            limit = limit.add(2, "days").format("YYYY-MM-DD");
            break;
          case "Sunday":
            limit = limit.add(1, "days").format("YYYY-MM-DD");
            break;

          default:
            limit = limit.format("YYYY-MM-DD");
            break;
        }

        return limit;
      };

      const addBonusSupport = async (user, systemRequest) => {
        try {
          const invoice = await user
            .invoices()
            .where({ type: "monthly", status: "paid" })
            .first();
          const today = moment();

          if (
            invoice &&
            invoice.id === systemRequest.invoiceId &&
            today.diff(invoice.updated_at, "days") < 24
          ) {
            const exists = await BonusSupport.query()
              .where("invoiceId", invoice.id)
              .first();

            if (exists) {
              exists.status =
                systemRequest.status === "canceled" ? "canceled" : "paidLate";
              await exists.save();
            } else {
              await BonusSupport.create({
                userId: user.id,
                supportId: user.supportId,
                invoiceId: invoice.id,
                status: systemRequest.type === "M" ? "paid" : "paidLate",
                month: 2,
              });
            }
          }
        } catch (error) {
          console.error(error);
          throw error;
        }
      };

      async function cancelOthersInvoices() {
        try {
          const invoices = await user
            .requests()
            .where("status", "pending")
            .fetch();

          for (let invoice of invoices.rows) {
            await PaymentController.cancelInvoice(invoice.transactionId);
            invoice.limit = moment().format("YYYY-MM-DD");
            invoice.status = "canceled";
            await invoice.save();
          }
        } catch (error) {
          console.error(error);
        }
      }

      if (
        !user.controls.disableInvoice &&
        systemRequest &&
        systemRequest.status !== "paid" &&
        systemRequest.status !== "completed"
      ) {
        switch (data.status.toLowerCase()) {
          case "cancelado":
            data.status = "canceled";
            break;

          case "pago":
            data.status = "paid";
            break;

          case "aprovado":
            data.status = "paid";
            break;

          case "completo":
            data.status = "completed";
            break;

          case "aguardando":
            data.status = "pending";
            break;

          case "reservado":
            data.status = "reserved";
            break;

          case "analise":
            data.status = "processing";
            break;

          case "estornado":
            data.status = "refunded";
            break;
        }

        if (systemRequest.status != data.status.toLowerCase()) {
          switch (data.status.toLowerCase()) {
            case "canceled":
              systemRequest.status = "pending";
              systemRequest.limit = getDateLimit();
              // systemRequest.save()
              // if (profile && systemRequest && systemRequest.status != 'canceled') {
              //   profile.status = 0
              //   await profile.save()
              // }
              break;

            case "paid":
              systemRequest.status = data.status;
              systemRequest.limit = null;

              // if (!user.supportId && moment(user.created_at).add(1, 'days').format('YYYY-MM-DD') == moment(systemRequest.expiration).format('YYYY-MM-DD')) {
              //   await QueueController.setClientSupport(user.id)
              // }

              if (profile) {
                profile.status = 1;
                await profile.save();
              }

              if (invoice) {
                invoice.status = "paid";

                if (invoice.type === "first") {
                  if (user.controls.period == "semester") {
                    user.controls.nextInvoice = moment()
                      .add(6, "months")
                      .format();
                    await user.save();
                  } else if (user.controls.period == "yearly") {
                    user.controls.nextInvoice = moment()
                      .add(1, "years")
                      .format();
                    await user.save();
                  }
                } else if (invoice.type === "upgrade") {
                  await UserPlan.create({
                    userId: user.id,
                    flexPlanId: invoice.itens[0].id,
                  });
                }

                await invoice.save();
              }

              await addBonusSupport(user, systemRequest);

              break;

            case "reserved":
              systemRequest.status = data.status;

              // if (!user.supportId && moment(user.created_at).add(1, 'days').format('YYYY-MM-DD') == moment(systemRequest.expiration).format('YYYY-MM-DD')) {
              //   await QueueController.setClientSupport(user.id)
              // }

              if (profile) {
                profile.status = 1;
                await profile.save();
              }

              if (invoice) {
                invoice.status = "paid";

                if (invoice.type === "first") {
                  if (user.controls.period == "semester") {
                    user.controls.nexInvoice = moment()
                      .add(6, "months")
                      .format();
                  } else if (user.controls.period == "yearly") {
                    user.controls.nexInvoice = moment()
                      .add(1, "years")
                      .format();
                  }
                } else if (invoice.type === "upgrade") {
                  await UserPlan.create({
                    userId: user.id,
                    flexPlanId: invoice.itens[0].id,
                  });
                }

                await invoice.save();
              }

              await addBonusSupport(user, systemRequest);

              break;

            case "completed":
              systemRequest.status = data.status;
              systemRequest.limit = null;

              // if (!user.supportId && moment(user.created_at).add(1, 'days').format('YYYY-MM-DD') == moment(systemRequest.expiration).format('YYYY-MM-DD')) {
              //   await QueueController.setClientSupport(user.id)
              // }

              if (profile) {
                profile.status = 1;
                await profile.save();
              }

              if (invoice) {
                invoice.status = "paid";

                if (invoice.type === "first") {
                  if (user.controls.period == "semester") {
                    user.controls.nexInvoice = moment()
                      .add(6, "months")
                      .format();
                  } else if (user.controls.period == "yearly") {
                    user.controls.nexInvoice = moment()
                      .add(1, "years")
                      .format();
                  }
                } else if (invoice.type === "upgrade") {
                  await UserPlan.create({
                    userId: user.id,
                    flexPlanId: invoice.itens[0].id,
                  });
                }

                await invoice.save();
              }

              await addBonusSupport(user, systemRequest);

              break;

            case "refunded":
              systemRequest.status = "pending";
              systemRequest.limit = getDateLimit();
              // systemRequest.save()
              // if (profile) {
              //   profile.status = 0
              //   await profile.save()
              // }
              break;
          }
        }

        if (Array.isArray(systemRequest.paghiper)) {
          systemRequest.paghiper.push(data);
        }

        await systemRequest.save();

        if (
          systemRequest.status === "reserved" ||
          systemRequest.status === "paid" ||
          systemRequest.status === "completed"
        ) {
          cancelOthersInvoices();
        }
      }

      if (Env.get("NODE_ENV") === "production") {
        data.token = Env.get("PAGHIPER_TOKEN");
        const notification = await axios.post(
          "https://api.paghiper.com/transaction/notification/",
          data
        );
        console.log({ notificationP: notification.data });
      }

      response.json({
        // token: Env.get('PAGHIPER_TOKEN'),
        // apiKey: Env.get('PAGHIPER_APIKEY'),
        transaction_id: data.transaction_id,
        notification_id: data.notification_id,
      });
    } catch (error) {
      const data = request.all();
      console.error({
        date: moment().format(),
        error: error,
        request: data.idPlataforma,
        data: request.all(),
      });
      return response.json(error);
    }
  }

  async createFirstPaghiper(invoiceId) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 518,
        metodo: "createFirstPaghiper",
      });
      const invoice = await Invoice.find(invoiceId);
      const user = await invoice.user().fetch();

      const plans = await user.plans().fetch();
      const userPlans = await UserPlan.query().where("userId", user.id).fetch();
      const products = await SystemProduct.all();

      // const { items } = PaymentController.getDataItemsAndValue(plans, userPlans, products, user);

      if (!user.controls.disableInvoice) {
        const request = await SystemRequest.create({
          invoiceId: invoice.id,
          expiration: invoice.expiration,
          userId: user.id,
          planId: 1,
          paghiper: [],
        });

        const data = {
          apiKey: Env.get("PAGHIPER_APIKEY"),
          order_id: request.id,
          payer_email: user.email,
          payer_name: user.name,
          payer_cpf_cnpj: user.secretNumber
            .split(".")
            .join("")
            .replace("/", "")
            .replace("-", ""),
          type_bank_slip: "boletoA4",
          days_due_date: 1,
          seller_description: `Referente a utilização do sistema WhatsMenu de ${moment(
            request.expiration
          ).format("DD-MM-YYYY")} até ${moment(request.expiration)
            .add(29, "days")
            .format("DD-MM-YYYY")}`,
          payer_phone: user.whatsapp.replace(" ", "").replace("-", ""),
          notification_url: Env.get(
            user.controls.migrated_at
              ? "PAGHIPER_RETURN_NEXT"
              : "PAGHIPER_RETURN"
          ),
          items: invoice.itens.map((item) => {
            if (typeof item === 'string') {
              return {
                item_id: 1,
                description: item,
                quantity: 1,
                price_cents: invoice.value * 100,
              };
            } else {
              const discount = (item.quantityDiscount || 0) * item.value;
              const value = item.service
                ? item.value * item.quantity - discount
                : item.value;
              return {
                item_id: item.id,
                description: item.name,
                quantity: item.quantity,
                price_cents: value * 100,
              };
            }
          }),
        };

        if (user.controls.bilhetParcelament) {
          data.items = invoice.itens.map((item) => {
            return {
              item_id: 1,
              description: item.name,
              quantity: 1,
              price_cents: item.value * 100,
            };
          });
        }

        console.log(data.items);

        // return response.json(data)
        const paghiper = await axios.post(
          "https://api.paghiper.com/transaction/create/",
          data
        );

        request.paghiper = [paghiper.data];
        request.transactionId =
          paghiper.data["create_request"]["transaction_id"];
        await request.save();

        return request.toJSON();
      }

      return {
        success: false,
        error: {
          code: 403,
          message: "client invoice not available!",
        },
      };
    } catch (error) {
      console.error({
        date: moment().format(),
        invoiceId: invoiceId,
        error: error,
      });
      return error;
    }
  }

  async createFirstRequest(userId, cartItems, installments = 1) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 636,
        metodo: "createFirstRequest",
      });
      const user = await User.find(userId);
      const invoice = new Invoice();

      invoice.userId = user.id;
      invoice.status =
        user.controls.disableInvoice && !user.controls.paymentInfo
          ? "paid"
          : "pending";
      invoice.expiration = moment().add(1, "days").format("YYYY-MM-DD");
      invoice.type = "first";
      invoice.installments = installments;

      cartItems.forEach((item) => {
        if (item.service === "printer" || item.service === "menu") {
          if (user.controls.period === "yearly") {
            item.quantityDiscount = 1;
          }
        }
      }, 0);

      const invoiceValue = cartItems.reduce(
        (a, item) =>
          item.value * item.quantity -
          item.value * (item.quantityDiscount || 0) +
          a,
        0
      );

      if (user.controls.bilhetParcelament && !user.controls.paymentInfo) {
        invoice.itens = [
          {
            id: 1,
            name: `Plano Completo em ${installments}x \n[${cartItems
              .map((item) => item.name)
              .join(", ")}]`,
            value: invoiceValue / installments,
          },
        ];

        invoice.value = invoiceValue / installments;
      } else {
        invoice.itens = cartItems;
        invoice.value = invoiceValue;
      }

      await invoice.save();

      if (!user.controls.disableInvoice) {
        await this.createFirstPaghiper(invoice.id);
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async createNewInvoiceToUser(userId, value = null) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 605,
        metodo: "createNewInvoiceToUser",
      });
      const user = await User.find(userId);

      if (!user.controls.disableInvoice) {
        const invoice = await user.requests().where("type", "M").last();
        const plan = await user.plan().fetch();
        const monthRange = moment().diff(
          moment().subtract(1, "months"),
          "days"
        );
        const newInvoice = {
          expiration: invoice.expiration,
          invoiceId: invoice.invoiceId,
          type: "A",
          userId: user.id,
          planId: 1,
          paghiper: {},
        };

        if (moment().diff(moment(invoice.expiration), "days") >= monthRange) {
          const expiration = moment().add(1, "days").format("YYYY-MM-DD");
          newInvoice.expiration = expiration;
          newInvoice.type = "M";

          user.due = moment().add(1, "days").format("DD");
          await user.save();
        }

        const request = await SystemRequest.create(newInvoice);

        const data = {
          apiKey: Env.get("PAGHIPER_APIKEY"),
          order_id: request.id,
          payer_email: user.email,
          payer_name: user.name,
          payer_cpf_cnpj: user.secretNumber
            .split(".")
            .join("")
            .replace("/", "")
            .replace("-", ""),
          type_bank_slip: "boletoA4",
          days_due_date: 1,
          seller_description: `Referente a utilização do sistema WhatsMenu de ${moment(
            request.expiration
          ).format("DD-MM-YYYY")} até ${moment(request.expiration)
            .add(29, "days")
            .format("DD-MM-YYYY")}`,
          payer_phone: user.whatsapp.replace(" ", "").replace("-", ""),
          notification_url: Env.get(
            user.controls.migrated_at
              ? "PAGHIPER_RETURN_NEXT"
              : "PAGHIPER_RETURN"
          ),
          items: [
            {
              item_id: 1,
              description: plan && plan.name ? plan.name : "WhatsMenu",
              quantity: 1,
              price_cents: value
                ? value
                : plan.value.toFixed(2).replace(".", ""),
            },
          ],
        };

        const paghiper = await axios.post(
          "https://api.paghiper.com/transaction/create/",
          data
        );

        request.paghiper = [paghiper.data];
        request.transactionId =
          paghiper.data["create_request"]["transaction_id"];
        await request.save();

        return (await user.requests().last()).toJSON();
      }

      return response.json("client invoice not available!");
    } catch (error) {
      console.error({
        date: moment().format(),
        userId: userId,
        error: error,
      });
      return error;
    }
  }

  static async createPaghiperToInvoice(invoiceId) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 675,
        metodo: "createPaghiperToInvoice",
      });
      const invoice = await Invoice.find(invoiceId);
      const user = await invoice.user().fetch();

      const newSystemRequest = await SystemRequest.create({
        expiration: invoice.expiration,
        type: "A",
        userId: user.id,
        planId: 1,
        invoiceId: invoiceId,
        paghiper: [],
      });

      const data = {
        apiKey: Env.get("PAGHIPER_APIKEY"),
        order_id: newSystemRequest.id,
        payer_email: user.email,
        payer_name: user.name,
        payer_cpf_cnpj: user.secretNumber
          .split(".")
          .join("")
          .replace("/", "")
          .replace("-", ""),
        type_bank_slip: "boletoA4",
        days_due_date: 1,
        seller_description: `Referente a ${invoice.itens.map(
          (item) => `${item.name}; `
        )}`,
        payer_phone: user.whatsapp.replace(" ", "").replace("-", ""),
        notification_url: Env.get(
          user.controls.migrated_at ? "PAGHIPER_RETURN_NEXT" : "PAGHIPER_RETURN"
        ),
        items: invoice.itens.map((item, index) => {
          return {
            item_id: item.id ? item.id : index + 1,
            description: item.name,
            quantity: item.quantity ? item.quantity : 1,
            price_cents: item.value.toFixed(2).replace(".", ""),
          };
        }),
      };

      const paghiper = await axios.post(
        "https://api.paghiper.com/transaction/create/",
        data
      );

      newSystemRequest.paghiper = [paghiper.data];
      newSystemRequest.transactionId =
        paghiper.data["create_request"]["transaction_id"];
      await newSystemRequest.save();

      return newSystemRequest;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getErrors({ response, request }) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 724,
        metodo: "getErrors",
      });
      const { initial, final } = request.all();
      console.log(initial);
      const profiles = await Profile.query().where("status", false).fetch();
      const problems = [];

      console.log(profiles.rows.length);
      for (let i = parseInt(initial); i < parseInt(final); i++) {
        const profile = profiles.rows[i];
        console.log({ index: i, slug: profile.slug });
        const user = await profile.user().fetch();
        const invoices = await user.requests().fetch();

        if (invoices.rows.length > 1) {
          if (
            invoices.rows[0].status === "canceled" &&
            invoices.rows.filter(
              (inv) => inv.status !== "canceled" && inv.status !== "pending"
            ).length > 0
          ) {
            problems.push({
              user: user.id,
              profile: profile.id,
              slug: profile.slug,
              invoices: invoices.rows.map(
                (invoice) =>
                  (i = {
                    id: invoice.id,
                    transaction: invoice.transactionId,
                    status: invoice.status,
                    expires: invoice.expiration,
                  })
              ),
            });
          }
        }
      }
      console.log(problems);
      return response.json(problems);
    } catch (error) {
      console.error(error);
      return response.send(error);
    }
  }

  async paidManual({ request, auth, response }) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 758,
        metodo: "paidManual",
      });
      const user = await auth.getUser();
      if (user.controls.type === "adm") {
        const data = request.except(["_csrf", "_method"]);

        const invoiceUser = await User.find(data.invoice.userId);

        if (!invoiceUser.controls.paymentInfo) {
          let lastStatus = data.invoice.paghiper.pop();
          lastStatus = Object(lastStatus).hasOwnProperty("create_request")
            ? lastStatus.create_request
            : lastStatus;
          lastStatus.idPlataforma = data.invoice.id;
          if (data.invoice.paghiper) {
            data.invoice.paghiper.pop();
          }

          if (lastStatus.status == "pending") {
            // console.log('cancelar fatura')
            await PaymentController.cancelInvoice(data.invoice.transactionId);
          }

          lastStatus.status = "paid";
          const { data: result } = await axios.post(
            `${Env.get("APP_URL")}/paghiper`,
            lastStatus
          );
          return response.json({ ...result });
        } else {
          const invoice = await Invoice.find(data.invoice.id);

          if (invoice) {
            const systemRequest = await invoice.requests().last();
            if (systemRequest && systemRequest.status !== "paid") {
              systemRequest.status = "paid";
              await systemRequest.save();
            }

            invoice.status = "paid";
            await invoice.save();

            try {
              if (invoiceUser.controls.paymentInfo.subscription) {
                await gatewayPagarme.cancelSubscription(
                  {},
                  invoiceUser.controls.paymentInfo.subscription.id
                );
              }
            } catch (error) {
              console.log("Usuário:", invoiceUser.id);
              console.error(error);
            }

            delete invoiceUser.controls.paymentInfo;

            if (invoiceUser.controls.period === "yearly") {
              invoiceUser.controls.nextInvoice = DateTime.local()
                .plus({ years: 1 })
                .toFormat("yyyy-MM-dd");
            }

            invoiceUser.controls.disableInvoice = false;
            await invoiceUser.save();
          }
        }

        return response.json({ ok: true });
      } else {
        response.status(403);
        return response.json({
          code: "403-545",
          message: "Operation not permited to your user!",
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async updateDue({ response }) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 793,
        metodo: "updateDue",
      });
      const users = await User.all();
      for (let user of users.rows) {
        let due = `${moment().format("YYYY-MM-")}${
          user.due < 10 ? `0${user.due}` : user.due
        }`;
        due = moment(due).add(7, "days").format("DD");
        user.due = due;
        await user.save();
      }
      response.json(
        users.rows.map((u) => {
          return { user: u.email, due: u.due };
        })
      );
    } catch (error) {
      console.error(error);
      response.json(error);
    }
  }

  async todayPayments({ response, view, session }) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 810,
        metodo: "todayPayments",
      });
      const invoices = await SystemRequest.query()
        .where("created_at", "like", moment().format("YYYY-MM-DD%"))
        .fetch();
      response.send(
        view.render("email.reports.generateinvoices", {
          invoices: invoices.toJSON(),
        })
      );
    } catch (error) {
      session.withErrors(error.messages).flashAll();
      await session.commit();
      response.redirect("back");
      return;
    }
  }

  static async cancelInvoice(transaction) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 827,
        metodo: "cancelInvoice",
      });
      const paghiper = await axios.post(
        "https://api.paghiper.com/transaction/cancel/",
        {
          apiKey: Env.get("PAGHIPER_APIKEY"),
          token: Env.get("PAGHIPER_TOKEN"),
          status: "canceled",
          transaction_id: transaction,
        }
      );
      return {
        success: true,
        paghiper: paghiper,
      };
    } catch (error) {
      throw error;
    }
  }

  async countPaidInvoices(user) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 847,
        metodo: "countPaidInvoices",
      });
      const invoices = await user
        .requests()
        .whereIn("status", ["reserved", "paid", "completed"])
        .fetch();

      if (!invoices) {
        return 0;
      }

      return invoices.rows.length;
    } catch (error) {
      console.error(error);
      return error;
    }
  }

  static async paidCheck(invoice) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 864,
        metodo: "paidCheck",
      });
      const paid = await SystemRequest.query()
        .where({ expiration: invoice.expiration, userId: invoice.userId })
        .whereIn("status", ["reserved", "paid", "completed"])
        .first();

      return paid ? true : false;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  static async allInvoicesOfPayment(invoice) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 879,
        metodo: "allInvoicesOfPayment",
      });
      return await SystemRequest.query()
        .where({ userId: invoice.userId, expiration: invoice.expiration })
        .fetch();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async fixDatePayment({ response }) {
    try {
      console.log("Starting: ", {
        controller: "PaymentController",
        linha: 889,
        metodo: "fixDatePayment",
      });
      let page = 1;
      let systemRequests = (
        await SystemRequest.query().paginate(page, 2000)
      ).toJSON();
      console.log({ totalPages: systemRequests.lastPage });

      do {
        console.log({ page: page });

        for (let sr of systemRequests.data) {
          // console.log();
          if (Array.isArray(sr.paghiper)) {
            if (
              sr.paghiper[sr.paghiper.length - 1] &&
              sr.paghiper[sr.paghiper.length - 1].dataStatus
            ) {
              await Database.table("system_requests")
                .where("id", sr.id)
                .update(
                  "updated_at",
                  sr.paghiper[sr.paghiper.length - 1].dataStatus
                );
              await Database.table("invoices")
                .where("id", sr.invoiceId)
                .update(
                  "updated_at",
                  sr.paghiper[sr.paghiper.length - 1].dataStatus
                );
            } else {
              await Database.table("system_requests")
                .where("id", sr.id)
                .update(
                  "updated_at",
                  sr.paghiper[0].create_request.due_date
                    ? `${sr.paghiper[0].create_request.due_date} 00:00:00`
                    : sr.expiration
                );
              await Database.table("invoices")
                .where("id", sr.invoiceId)
                .update(
                  "updated_at",
                  sr.paghiper[0].create_request.due_date
                    ? `${sr.paghiper[0].create_request.due_date} 00:00:00`
                    : sr.expiration
                );
            }
          } else {
            if (
              sr.paghiper.create_request &&
              sr.paghiper.create_request.due_date
            ) {
              await Database.table("system_requests")
                .where("id", sr.id)
                .update(
                  "updated_at",
                  `${sr.paghiper.create_request.due_date} 00:00:00`
                );
              await Database.table("invoices")
                .where("id", sr.invoiceId)
                .update(
                  "updated_at",
                  `${sr.paghiper.create_request.due_date} 00:00:00`
                );
            } else {
              await Database.table("system_requests")
                .where("id", sr.id)
                .update("updated_at", sr.expiration);
              await Database.table("invoices")
                .where("id", sr.invoiceId)
                .update("updated_at", sr.expiration);
            }
          }
        }
        systemRequests = (
          await SystemRequest.query().paginate(++page, 2000)
        ).toJSON();
      } while (page <= systemRequests.lastPage);

      response.json({ status: "ok" });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async cancelInvlicesFromList() {
    const list = [
      "03XA086WDXRXZ522",
      "03RU43Q0PORF3422",
      "03COC2A0Z4H3I222",
      "03YK8MNF6ZOB8922",
      "033QULBOKB4DLQ22",
      "033DCXGWWIUM8M22",
      "03X47CT09R8D1722",
      "03Y3OD5O7T52JA22",
      "03PQK7AFWSP2JJ22",
      "03O89ZPLPL44WU22",
      "03DSOT3DXIMILV22",
      "03VY7TFGEATHMU22",
      "03A1DSXLKRP1PA22",
      "03EEYMR9MOF8KY22",
      "03KDRDNWH75OYF22",
      "03LHHECSO0PWTQ22",
      "032HY0EZEX6YMU22",
      "03UEZ15C9E84EZ22",
      "03CHAEEE40IF9Y22",
      "03EY1X5C91SFSG22",
      "0370WRNW4Y4G6522",
      "039YV91IOR4UDC22",
      "03LADUAUWXK2FT22",
      "038ZB4BZ1WZTHP22",
      "03J0T5RQ6M8YQW22",
      "03GTMPUMOSU2JR22",
      "03VIUXB96UKDKG22",
      "03AJQPYO6I2E0022",
      "039FRULAGN3A3622",
      "03RL1B6VUNUFVM22",
      "03AAAVLZYZ49LI22",
      "03NYP0FYK4EO7C22",
      "03U8OWR5GLRT4I22",
      "03NOCIH22QFZVQ22",
      "03UNNV7X6L0BRX22",
      "03UZ6V8Z03J94722",
      "03FR2NOLL9LJ8922",
      "03EEB961A7GG5X22",
      "03L3IP0JCVVSLP22",
      "03AWJHZIYNDY8H22",
      "03T3K5LLS9L5CB22",
      "03FCTJPBRVQKBZ22",
      "034M23CRWEPTDP22",
      "0308A7X80VCYS822",
      "03Z0Z92I4PKM8822",
      "03GU0XVXU7WYKP22",
      "034CEHAEIUL0TC22",
      "03T73UFNSZVBLO22",
      "039J4UXZNCW4XX22",
      "03ERERYQCC7U8122",
      "03Q57GFS0JZU3R22",
      "030HLEJHYD2WB122",
      "03CDPW8KKU1HB922",
      "03DZXFKSM30NE222",
      "03KO8AJPPWF91B22",
      "03OAVWF3ZETO3J22",
      "03LEGF5G93PL6X22",
      "03IO9EB4XSZI1E22",
      "03MGTS2YV4DX1322",
      "037EI6TTZ61ZLA22",
      "03CN6B0JZ0HPB622",
      "03KDAC5P8ZAJFE22",
      "03JQM0IOAG2MME22",
      "03VULO398FI4IR22",
      "03S2L83O80Z0T022",
      "0399J39KGHOWXH22",
      "03U16Z63GZOHX022",
      "03X0KEW7JIZ1IR22",
      "036BU7ITXA2NPQ22",
      "036MO6KYV0FO9922",
      "03HFRDYJY5IHRX22",
      "03JDKFUDQWJI4T22",
      "03YJ3JBXQULKWT22",
      "0303SMLJ43C9NF22",
      "03YUJT75J9IDQ722",
      "03GMLC0F1Y1QYI22",
      "03DH1K5Q14KBU122",
      "03NDWJIK5UX05B22",
      "03864L0TJ7E52L22",
      "03YFJYSIVT7XME22",
    ];

    list.forEach((item) => {
      PaymentController.cancelInvoice(item);
    });
  }

  static getDataItemsAndValue(plans, userPlans, products, user) {
    console.log({plans, userPlans, products, user});
    const period = user.controls.period ? user.controls.period : "monthly";
    const currency = user.controls.currency ? user.controls.currency : "brl";

    const plansArr = plans.rows ? plans.rows : plans;
    const userPlansArr = userPlans.rows ? userPlans.rows : userPlans;
    const productsArr = products.rows ? products.rows : products;
    const data = {
      items: [],
      value: 0,
    };

    for (const plan of plansArr) {
      const userPlan = userPlansArr.find(
        (uPlan) => uPlan.flexPlanId === plan.id
      );
      const product = productsArr.find((product) => {
        if (product.systemProductId) {
          return product.id === userPlan.systemProductId;
        } else {
          return (
            product.plan_id === userPlan.flexPlanId &&
            product.operations.type === period
          );
        }
      });

      const price = product.operations.prices.find((price) => {
        if (userPlan.priceId) {
          return (price) => price.id === userPlan.priceId;
        } else {
          return price.id === product.default_price;
        }
      });

      const value = price.currencies[currency].unit_amount;

      data.items.push({
        id: product.id,
        name: product.name,
        plan_id: plan.id,
        service: "plan",
        category: plan.category,
        quantity: 1,
        value: value / 100,
        price_id: price.id,
      });
    }

    data.value = data.items.reduce((a, item) => item.value + a, 0);

    return data;
  }
}

module.exports = PaymentController;
