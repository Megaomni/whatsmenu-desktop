'use strict'

const UserController = use('App/Controllers/Http/UserController')
const Invoice = use('App/Models/Invoice')
const Request = use('App/Models/Request')
const BonusSupport = use("App/Models/BonusSupport")
const Seller = use('App/Models/Seller')
const User = use('App/Models/User')
const Profile = use('App/Models/Profile')
const moment = use('moment')

class ReportController {

  async registerIndex({ response, view, auth }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 16, metodo: 'registerIndex' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      response.send(
        view.render('inner.adm.reports.sell', {
          profile: profile ? profile.toJSON() : null
        })
      )
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async sellerDaily({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 33, metodo: 'sellerDaily' })
      const seller = await Seller.find(params.id)
      let month = moment().subtract(6, 'months')

      const relSeller = {
        seller: seller,
        months: []
      }

      while (month.format('YYYY-MM') !== moment().add(1, 'months').format('YYYY-MM')) {
        relSeller.months.push({
          month: month.format('YYYY-MM'),
          users: []
        })
        month = month.add(1, 'months')
      }

      month = moment().subtract(6, 'months')

      while (month.format('YYYY-MM') !== moment().add(1, 'months').format('YYYY-MM')) {

        const between = [month.format('YYYY-MM-01'), month.add(1, 'months').format('YYYY-MM-01')]
        month.subtract(1, 'months')


        // const users = await seller.users().whereBetween('created_at', between).with('invoices', (invoice) => {
        //   invoice
        //     .where({
        //       status: 'paid',
        //       type: 'first'
        //     })
        //     .whereBetween('updated_at', between)
        // }).fetch()


        // const usrs = users.toJSON()

        const invoices = await Invoice
          .query()
          .where({
            status: 'paid',
            type: 'first'
          })
          .whereBetween('updated_at', between)
          .with('user.plans')
          .fetch()

        const invs = invoices.toJSON()
        let users = invs.map(invoice => {
          const user = invoice.user
          delete invoice.user

          user.invoices = [invoice]

          return user
        })

        users = users.filter(u => u.sellerId == seller.id)

        relSeller.months.find(m => m.month === month.format('YYYY-MM')).users = users
        // relSeller.months[month.format('YYYY-MM')].users = users

        // for (let user of usrs) {

        //   if (user.controls.disableInvoice) {
        //     relSeller.months.find(m => m.month === user.created_at.substr(0, 7)).users.push(user)
        //   } else if (user.invoices.length > 0){
        //     relSeller.months.find(m => m.month === user.invoices[0].updated_at.substr(0, 7)).users.push(user)
        //   }

        // }

        month = month.add(1, 'months')
      }

      return response.json(relSeller)

    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async financial({ response }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 87, metodo: 'financial' })
      let month = moment().subtract(6, 'months')
      const result = {
        registers: {},
        mensalities: {},
        upgrades: {},
        canceleds: {}
      }

      const allcanceleds = []

      while (month.format('YYYY-MM') !== moment().add(1, 'months').format('YYYY-MM')) {

        result.registers[month.format('YYYY-MM')] = []
        result.mensalities[month.format('YYYY-MM')] = []
        result.upgrades[month.format('YYYY-MM')] = []
        result.canceleds[month.format('YYYY-MM')] = []

        // let users = await User.query().where('created_at', 'like', month.format('YYYY-MM%')).fetch()
        let invoices = await Invoice.query()
          .whereBetween('expiration', [month.format('YYYY-MM-02'), month.add(1, 'months').format('YYYY-MM-01')])
          // .whereIn('userId', users.rows.map(u => u.id))
          .where('type', 'first')
          .where('status', 'paid')
          .with('user')
          .fetch()

        // REGISTROS
        invoices = invoices.toJSON()
        month.subtract(1, 'months')
        result.registers[month.format('YYYY-MM')].push(...invoices.map(i => i.user))

        // invoices.rows.forEach(invoice => {
        //   const usr = users.rows.find(u => u.id === invoice.userId)
        //   if (usr) result.registers[month.format('YYYY-MM')].push(usr)
        // });

        // const onlyRegister = ['2020-05', '2020-06', '2020-07', '2020-08', '2020-09'].find(m => m === month.format('YYYY-MM'))
        // if (onlyRegister) {
        //   result.registers[month.format('YYYY-MM')].push(...users.rows)
        // } else {
        //   result.registers[month.format('YYYY-MM')].push(...users.rows.filter(u => u.controls.disableInvoice))
        // }

        // MENSALIDADES

        // users = await User.query().where('created_at', 'not like', month.format('YYYY-MM%')).fetch()
        invoices = await Invoice.query()
          .where('expiration', 'like', month.format('YYYY-MM-%'))
          // .whereIn('userId', users.rows.map(u => u.id))
          .where('type', 'monthly')
          .where('status', 'paid')
          .with('user')
          .fetch()

        invoices = invoices.toJSON()
        result.mensalities[month.format('YYYY-MM')].push(...invoices.map(i => i.user))

        // users.rows.forEach(user => {
        //   const inv = invoices.rows.find(i => i.userId === user.id)
        //   if (inv) {
        //     result.mensalities[month.format('YYYY-MM')].push(user)
        //   // } else {

        //   //   const day = user.due < 10 ? `0${user.due}` : user.due
        //   //   let userDue = moment(month.format(`YYYY-MM-${day}`)).add(1, 'days')

        //   //   if (day == '31' && month.format('MM') !== '02' && moment(month.format('YYYY-MM-30')).add(1, 'days').format('DD') === '01') {
        //   //     userDue = moment(month.format('YYYY-MM-30')).add(1, 'days')
        //   //   }

        //   //   if (month.format('MM') === '02' && parseInt(userDue) > 28) {
        //   //     userDue = moment(month.format('YYYY-MM-28')).add(1, 'days')
        //   //   }

        //   //   if (user.created_at < month && month > moment('2020-10-30') && !user.controls.disableInvoice && userDue < moment()) {
        //   //     const userCanceled = allcanceleds.find(u => u.id === user.id)
        //   //     if (!userCanceled) {
        //   //       allcanceleds.push(user)
        //   //       result.canceleds[month.format('YYYY-MM')].push(user)
        //   //     }
        //   //   }
        //   }
        // });

        // UPGRADES.
        invoices = await Invoice.query()
          .where('expiration', 'like', month.format('YYYY-MM-%'))
          // .whereIn('userId', users.rows.map(u => u.id))
          .where('type', 'upgrade')
          .where('status', 'paid')
          .with('user')
          .fetch()

        invoices = invoices.toJSON()
        result.upgrades[month.format('YYYY-MM')].push(...invoices.map(i => i.user))

        // users.rows.forEach(user => {
        //   const inv = invoices.rows.find(i => i.userId === user.id)

        //   if (inv) {
        //     result.upgrades[month.format('YYYY-MM')].push(user)
        //   }
        // });

        // CANCELADOS
        invoices = await Invoice.query()
          .where('expiration', 'like', month.format('YYYY-MM-%'))
          // .whereIn('userId', users.rows.map(u => u.id))
          .where('type', 'monthly')
          .where('status', 'canceled')
          .fetch()

        invoices = invoices.toJSON()
        result.canceleds[month.format('YYYY-MM')].push(...invoices.map(i => i.user))

        // users.rows.forEach(user => {
        //   const inv = invoices.rows.find(i => i.userId === user.id)

        //   if (inv) {
        //     result.canceleds[month.format('YYYY-MM')].push(user)
        //   }
        // });

        month = month.add(1, 'months')
      }

      response.json(result)

    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async financialPaginate({ response, params }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 253, metodo: 'financialPaginate' })
      let month = moment().set("month", params.month ).subtract(12, 'months')
      const result = {
        registers: {},
        mensalities: {},
        upgrades: {},
        canceleds: {}
      }

      const allcanceleds = []

      result.registers[month.format('YYYY-MM')] = []
      result.mensalities[month.format('YYYY-MM')] = []
      result.upgrades[month.format('YYYY-MM')] = []
      result.canceleds[month.format('YYYY-MM')] = []

      // let users = await User.query().where('created_at', 'like', month.format('YYYY-MM%')).fetch()
      let invoices = await Invoice.query()
        .whereBetween('expiration', [month.format('YYYY-MM-02'), month.add(1, 'months').format('YYYY-MM-01')])
        // .whereIn('userId', users.rows.map(u => u.id))
        .where('type', 'first')
        .where('status', 'paid')
        .with('user')
        .fetch()

      // REGISTROS
      invoices = invoices.toJSON()
      month.subtract(1, 'months')
      result.registers[month.format('YYYY-MM')].push(...invoices.map(i => i.user))

      // invoices.rows.forEach(invoice => {
      //   const usr = users.rows.find(u => u.id === invoice.userId)
      //   if (usr) result.registers[month.format('YYYY-MM')].push(usr)
      // });

      // const onlyRegister = ['2020-05', '2020-06', '2020-07', '2020-08', '2020-09'].find(m => m === month.format('YYYY-MM'))
      // if (onlyRegister) {
      //   result.registers[month.format('YYYY-MM')].push(...users.rows)
      // } else {
      //   result.registers[month.format('YYYY-MM')].push(...users.rows.filter(u => u.controls.disableInvoice))
      // }

      // MENSALIDADES

      // users = await User.query().where('created_at', 'not like', month.format('YYYY-MM%')).fetch()
      invoices = await Invoice.query()
        .where('expiration', 'like', month.format('YYYY-MM-%'))
        // .whereIn('userId', users.rows.map(u => u.id))
        .where('type', 'monthly')
        .where('status', 'paid')
        .with('user')
        .fetch()

      invoices = invoices.toJSON()
      result.mensalities[month.format('YYYY-MM')].push(...invoices.map(i => i.user))

      // users.rows.forEach(user => {
      //   const inv = invoices.rows.find(i => i.userId === user.id)
      //   if (inv) {
      //     result.mensalities[month.format('YYYY-MM')].push(user)
      //   // } else {

      //   //   const day = user.due < 10 ? `0${user.due}` : user.due
      //   //   let userDue = moment(month.format(`YYYY-MM-${day}`)).add(1, 'days')

      //   //   if (day == '31' && month.format('MM') !== '02' && moment(month.format('YYYY-MM-30')).add(1, 'days').format('DD') === '01') {
      //   //     userDue = moment(month.format('YYYY-MM-30')).add(1, 'days')
      //   //   }

      //   //   if (month.format('MM') === '02' && parseInt(userDue) > 28) {
      //   //     userDue = moment(month.format('YYYY-MM-28')).add(1, 'days')
      //   //   }

      //   //   if (user.created_at < month && month > moment('2020-10-30') && !user.controls.disableInvoice && userDue < moment()) {
      //   //     const userCanceled = allcanceleds.find(u => u.id === user.id)
      //   //     if (!userCanceled) {
      //   //       allcanceleds.push(user)
      //   //       result.canceleds[month.format('YYYY-MM')].push(user)
      //   //     }
      //   //   }
      //   }
      // });

      // UPGRADES.
      invoices = await Invoice.query()
        .where('expiration', 'like', month.format('YYYY-MM-%'))
        // .whereIn('userId', users.rows.map(u => u.id))
        .where('type', 'upgrade')
        .where('status', 'paid')
        .with('user')
        .fetch()

      invoices = invoices.toJSON()
      result.upgrades[month.format('YYYY-MM')].push(...invoices.map(i => i.user))

      // users.rows.forEach(user => {
      //   const inv = invoices.rows.find(i => i.userId === user.id)

      //   if (inv) {
      //     result.upgrades[month.format('YYYY-MM')].push(user)
      //   }
      // });

      // CANCELADOS
      invoices = await Invoice.query()
        .where('expiration', 'like', month.format('YYYY-MM-%'))
        // .whereIn('userId', users.rows.map(u => u.id))
        .where('type', 'monthly')
        .where('status', 'canceled')
        .fetch()

      invoices = invoices.toJSON()
      result.canceleds[month.format('YYYY-MM')].push(...invoices.map(i => i.user))

      // users.rows.forEach(user => {
      //   const inv = invoices.rows.find(i => i.userId === user.id)

      //   if (inv) {
      //     result.canceleds[month.format('YYYY-MM')].push(user)
      //   }
      // });

      response.json(result)

    } catch (error) {
      console.error(error)
      throw error
    }
  }


  async financialIndex({ auth, response, view }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 224, metodo: 'financialIndex' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      return response.send(
        view.render('inner.adm.reports.financial', {
          profile: profile ? profile.toJSON() : null
        })
      )
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getSupport({ response }) {
    try {

      console.log('Starting: ', { controller: 'ReportController', linha: 242, metodo: 'getSupport' })
      const users = await UserController.getAllSupportUsers()

      const reportComplete = []

      if (users) {

        for (let user of users.rows) {

          const support = user.toJSON()
          support.report = {}

          let month = moment().subtract(6, 'months')

          const allcanceleds = []

          while (month.format('YYYY-MM') !== moment().add(1, 'months').format('YYYY-MM')) {

            support.report[month.format('YYYY-MM')] = {
              paids: [],
              paidLates: [],
              canceleds: []
            }

            const paids = await BonusSupport.query().where('created_at', 'like', month.format('YYYY-MM%')).where({ supportId: user.id, status: 'paid' }).fetch()
            const paidLates = await BonusSupport.query().where('created_at', 'like', month.format('YYYY-MM%')).where({ supportId: user.id, status: 'paidLate' }).fetch()
            const canceleds = await BonusSupport.query().where('created_at', 'like', month.format('YYYY-MM%')).where({ supportId: user.id, status: 'canceled' }).fetch()

            if (paids && paids.rows.length > 0) {
              support.report[month.format('YYYY-MM')].paids = (await User.query().whereIn('id', paids.rows.map(bonus => bonus.userId)).with('plans').fetch()).toJSON()
            }

            if (paidLates && paidLates.rows.length > 0) {
              support.report[month.format('YYYY-MM')].paidLates = (await User.query().whereIn('id', paidLates.rows.map(bonus => bonus.userId)).with('plans').fetch()).toJSON()
            }

            if (canceleds && canceleds.rows.length > 0) {
              support.report[month.format('YYYY-MM')].canceleds = (await User.query().whereIn('id', canceleds.rows.map(bonus => bonus.userId)).with('plans').fetch()).toJSON()
            }

            month = month.add(1, 'months')

          }

          reportComplete.push(support)

        }

      }

      return response.json(reportComplete)

    } catch (error) {
      console.error(error)
      throw error
    }

  }

  async getSupportPage({ auth, response, view }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 303, metodo: 'getSupportPage' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()

      if (user.controls.type === 'adm' || user.controls.type === 'support') {
        return response.send(

          view.render('inner.adm.reports.supportBonus', {
            profile: profile ? profile.toJSON() : null
          })

        )

      } else {
        response.status(403)
        return response.json({
          code: '403-259',
          message: 'Access Deny'
        })
      }

    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async reportWeekWithOuRequest({ auth, response, params }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 332, metodo: 'reportWeekWithOuRequest' })
      const user = await auth.getUser()
      let clients;
      const relUnrequests = []

      switch (user.controls.type) {
        case 'adm':
          clients = await User.query().where('created_at', '>=', moment().subtract(3, 'month').format()).with('profile').with('support').with('seller').fetch()

          for (let client of clients.rows) {

            const cl = client.toJSON()

            if (cl.profile && cl.profile.status) {

              const totalRequests = await Request.query().where('profileId', cl.profile.id).whereBetween('created_at', [moment().subtract(7, 'days').format('YYYY-MM-DD'), moment().format()]).getCount()

              if (totalRequests == 0) {
                cl.profile.totalRequests = totalRequests
                relUnrequests.push(cl)
              }

            }
          }
          break;

        case 'support':

          clients = await User.query().where('supportId', user.id).where('created_at', '>=', moment().subtract(3, 'month').format()).with('profile').with('support').with('seller').fetch()

          for (let client of clients.rows) {

            const cl = client.toJSON()

            if (cl.profile && cl.profile.status) {

              const totalRequests = await Request.query().where('profileId', cl.profile.id).whereBetween('created_at', [moment().subtract(7, 'days').format('YYYY-MM-DD'), moment().format()]).getCount()

              if (totalRequests == 0) {
                cl.profile.totalRequests = totalRequests
                relUnrequests.push(cl)
              }

            }
          }
          break;

        default:
          clients = []
          break;
      }

      return response.json(relUnrequests)

    } catch (error) {
      console.error(error)
      throw error
    }
  }

}

module.exports = ReportController
