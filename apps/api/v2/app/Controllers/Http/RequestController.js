'use strict'
const moment = require('moment')
const { DateTime } = require('luxon')
const axios = require('axios')
const Ws = use('Ws')
const View = use('View')
const Env = use('Env')
const Request = use('App/Models/Request')
const Database = use('Database')
const Profile = use('App/Models/Profile')
const Bartender = use('App/Models/Bartender')
const Command = use('App/Models/Command')
const Table = use('App/Models/Table')
const Cupom = use('App/Models/Cupom')
const Utility = use('Utility')
const luxon = require('luxon')


class RequestController {
  async index({ auth, response, view }) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 19, metodo: 'index' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      const deliveryAccess = await Utility.ControlAccess(user)

      if (JSON.parse(deliveryAccess)) {
        if (!profile.address.street || !profile.taxDelivery.length) {
          return response.route('profileIndex')
        }
      }

      // const requests = await profile.requests().where('created_at', 'like', `${moment().format('YYYY-MM-DD')}%`).orderBy('id', 'desc').with('cupom').fetch()
      // const rq = requests.toJSON()
      // rq.forEach(r => r.created_at = moment(r.created_at).format('DD-MM-YYYY HH:mm:ss'));

      const placeholders = { ...profile.options.placeholders }

      delete placeholders.productObs
      delete placeholders.pizzaObs
      placeholders.statusProduction = encodeURI(placeholders.statusProduction)
      placeholders.statusSend = encodeURI(placeholders.statusSend)
      placeholders.statusToRemove = encodeURI(placeholders.statusToRemove)

      View.global('calcCupomValue', (item) => {
        let value = 0

        if (item.cupom) {
          if (item.cupom.type === 'value') {
            value = item.cupom.value
          } else if (item.cupom.type === 'percent') {
            value = item.total * item.cupom.value / 100
          }
        }

        // console.log(value)
        return value
      })

      response.send(
        view.render('inner.requests.newRequest', {
          profile: profile.toJSON(),
          requests: [],
          placeholders: JSON.stringify(placeholders)
        })
      )
      // response.send(
      //   view.render('inner.requests.index', {
      //     profile: profile.toJSON(),
      //     requests: rq,
      //     placeholders: JSON.stringify(placeholders)
      //   })
      // )
    } catch (error) {
      console.error({
        date: new Date(),
        error: error
      })
      throw error
    }
  }

  async update({ request, auth, response }) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 83, metodo: 'update' })
      const data = request.all()
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const requestStore = await Request.find(data.id)

      if (profile.id === requestStore.profileId && !data.package) {
        requestStore.status = data.status
        await requestStore.save()

        response.json({
          success: true,
          request: requestStore
        })
      } else if (profile.id === requestStore.profileId && data.id && data.package) {
        requestStore.packageDate = data.package
        await requestStore.save()

        return response.json({
          success: true,
          text: 'Data atualizada com sucesso.',
          request: requestStore
        })
      } else {
        response.status(403)
        response.json({
          success: false,
          error: {
            code: 403,
            message: 'Este pedido não é do seu perfil.'
          }
        })
      }

    } catch (error) {
      console.error({
        date: new Date(),
        error: error
      })
    }
  }

  async store({ request, response }) {
    console.log('Starting: ', { controller: 'RequestController', linha: 128, metodo: 'store' })
    // console.log(request.headers());
    // return response.json(request.headers());
    const data = request.except(['_csrf', '_method'])
    data.client.ip = request.header('x-real-ip');
    // console.log(data.client);
    const convertFromReal = (text) => {
      if (text && typeof text === 'string') {
        let val = text.split('R').join('')
        val = val.split('$').join('')
        val = val.split(' ').join('')
        val = val.split(',').join('.')
        val = parseFloat(val)

        if (val) {
          return val.toFixed(2)
        } else {
          return 0
        }
      } else {
        data.client.transshipment = 0
        return 0
      }
    }

    // if (!data.notNeedTransshipment && Number(data.client.transshipment) < Number(data.taxDeliveryValue) + data.total) {
    //   return response.status(401).json({
    //     code: "401",
    //     message: "Troco menor que o valor total da compra!"
    //   })
    // }

    try {
      const profile = await Profile.findBy('slug', data.slug)

      console.log(profile.options.migrated_at)
      if (profile.options.migrated_at) {
        return response.status(401).json({
          code: "401",
          message: "Desculpe nos o transtorno, não foi possível registrar seu pedido, atualize a página e tente novamente."
        })
      }

      if (!profile.status) {
        return response.status(401).json({
          code: "401",
          message: "Desculpe nos o transtorno, mas esta loja no momento se encontra fechada."
        })
      }

      if (profile.options.blackList && profile.options.blackList.find(bl => bl.whatsapp === data.client.contact || bl.ip === data.client.ip)) {
        return response.status(403).json({
          code: "403",
          message: "Cliente Bloqueado!"
        })
      }

      const user = await profile.user().fetch()
      let newReq = null;
      let printTopic = null;
      let clientRequest = await Request.query().where({
        profileId: profile.id,
        code: data.code
      }).first()

      let command
      let tableOpened
      let table

      if (data.type === "T") {
        command = data.type === "T" ? await Command.find(data.commandId) : undefined;
        tableOpened = command ? await command.table().fetch() : undefined;
        table = tableOpened ? await tableOpened.table().fetch() : undefined;
        if (!table.status || !command.status) {
          response.status(405)
          return response.json({
            success: false,
            code: '405-3',
            message: !command.status ? 'Comanda Encerrada!' : 'Mesa pausada!',
            tableIsPaused: true
          })
        }
      }


      await Database.transaction(async trx => {
        profile.request++;

        data.code = profile.request
        await profile.save(trx);

        let duplicate = null
        /*
              if (data.code) {

                duplicate = await profile.requests()
                .where('created_at', 'like', moment().format('YYYY-MM-DD%'))
                .where({
                  code: data.code
                }).last()

              } else {
                profile.request++
                data.code = profile.request
                await profile.save()
              }
        */

        if (duplicate) {
          response.status(405)
          return response.json({
            success: false,
            code: '405-2',
            message: 'this request already exists!'
          })
        }

        if (!clientRequest && !duplicate) {
          let tx = { value: 0, time: 0 }
          if (profile.typeDelivery === 'km' && data.typeDelivery == 0) {
            const km = profile.taxDelivery.find(tax => (tax.distance > 1000 ? tax.distance : tax.distance * 1000) >= data.client.distance)

            if (km) {
              tx = km
            } else {
              return response.status(403).json({
                code: '403-239',
                message: 'Delivery out of range'
              });
            }

          } else if (profile.typeDelivery === 'neighborhood' && data.typeDelivery == 0) {
            const ct = profile.taxDelivery.find(t => t.city === data.client.city)
            console.log(`ct: ${JSON.stringify(ct)}`);
            tx = ct.neighborhoods.find(n => n.name === data.client.neighborhood)
            console.log(`tx: ${JSON.stringify(tx)}`);
          }

          if (data.cupom) {
            const cupom = await Cupom.find(data.cupom)

            if (cupom && cupom.type === 'freight') {
              tx.value = 0
            }
          }

          // if (data.client.distance > (profile.taxDelivery[profile.taxDelivery.length - 1].distance * 1000)) {
          //   response.status(405)
          //   return response.json({
          //     code: '405-188',
          //     message: 'distance out of range!'
          //   })
          // }

          if (profile.options.package.active && data.packageDate) {

            let requestsP;
            let requests = [];
            let page = 1
            const packageDateFormat = DateTime.fromJSDate(new Date(data.packageDate))
            const maxProfilePackage = Number(profile.options.package.maxPackage)
            const maxProfilePackageHour = Number(profile.options.package.maxPackageHour)


            do {
              requestsP = await profile.requests()
                .where('type', 'P')
                .whereBetween('packageDate', [packageDateFormat.toFormat("yyyy-MM-dd 00:00:00"), packageDateFormat.toFormat("yyyy-MM-dd 23:59:59")])
                .whereNull("status", query => query.orWhere("status", "!=", "canceled"))
                .orderBy('packageDate')
                .paginate(page, 30)

              requests.push(...requestsP.rows)
              page++
            } while (page <= requestsP.pages.lastPage);

            const quantityRequestsPackage = requests.filter(req => {

              return DateTime.fromJSDate(new Date(req.packageDate)).toFormat("yyyy-MM-dd HH:mm:ss") === data.packageDate
            }).length

            if (requests.length >= maxProfilePackage) {

              throw {
                success: false,
                code: '409',
                date: data.packageDate,
                message: 'A data escolhida não esta mais disponivel.<br> Por favor selecione uma outra data',
                dates: [data.packageDate]
              };
            }

            if (quantityRequestsPackage >= maxProfilePackageHour) {
              const choiceHour = DateTime.fromJSDate(new Date(data.packageDate + ' '));

              throw {
                success: false,
                code: 418,
                message: 'Horário indisponível, ' + choiceHour.toFormat('HH:mm:') + '<br>Favor Escolher outro horário.',
                hour: choiceHour.toFormat('HH:mm'),
                date: data.packageDate
              }
            }

          }


          if (data.commandId) {
            const requestCommand = await Command.findBy('id', data.commandId)
            if (requestCommand && !requestCommand.status) {
              response.status(403)
              return response.json({ code: 403 })
            }
          }

          newReq = {
            profileId: profile.id,
            status: null,
            cupomId: data.cupom,
            commandId: data.commandId || null,
            bartenderId: data.bartenderId,
            code: data.code,
            name: data.client.name,
            contact: data.client.contact,
            deliveryAddress: {
              zipCode: data.client.zipCode,
              street: data.client.street,
              number: data.client.number,
              complement: data.client.complement,
              neighborhood: data.client.neighborhood,
              reference: data.client.reference,
              city: data.client.city,
              latitude: data.client.latitude,
              longitude: data.client.longitude,
              distance: data.client.distance,
              ip: data.client.ip
            },
            cart: data.cart,
            cartPizza: data.cartPizza,
            formPayment: data.client.formPayment || "-",
            formPaymentFlag: data.client.formPaymentFlag || "-",
            typeDelivery: data.typeDelivery,
            taxDelivery: tx.value ? tx.value : data.taxDeliveryValue === null ? null : 0,
            timeDelivery: tx.time ? tx.time : 0,
            transshipment: data.client.formPayment !== 'Cartão' ? convertFromReal(data.client.transshipment) : 0,
            total: data.total,
            type: data.type,
            packageDate: data.packageDate || null
          }

          if (!data.bartenderId) {
            delete newReq.bartenderId
          }

          if (newReq.taxDelivery === 'A consultar') {
            newReq.taxDelivery = null
          }

          clientRequest = await Request.create(newReq, trx)

          // .catch(async (error) => {
          //   profile.request--;
          //   await profile.save();

          //   throw error
          // });


        }
        printTopic = Ws.getChannel('print:*').topic(`print:${data.slug}`);


        if (printTopic) {
          clientRequest.print = true;
          await clientRequest.save(trx);
        }

      }).then(async () => {
        const rqt = await Request.query().where('id', clientRequest.id).with('cupom').first()
        const requestTopic = Ws.getChannel('request:*').topic(`request:${data.slug}`);

        if (rqt) {
          rqt.packageDate = DateTime.fromJSDate(new Date(rqt.packageDate)).toSQL();
        }
        // if (user.controls.print && user.controls.print.app) {
        //   await this.onesignalSend(rqt.id, user.id)
        //  }
        /**
         */
        // const topic = Ws.getChannel('request:*')
        // console.log(topic)
        // if no one is listening, so the `topic('subscriptions')` method will return `null`
        if (requestTopic && rqt) {
          (async () => requestTopic.broadcast(`request:${data.slug}`, [rqt.toJSON()]))();

          console.log({
            code: data.code,
            status: rqt.status,
            slug: data.slug,
            total: data.total
          })
        } else {
          console.log({
            topic: requestTopic,
            slug: data.slug,
            code: data.code,
            date: moment().format()
          })
        }

        if (clientRequest.type !== "P") {
          const command = newReq.type === "T" ? await Command.find(newReq.commandId) : undefined;
          const tableOpened = command ? await command.table().fetch() : undefined;
          const table = tableOpened ? await tableOpened.table().fetch() : undefined;
          const commandJSON = command ? command.toJSON() : null;
          const bartender = await rqt.bartender().fetch()
          const req = rqt.toJSON();

          if (commandJSON) {
            commandJSON.requests = [req];
            commandJSON.subTotal = this.getTotalValue(commandJSON, "command");
            commandJSON.totalValue = this.getTotalValue(commandJSON, "commandFee");
            commandJSON.lack = this.getTotalValue(commandJSON, "lack");
            commandJSON.paid = this.getTotalValue(commandJSON, "paid");
            commandJSON.fees = commandJSON.fees.filter((fee) => fee.deleted_at === null)
          }

          let printLayoutResult

          if (printTopic) {
            try {
              const { data: result } = await axios.post('https://adm.whatsmenu.com.br/api/printLayout', {
                request: req,
                table,
                command,
                profile,
                bartender
              })
              printLayoutResult = result
            } catch (error) {
              console.error(error);
            }

            printTopic.broadcast(`print:${data.slug}`, {
              requests: [req],
              type: req.type,
              command: commandJSON,
              table
            })

            if (printLayoutResult) {
              printTopic.broadcast(`print`, printLayoutResult.reactComponentString)
            }
          }
        }

        console.log('Transação finalizada com sucesso');
        return response.json(clientRequest)
      }).catch(error => {
        console.error('Houve um erro na transação do pedido.');
        console.error(error);
        if (error.code) {
          return response.status(error.code).json(error);
        }
      })

    } catch (error) {
      console.error({
        date: moment().format(),
        data: request.all(),
        error: error
      })

      response.status(500)
      return response.json({
        success: false,
        profile: await Profile.findBy('slug', data.slug),
        error: error
      })
    }
  }

  async printQueue({ response }) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 367, metodo: 'printQueue' })
      const requests = await Request.query().where('print', 0).where('tentatives', '<', '3').where('created_at', '>', moment().subtract(1, 'days').format()).with('cupom').with('profile').with('bartender').fetch()
      const sends = {}
      for (let request of requests.rows) {
        request.tentatives += 1
        request.save()

        const req = request.toJSON()
        const rqt = JSON.parse(JSON.stringify(req))


        rqt.deliveryAddress = JSON.parse(rqt.deliveryAddress)
        rqt.cart = JSON.parse(rqt.cart)
        rqt.cartPizza = JSON.parse(rqt.cartPizza)

        if (!sends[req.profile.slug]) {

          sends[req.profile.slug] = [rqt]

        } else {

          sends[req.profile.slug].push(rqt)

        }
      }

      // await axios.post(`https://rt2.whatsmenu.com.br/queueToRt2`, sends)

      for (let slug in sends) {
        const topic = Ws.getChannel('request:*').topic(`request:${slug}`)
        if (topic) {

          topic.broadcast(`request:${slug}`, sends[slug].map((request) => {
            const { profile, ...rest } = request
            return rest
          }))
        }

        const printTopic = Ws.getChannel('print:*').topic(`print:${slug}`);

        for (let request of sends[slug]) {

          if (printTopic) {
            const command = request.type === "T" ? await Command.find(request.commandId) : undefined;
            const tableOpened = command ? await command.table().fetch() : undefined;
            const table = tableOpened ? await tableOpened.table().fetch() : undefined;
            const commandJSON = command ? command.toJSON() : null;
            const { bartender, profile } = request

            let printLayoutResult

            try {
              const { data: result } = await axios.post('https://next.whatsmenu.com.br/api/printLayout', {
                request,
                command,
                profile,
                bartender
              })

              printLayoutResult = result
            } catch (error) {
              console.error(error);
            }

            printTopic.broadcast(`print:${slug}`, {
              requests: [request],
              type: request.type,
              command: commandJSON,
              table
            })

            if (printLayoutResult) {
              printTopic.broadcast(`print`, printLayoutResult.reactComponentString)
            }
          }
        }
      }

      response.json(sends)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async confirmRequestPrint({ auth, response, params }) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 412, metodo: 'confirmRequestPrint' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const request = await profile.requests().where('id', params.requestId).first()

      if (request) {
        request.print = 1
        await request.save()

        return response.json(request)
      }

      response.status(403)
      return response.json({
        error: '403-309',
        message: 'this request not belongs your user!'
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async myRequests({ auth, response }) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 437, metodo: 'myRequests' });
      const user = await auth.getUser();
      const profile = await user.profile().fetch();
      if (!profile) {
        const requests = [];
        return response.json(requests);
      }

      let fuso = { hour: '-03:00', zone: 'UTC-3' }
      switch (profile.timeZone) {
        case 'America/Rio_Branco':
          fuso = { hour: '-05:00', zone: 'UTC-5' }
          break;
        case 'America/Manaus':
          fuso = { hour: '-04:00', zone: 'UTC-4' }
          break;
        case 'America/Noronha':
          fuso = { hour: '-02:00', zone: 'UTC-2' }
          break;
      }

      const hourFuso = DateTime.local().setZone(fuso.zone)
        .minus({ day: DateTime.local().ts > DateTime.fromObject({ hour: 4, minute: 0 }).setZone(fuso.zone).ts ? 0 : 1 })
        .toFormat('yyyy-MM-dd')
      const addDayInFuso = DateTime.local().plus({day: 1}).toFormat('yyyy-MM-dd')
      const requests = await profile.requests()
        .whereNot('type', 'P')
        .whereRaw(`(CONVERT_TZ(created_at,'-03:00','${fuso.hour}') BETWEEN '${hourFuso}' and '${addDayInFuso}')`)
        .orderBy('id', 'desc')
        .with('cupom')
        .fetch()

      return response.json(requests)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async myRequestsWs({ auth, request, response }) {
    try {
      const user = await auth.getUser();
      const profile = await user.profile().fetch();
      const data = request.except(["_csrf"]);

      if (profile && profile.slug) {
        const hourOpenProfile = profile.week[DateTime.local().setZone(profile.timeZone).toFormat("cccc").toLowerCase()][0];
        const hourOpen = hourOpenProfile ? hourOpenProfile.open.split(":") : "01:00".split(":");

        const initialHour = DateTime.local().set({ hour: hourOpen[0], minutes: hourOpen[1] }).setZone(profile.timeZone).toFormat("yyyy-MM-dd HH:mm:ss");
        const finalHour = DateTime.local().setZone(profile.timeZone).toFormat("yyyy-MM-dd HH:mm:ss");

        const requests = await profile.requests().whereNotIn('id', data.requestsId.length ? data.requestsId : [1]).whereBetween('created_at', [initialHour, finalHour]).fetch();
        const requestsEnv = requests.toJSON();

        const channel = Ws.getChannel('request:*').topic(`request:${profile.slug}`)

        if (channel) {
          channel.broadcast(`request:${profile.slug}`, requestsEnv)
        }

        return response.json({ success: true })
      } else {
        return response.status(404).json({ success: false })
      }


    } catch (error) {
      console.error(error);
      throw error
    }
  }

  async request({ params, auth, response }) {
    console.log(params.id)
    const req = await Request.find(params.id);

    return req
  }

  async requestsPackage({ auth, response, request }) {
    const page = parseInt(request.qs.page)
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 472, metodo: 'requestsPackage' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      if (!profile) {
        return response.json([])
      }

      let requests = await profile.requests()
        .where('type', 'P')
        .where('packageDate', '>=', moment().format('YYYY-MM-DD'))
        .with('cupom')
        .orderBy('packageDate')
        .paginate(page, 200)

      if (page === 1) {
        const countPedidos = []
        const requestsDate = []
        let pageInt = 1
        let requestCount;

        do {
          requestCount = await profile.requests()
            .where('type', 'P')
            .where('packageDate', '>=', DateTime.local().setZone(profile.timeZone).toFormat('yyyy-MM-dd'))
            .orderBy('packageDate')
            .paginate(pageInt, 100)

          countPedidos.push(...requestCount.rows)
          pageInt++
        } while (pageInt <= requestCount.pages.lastPage)

        countPedidos.forEach(request => {
          const idV = DateTime.fromJSDate(request.packageDate).toFormat('MMdd')
          const index = requestsDate.findIndex(el => el.id === idV)

          if (index === -1) {
            requestsDate.push({
              id: idV,
              date: request.packageDate,
              max: 1
            })
          } else {
            requestsDate[index].max += 1
          }
        })

        requests.datesLength = requestsDate
        requests.rows.forEach(req => {
          req.packageDate = DateTime.fromJSDate(new Date(req.packageDate)).toSQL();
        })
      }

      return requests
    } catch (e) {
      console.log(e)
      throw e
    }
  }

  async print({ auth, params, response, view }) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 530, metodo: 'print' })
      const request = await Request.query().where('id', params.id).with('cupom').first()

      if (request) {

        const profile = await request.profile().fetch()

        return response.json({
          profile: profile,
          request: request
        })

        // View.global('isProduction', () => Env.get('NODE_ENV', 'develepment') === 'production')

        // return response.send(
        //   view.render('inner/requests/print', {
        //     request: JSON.stringify(request.toJSON()),
        //     profile: profile.toJSON()
        //   })
        // )

      } else {
        return response.json({
          error: '404-110',
          message: 'Pedido não encontrado!'
        })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async sendPrintFromADM({ auth, params, response }) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 565, metodo: 'sendPrintFromADM' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const request = await profile.requests().where('id', params.id).first()

      if (request) {
        await this.onesignalSend(request.id, user.id)
      }

    } catch (error) {
      throw error
    }
  }

  // async onesignalSend(requestId, userId) {
  //   try {
  //     console.log('Starting: ', { controller: 'RequestController', linha: 581, metodo: 'onesignalSend' })
  //     const data = {
  //       external_user_id: `${userId}`,
  //       included_segments: ["Active Users"],
  //       app_id: "94b94f51-1697-4ac4-ad69-1ce362676407",
  //       content_available: false,
  //       headings: { "en": "Olha o Pedido! WhatsMenu" },
  //       contents: {
  //         en: "Mais 1 Pedido"
  //       },
  //       data: {
  //         "request": requestId
  //       }
  //     }
  //     const header = {
  //       Authorization: 'Bearer YjA5NGE2YjktZjNlZS00NzRhLWFkOGUtN2MzNzgwZjliNjQy',
  //       'Content-Type': 'application/json'
  //     }
  //     await axios.post('https://onesignal.com/api/v1/notifications', data, { headers: header })
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  async updateApi({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'RequestController', linha: 607, metodo: 'updateApi' })
      const { bartenderId, requestId, update } = request.all()

      const bartender = await Bartender.find(bartenderId)
      const req = await Request.find(requestId)

      if (bartender && (bartender.controls.type !== 'manager') || (req.profileId !== bartender.profileId)) {
        console.log(bartender, req);
        return response.status(401).json({ message: 'Você não tem permissão para realizar essa operação!' })
      }

      req.merge(update)

      await req.save()

      return response.json(req)

    } catch (error) {
      console.error(error)
      throw error
    }
  }

  getTotalValue(
    command,
    only,
    value = 0
  ) {
    const commandTotal = command.requests.reduce((commandTotal, request) => {
      if (request.status !== "canceled") {
        commandTotal += request.total;
      }
      return commandTotal;
    }, 0);

    const feeTotal = command.fees.reduce((feeTotal, fee) => {
      if (fee.status && fee.automatic) {
        if (fee.type === "percent") {
          feeTotal += (fee.value / 100) * commandTotal;
        } else {
          feeTotal += fee.quantity ? fee.quantity * fee.value : 0;
        }
      }
      return feeTotal;
    }, 0);

    const formsPaymentTotal = command.formsPayment.reduce(
      (formsPaymentTotal, formPayment) => formsPaymentTotal + formPayment.value,
      0
    );

    const total = commandTotal + feeTotal + formsPaymentTotal;
    switch (only) {
      case "":
        return total;
      case "fee":
        return feeTotal;
      case "commandFee":
        return commandTotal + feeTotal;
      case "formsPayment":
        return formsPaymentTotal;
      case "command":
        return commandTotal;
      case "lack":
        return Math.max(commandTotal + feeTotal - formsPaymentTotal - value, 0);
      case "paid":
        return formsPaymentTotal + value;
    }
  };

  async queueToRt2({ request, response }) {
    const sends = request.all()
    console.log(sends);
    try {
      if (sends) {
        for (let slug in sends) {
          const topic = Ws.getChannel('request:*').topic(`request:${slug}`)

          if (topic) {
            topic.broadcast(`request:${slug}`, sends[slug])
          }

        }
        return response.json({ message: 'Pedidos enviados para rt2', success: true })
      }
    } catch (error) {
      console.error(error);
    }
  }

  async sendMessage({ request, response }) {
    try {
      const { whatsapp, message, app } = request.all()

      let link = `whatsapp://send?phone=${whatsapp}&text=${message}`

      if (!parseInt(app)) {
        link = `https://wa.me/${whatsapp}?text=${message}`
      }

      response.redirect(link)

    } catch (error) {
      throw error
    }
  }


}

module.exports = RequestController
