'use strict'
const Database = use('Database')
const moment = use('moment')
const Fee = use('App/Models/ReadOnly/Fee')
const Client = use('App/Models/ReadOnly/Client')
const Cart = use('App/Models/ReadOnly/Cart')
const User = use('App/Models/ReadOnly/User')
const { DateTime } = require('luxon')

class ReportController {
  transformTableObject(tableOpened, table) {
    let perm = DateTime.fromSQL(tableOpened.updated_at)
      .diff(DateTime.fromSQL(tableOpened.created_at), ['months', 'days', 'hours', 'minutes'])
      .toObject()
    tableOpened.table_name = !table.deleted_at ? table.name : table.name.replace(table.name.substring(table.name.length - 25), ' Desativada')
    tableOpened.total = tableOpened.commands.reduce((total, command) => {
      let total_carts = command.carts.reduce((total_carts, cart) => {
        if (cart.status === 'canceled') {
          return total_carts
        }
        return total_carts + cart.total
      }, 0)
      let feeResult = 0
      if (command.fees.length > 0) {
        feeResult = command.fees.reduce((feeResult, fee) => {
          if (fee.status === 1 && fee.automatic === 1) {
            if (fee.type === 'percent') {
              feeResult += (total_carts / 100) * fee.value
            } else {
              feeResult += fee.value * fee.quantity
            }
          }
          return feeResult
        }, 0)
      }

      return total + total_carts + feeResult
    }, 0)
    tableOpened.perm = `${parseInt(perm.hours)}h${parseInt(perm.minutes)}`
    tableOpened.formsPaymentLabel = Array.from(new Set(tableOpened.formsPayment.map((formPayment) => formPayment.label)))

    return tableOpened
  }

  cupomValue(cart) {
    let value = 0

    if (cart.cupomId && cart.cupom.type === 'value') {
      value = cart.cupom.value
    } else if (cart.cupomId && cart.cupom.type === 'percent') {
      value = (cart.total * cart.cupom.value) / 100
    }

    return value
  }

  whereFilterCondition(query, filter) {
    if (!filter || filter === 'delivery') {
      return query.where('type', '=', 'D')
    }
    if (filter === 'table') {
      return query.where('type', '=', 'T')
    }
    if (filter === 'package') {
      return query.where('type', '=', 'P')
    }
  }

  wherePaymentCondition(query, payment) {
    // alterar
    if (payment && payment !== 'any') {
      return query.whereRaw(`JSON_CONTAINS (formsPayment,'{ "label" : "${payment}"}')`)
    }
    return query
  }

  whereDateCondition(query, { date, columnDate, timeZone }) {
    if (!columnDate) {
      columnDate = 'created_at'
    }

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

    if (date) {
      return query.whereRaw(`CONVERT_TZ(${columnDate},'-03:00','${fuso.hour}') LIKE '${date}%'`)
    } else {
      return query.whereRaw(`CONVERT_TZ(${columnDate},'-03:00','${fuso.hour}') LIKE '${moment().format('YYYY-MM-DD')}%'`)
    }
  }

  async report({ auth, response, view }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 57, metodo: 'report' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      // const monthly =  await Database
      //                         .select(
      //                           'date(created_at) as dateSale',
      //                           ' sum(total) as total'
      //                         )
      //                         .from('requests')
      //                         .where('profileId', profile.id)
      //                         .where('status', '<>', 'canceled')
      //                         .orWhereNull('status')
      //                         .whereBetween(
      //                           'created_at',
      //                           [
      //                             DateTime.local().minus({day: 30}).toFormat('yyyy-MM-dd'),
      //                             DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      //                           ]
      //                         )
      //                         .groupBy('dateSale')
      const monthly = await Database.raw(
        `select date(created_at) as dateSale, sum(total) as total from carts where (status <> 'canceled' || status is null) and profileId = ${profile.id} and created_at between (now() - interval 30 day) and now() group by dateSale`
      )
      const yearly = await Database.raw(
        `select DATE_FORMAT(created_at, '%Y-%m') as dateSale, sum(total) as total from carts where (status <> 'canceled' || status is null) and profileId = ${profile.id} and created_at between (now() - interval 12 month) and now() group by dateSale`
      )
      // const cupons = await  profile.requests()
      //                         .setHidden(['cart', 'cartPizza', 'deliveryAddress'])
      //                         .whereNotNull('cupomId')
      //                         .where('status', '<>', 'canceled')
      //                         .orWhereNull('status')
      //                         .whereBetween(
      //                           'created_at',
      //                           [
      //                             DateTime.local().minus({day: 30}).toFormat('yyyy-MM-dd'),
      //                             DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss')
      //                           ]
      //                         )
      //                         .with('cupom')
      //                         .on('query', console.log)
      //                         .fetch()

      // const ydatesDistinct = [... new Set(yearly[0].map(y => moment(y.dateSale).format('YYYY-MM')))]
      // let ydatesDistinctValues = []
      // ydatesDistinct.forEach(ym => {
      //   const vl = yearly[0].filter(y => moment(y.dateSale).format('YYYY-MM') === ym).reduce((a, b) => a + b.total, 0)
      //   ydatesDistinctValues.push(vl)
      // })

      return response.json({
        monthly: {
          dates: monthly[0].map((m) => moment(m.dateSale).format('DD-MM-YYYY')),
          values: monthly[0].map((m) => m.total),
        },
        yearly: {
          dates: yearly[0].map((d) => d.dateSale),
          values: yearly[0].map((d) => d.total),
        },
      })
    } catch (error) {
      console.error({
        date: new Date(),
        error: { relatorio: error },
      })
      response.status(500)
      response.send(error)
    }
  }

  async daily({ request, auth, response, params }) {
    try {
      // return response.json({message: 'temporariamente fora do ar'});
      console.log('Starting: ', { controller: 'ReportController', linha: 92, metodo: 'daily' })
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const fees = await Fee.query().where('profileId', profile.id).where('status', 1).fetch()
      profile.fees = fees.toJSON()
      let { date, payment, filter, columnDate } = request.all()
      let tables, haveTables, carts
      const { timeZone } = profile

      // Pedidos (Delivery/Encomendas)
      if (filter !== 'table') {
        // if (payment) {
        //   payment = payment.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        // }

        carts = await profile
          .carts()
          .where((query) => this.whereFilterCondition(query, filter)) // TIPO DE PEDIDO
          .where((query) => this.wherePaymentCondition(query, payment))
          .where((query) => this.whereDateCondition(query, { date, columnDate, timeZone }))
          .with('cupom')
          .with('itens')
          .with('client', (qClient) => qClient.setHidden(['last_requests']))
          .with('address')
          .with('bartender')
          .with('cashier', (qCashier) => {
            qCashier.setHidden(['transactions', 'closedValues_system'])
          })
          .paginate(params.page, 50)
        carts = carts.toJSON()
      }

      // Mesas
      if (filter === 'table') {
        tables = await profile
          .tables()
          .has('tablesOpened')
          .with('tablesOpened', (query) => {
            return query
              .where((query) => {
                if (payment !== 'any') {
                  return query.where('formsPayment', 'like', `%${payment}%`).where('status', 0).where('created_at', 'like', `${date}%`)
                } else {
                  return query.where('status', 0).where('created_at', 'like', `${date}%`)
                }
              })
              .with('commands', (query) => {
                return query
                  .where((query) => {
                    // if (date) {
                    //   return query.where('created_at', 'like', `${date}%`)
                    // }
                    return query
                  })
                  .with('carts', (query) => {
                    return query.with('cupom').with('itens').with('client').with('bartender').with('cashier')
                  })
              })
          })
          .paginate(params.page, 50)
        tables = tables.toJSON()
      }

      if (filter === 'package') {
        carts.data.forEach((cart) => {
          cart.packageDate = cart.packageDate && DateTime.fromJSDate(new Date(cart.packageDate)).toSQL()
        })
      }

      response.json({
        carts,
        tables,
        DateTime,
        filter,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async monthly({ request, auth, response, params }) {
    try {
      console.log('Starting: ', { controller: 'ReportController', linha: 195, metodo: 'monthly' })
      let { month, year, payment, filter, columnDate } = request.all()
      console.log({ month, year, payment, filter, columnDate })

      if (!columnDate) {
        columnDate = 'created_at'
      }
      if (!payment) {
        payment = 'any'
      } else {
        if (filter !== 'table') {
          // payment = payment.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        }
      }

      if (!year) {
        year = moment([]).year()
      }

      if (!month) {
        month = moment([]).month() + 1
      }

      const date = moment(new Date(`${year}-${month}-01T03:00:00.000Z`)).format('YYYY-MM-DD')

      const whereFilterCondition = (query) => {
        if (!filter || filter === 'delivery') {
          return query.where('type', '=', 'D')
        } else if (filter === 'table') {
          return query.where('type', '=', 'T')
        } else if (filter === 'package') {
          return query.where('type', '=', 'P')
        }
      }
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const fees = await Fee.query().where('profileId', profile.id).where('status', 1).fetch()
      profile.fees = fees.toJSON()
      let carts, tables

      // Pedidos (Delivery/Encomendas)
      if (filter !== 'table') {
        let fuso = { hour: '-03:00', zone: 'UTC-3' }
        switch (profile.timeZone) {
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

        carts = await profile
          .carts()
          .where((query) => {
            if (payment !== 'any') {
              if (month && year) {
                return query
                  .whereRaw(`CONVERT_TZ(${columnDate},'-03:00','${fuso.hour}') LIKE '${year}-${month}%'`)
                  .where('formsPayment', 'like', `%${payment}%`)
              } else {
                return query
                  .whereRaw(`CONVERT_TZ(${columnDate},'-03:00','${fuso.hour}') LIKE '${moment().format('YYYY-MM')}%'`)
                  .where('formsPayment', 'like', `%${payment}%`)
              }
            } else {
              if (month && year) {
                return query.whereRaw(`CONVERT_TZ(${columnDate},'-03:00','${fuso.hour}') LIKE '${year}-${month}%'`)
              } else {
                return query.whereRaw(`CONVERT_TZ(${columnDate},'-03:00','${fuso.hour}') LIKE '${moment().format('YYYY-MM')}%'`)
              }
            }
          })
          .where((query) => whereFilterCondition(query))
          .with('cupom')
          .with('itens')
          .with('client', (qClient) => qClient.setHidden(['last_requests']))
          .with('address')
          .with('bartender')
          .with('cashier', (qCashier) => {
            qCashier.setHidden(['transactions', 'closedValues_system'])
          })
          .paginate(params.page, 50)
      }

      // Mesas
      if (filter === 'table') {
        tables = await profile
          .tables()
          .has('tablesOpened')
          .with('tablesOpened', (query) => {
            return query
              .where((query) => {
                if (payment !== 'any') {
                  return query
                    .where('formsPayment', 'like', `%${payment}%`)
                    .where('status', 0)
                    .whereBetween('created_at', [date, moment(date).add(1, 'month').format('YYYY-MM-DD')])
                } else {
                  return query.where('status', 0).whereBetween('created_at', [date, moment(date).add(1, 'month').format('YYYY-MM-DD')])
                }
              })
              .with('commands', (query) => {
                return query
                  .from('commands')
                  .where((query) => {
                    if (month && year) {
                      return query.whereBetween('created_at', [date, moment(date).add(1, 'month').format('YYYY-MM-DD')])
                    } else {
                      return query.whereBetween('created_at', [moment().format('YYYY-MM-DD'), moment().add(1, 'month').format('YYYY-MM-DD')])
                    }
                  })
                  .with('carts', (query) => {
                    return query.with('itens').where('type', 'T')
                  })
              })
          })
          .paginate(params.page, 50)

        tables = tables.toJSON()
      }

      // Anos
      const years = []
      const userCreated = moment(new Date(user.created_at))

      while (userCreated.diff(moment([]), 'year') !== 1) {
        if (userCreated.year() > moment([]).year()) {
          break
        }
        years.push(userCreated.year())
        userCreated.add({ years: 1 })
      }

      if (filter === 'package') {
        carts.rows.forEach((crt) => {
          crt.packageDate = DateTime.fromJSDate(new Date(crt.packageDate)).toSQL()

          console.log(crt.packageDate)
        })
      }
      response.json({
        years,
        carts,
        tables,
        DateTime,
        filter,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async resume({ request, auth, response }) {
    console.log('Starting: ', { controller: 'ReportController', linha: 482, metodo: 'resume' })
    try {
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const bartenders = await profile.bartenders().fetch()
      const cupons = await profile.cupons().fetch()
      const fees = await Fee.query().where('profileId', profile.id).where('status', 1).fetch()
      profile.fees = fees.toJSON()

      const formsPaymentResume = {}
      const bartendersResume = {}
      const cuponsResume = {}
      const feesResume = {}

      profile.formsPayment.forEach((formPayment) => {
        formsPaymentResume[formPayment.label] = 0
      })

      bartenders.rows.forEach((bartender) => {
        bartendersResume[bartender.id] = 0
      })

      cupons.rows.forEach((cupon) => {
        const { code, deleted_at, type } = cupon
        cuponsResume[cupon.id] = { value: 0, code, deleted_at, type }
      })

      let { type, filter, payment, date, month, year, columnDate } = request.all()

      let resume, haveTables
      const allFees = []

      if (!payment) {
        payment = 'any'
      }

      if (!year) {
        year = moment([]).year()
      }

      if (!month) {
        month = moment([]).month() + 1
      }

      if (type === 'monthly') {
        date = moment(new Date(`${year}-${month}-01T03:00:00.000Z`)).format('YYYY-MM-DD')
      }
      // Resumo Dia
      if (type === 'daily') {
        resume =
          filter !== 'table'
            ? await profile
                .carts()
                .where((query) => this.whereFilterCondition(query, filter))
                .where((query) => this.whereDateCondition(query, { date, columnDate, timeZone: profile.timeZone }))
                .where((query) => this.wherePaymentCondition(query, payment))
                .with('cupom', (query) => {
                  return query.setVisible(['id', 'code', 'value', 'type'])
                })
                .setVisible(['status', 'total', 'taxDelivery', 'type', 'addressId', 'formsPayment'])
                .fetch()
            : await profile
                .tables()
                .with('tablesOpened', (query) => {
                  return query
                    .where((query) => {
                      if (payment !== 'any') {
                        return query.where('formsPayment', 'like', `%${payment}%`).where('status', 0).where('created_at', 'like', `${date}%`)
                      } else {
                        return query.where('status', 0).where('created_at', 'like', `${date}%`)
                      }
                    })
                    .with('commands', (query) => {
                      return query
                        .where((query) => {
                          if (date) {
                            return query.where('created_at', 'like', `${date}%`)
                          }
                          return query
                        })
                        .with('carts', (query) => {
                          return query.setVisible(['status', 'total', 'taxDelivery', 'type', 'bartenderId']).with('cupom', (query) => {
                            return query.setVisible(['id', 'code', 'value', 'type'])
                          })
                        })
                        .setVisible(['carts', 'fees', 'formsPayment'])
                    })
                    .setVisible(['commands', 'formsPayment', 'id', 'created_at'])
                })
                .setVisible(['tablesOpened'])
                .fetch()
        resume = resume.toJSON()

        if (filter === 'table') {
          haveTables = resume.some((table) => table.tablesOpened.length > 0)

          resume.allCarts = []
          for (let table of resume) {
            let allCarts = table.tablesOpened.reduce((allCarts, tableOpened) => {
              this.formsPaymentReducer(tableOpened, formsPaymentResume)
              if (tableOpened.commands.length) {
                tableOpened.commands.forEach((command) => {
                  this.feeReducer(command, feesResume)
                  allCarts = allCarts.concat(command.carts)
                })
              }
              return allCarts
            }, [])

            resume.allCarts = resume.allCarts.concat(allCarts)
          }
          resume.allCarts.forEach((cart) => {
            this.bartendersReducer(cart, bartendersResume)
          })
        }
      }

      // Resumo Mês
      if (type === 'monthly') {
        resume =
          filter !== 'table'
            ? await profile
                .carts()
                .where((query) => {
                  if (payment !== 'any') {
                    if (month && year) {
                      return query.where('created_at', 'like', `${year}-${month}%`)
                      // .where('formPayment', payment)
                    } else {
                      return query.where('created_at', 'like', `${moment([]).format('YYYY-MM')}%`)
                      // .where('formPayment', payment)
                    }
                  } else {
                    if (month && year) {
                      return query.where('created_at', 'like', `${year}-${month}%`)
                    } else {
                      return query.where('created_at', 'like', `${moment([]).format('YYYY-MM')}%`)
                    }
                  }
                })
                .where((query) => this.whereFilterCondition(query, filter))
                .with('cupom', (query) => {
                  return query.setVisible(['id', 'code', 'value', 'type'])
                })
                .setVisible(['status', 'total', 'taxDelivery', 'type', 'addressId', 'formsPayment'])
                .fetch()
            : await profile
                .tables()
                .with('tablesOpened', (query) => {
                  return query
                    .where((query) => {
                      if (payment !== 'any') {
                        return query.where('formsPayment', 'like', `%${payment}%`).where('status', 0).where('created_at', 'like', `${year}-${month}%`)
                      } else {
                        return query.where('status', 0).where('created_at', 'like', `${year}-${month}%`)
                      }
                    })
                    .with('commands', (query) => {
                      return query
                        .from('commands')
                        .where((query) => {
                          const finalDate = moment(new Date(`${year}-${month}-31T23:59:59.000Z`))
                            .set({ hours: 23, minutes: 59, seconds: 59 })
                            .format('YYYY-MM-DD HH:mm:ss')
                          if (month && year) {
                            return query.whereBetween('created_at', [date, finalDate])
                          } else {
                            return query.whereBetween('created_at', [moment().format('YYYY-MM-DD'), moment().add(1, 'month').format('YYYY-MM-DD')])
                          }
                        })
                        .with('carts', (query) => {
                          return query
                            .where('profileId', profile.id)
                            .where('type', 'T')
                            .setVisible(['status', 'total', 'taxDelivery', 'type', 'bartenderId'])
                        })
                        .setVisible(['carts', 'fees'])
                    })
                    .setVisible(['commands', 'formsPayment'])
                })
                .setVisible(['tablesOpened'])
                .fetch()

        resume = resume.toJSON()

        if (filter === 'table') {
          resume.allCarts = []

          for (let table of resume) {
            let allCarts = table.tablesOpened.reduce((allCarts, tableOpened) => {
              this.formsPaymentReducer(tableOpened, formsPaymentResume)
              if (tableOpened.commands.length) {
                tableOpened.commands.forEach((command) => {
                  allCarts = allCarts.concat(command.carts)
                  this.feeReducer(command, feesResume)
                })
              }
              return allCarts
            }, [])

            resume.allCarts = resume.allCarts.concat(allCarts)
          }
          resume.allCarts.forEach((cart) => {
            this.bartendersReducer(cart, bartendersResume)
          })
        }
      }

      if (filter === 'delivery') {
        if (resume) {
          resume.forEach((r) => {
            if (r.cupom && r.status !== 'canceled') {
              switch (r.cupom.type) {
                case 'value':
                  cuponsResume[r.cupom.id].value += r.cupom.value
                  break
                case 'percent':
                  cuponsResume[r.cupom.id].value += (r.total / 100) * r.cupom.value
                  break
                case 'freight':
                  cuponsResume[r.cupom.id].value += r.taxDelivery ? r.taxDelivery : 0
                  break
                default:
                  break
              }
            }
          })
        }
      }

      let canceledCount, canceledTotal, count, total, feeTotal, totalCarts, totalTaxDelivery, countDelivery, cashbackTotal

      cashbackTotal = 0

      if (resume) {
        canceledCount =
          filter === 'table'
            ? resume.allCarts.filter((cart) => cart.status === 'canceled').length
            : resume.filter((cart) => cart.status === 'canceled').length
        canceledTotal =
          filter === 'table'
            ? resume.allCarts.filter((cart) => cart.status === 'canceled').reduce((a, b) => a + b.total, 0)
            : resume
                .filter((cart) => cart.status === 'canceled')
                .reduce((a, b) => a + (b.total - this.cupomValue(b) + (b.taxDelivery > 0 ? b.taxDelivery : 0)), 0)
        count =
          filter === 'table'
            ? resume.allCarts.filter((cart) => cart.status !== 'canceled').length
            : resume.filter((cart) => cart.status !== 'canceled').length
        total =
          filter === 'table'
            ? this.getTotal(resume.allCarts)
            : resume
                .filter((cart) => cart.status !== 'canceled')
                .reduce((a, b) => a + (b.total - this.cupomValue(b) + (b.addressId && b.taxDelivery > 0 ? b.taxDelivery : 0)), 0)
        cashbackTotal =
          filter === 'table'
            ? 0
            : resume
                .filter((cart) => cart.status !== 'canceled')
                .reduce((a, b) => b.formsPayment.filter((f) => f.payment === 'cashback').reduce((a, b) => a + b.value, 0), 0)
        feeTotal = filter === 'table' ? Object.values(feesResume).reduce((feeTotal, value) => (feeTotal += value), 0) : 0
        totalCarts =
          filter === 'table'
            ? resume.allCarts.filter((cart) => cart.status !== 'canceled').reduce((a, b) => a + b.total, 0)
            : resume.filter((cart) => cart.status !== 'canceled').reduce((a, b) => a + (b.total - this.cupomValue(b)), 0)
        totalTaxDelivery = resume
          .filter((cart) => cart.status !== 'canceled' && cart.addressId)
          .reduce((a, b) => a + (b.taxDelivery > 0 ? b.taxDelivery : 0), 0)
        countDelivery = resume.filter((cart) => cart.status !== 'canceled' && cart.addressId).length
      }

      return response.json({
        canceledCount,
        canceledTotal,
        count,
        total,
        feeTotal,
        totalCarts,
        totalTaxDelivery,
        countDelivery,
        feesResume,
        formsPaymentResume,
        bartendersResume,
        cuponsResume,
        cashbackTotal,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  getTotalFees(allFees, total) {
    return allFees.reduce((acc, fee) => {
      if (fee.type === 'fixed') {
        acc += fee.quantity * fee.value
      } else {
        acc += total * (fee.value / 100)
      }

      return acc
    }, 0)
  }

  getTotal(allCarts) {
    if (Array.isArray(allCarts)) {
      return allCarts.reduce((acc, cart) => (cart.status !== 'canceled' ? acc + cart.total : acc + 0), 0)
    }
    return 0
  }

  feeReducer(command, feesResume) {
    if (command.fees.length) {
      Object.entries(command.fees).forEach(([key, fee]) => {
        if (!feesResume[fee.code]) {
          feesResume[fee.code] = 0
        }
        if (fee.automatic && fee.status) {
          if (fee.type === 'percent') {
            feesResume[fee.code] += command.carts
              .filter((c) => c.status !== 'canceled')
              .reduce((total, cart) => (total += (cart.total / 100) * fee.value), 0)
          } else {
            feesResume[fee.code] += fee.value * fee.quantity
          }
        }
      })
    }
  }
  formsPaymentReducer(tableOpened, formsPaymentResume) {
    tableOpened.formsPayment.forEach((formPayment) => {
      formsPaymentResume[formPayment.label] += formPayment.value
    })
  }
  bartendersReducer(cart, bartendersResume) {
    if (cart.bartenderId && cart.status !== 'canceled') {
      bartendersResume[cart.bartenderId] += cart.total
    }
  }

  async cashiers({ auth, request, response }) {
    try {
      const user = await User.find(auth.user.id)
      const { date, filter } = request.all()
      let format
      switch (filter) {
        case 'daily':
          format = 'yyyy-MM-dd'
          break
        case 'monthly':
          format = 'yyyy-MM'
          break
        default:
          format = 'yyyy-MM'
          break
      }

      const profile = await user
        .profile()
        .setVisible([])
        .with('bartenders', (bartender) => {
          return bartender.whereNull('deleted_at').with('cashiers', (cashier) => {
            return cashier
              .where('created_at', 'like', `%${date ? DateTime.fromISO(date).toFormat(format) : DateTime.local().toFormat(format)}%`)
              .with('carts')
          })
        })
        .fetch()
      const { bartenders } = profile.toJSON()

      // bartenders.forEach(bartender => {
      //   bartender.cashiers = bartender.cashiers.map(cashier => {
      //     const { allCarts, ...rest } = cashier
      //     return { ...rest, carts: allCarts }
      //   })
      // })

      return response.json({ bartenders })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async findClients({ auth, request, response }) {
    try {
      const { search, type } = request.all()
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()

      let clients

      switch (type) {
        case 'whatsapp':
          clients = await profile
            .clients()
            .where({ [type]: search })
            .first()
          break
        case 'name':
          clients = await profile.clients().where(type, 'like', `%${search}%`).fetch()
          break
      }

      if (!clients) {
        return response.status(404).json({ message: 'Nenhum cliente encontrado' })
      }

      return response.json({ clients })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async clients({ auth, params, request, response }) {
    try {
      const { page } = params
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const clients = await profile.clients().paginate(page, 30)
      return response.json(clients)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async clientCarts({ auth, params, request, response }) {
    try {
      const { page } = params
      const { clientId } = request.all()
      const carts = await Cart.query().where({ clientId }).paginate(page, 30)
      return response.json({ carts })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async top10({ auth, response }) {
    try {
      const user = await User.find(auth.user.id)
      const profile = await user.profile().fetch()
      const clientsMaxTotal = await profile.clients().orderByRaw("JSON_EXTRACT(controls, '$.requests.total') DESC").limit(10).fetch()
      const clientsMaxQuantity = await profile.clients().orderByRaw("JSON_EXTRACT(controls, '$.requests.quantity') DESC").limit(10).fetch()

      return response.json({ clientsMaxTotal, clientsMaxQuantity })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = ReportController
