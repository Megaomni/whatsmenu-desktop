'use strict'

// mesas
const Table = use('App/Models/Table')
const TableOpened = use('App/Models/TableOpened')
const Command = use('App/Models/Command')
const Profile = use('App/Models/Profile')
const Fee = use('App/Models/Fee')
const Cashier = use('App/Models/Cashier')
const Ws = use('Ws')
const moment = require("moment")
const axios = require('axios')
const { DateTime } = require('luxon')


class TableController {

  async create({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 17, metodo: 'create' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf'])

      const prof = profile.toJSON()
      data.profileId = prof.id

      const alreadyHave = await Table.query().where('profileId', data.profileId).where('name', data.name).first()

      if (alreadyHave) {
        return response.status(400).send('Esse nome ja está sendo utilizado por outra mesa')
      }

      const table = await Table.create(data)

      return response.json(table)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async update({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 42, metodo: 'update' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf'])

      const alreadyHave = await Table.query().where('profileId', profile.id).where('name', data.name).first()

      if (alreadyHave) {
        return response.status(400).send('Esse nome ja está sendo utilizado por outra mesa')
      }

      const table = await Table.find(data.id)

      delete data.id

      table.merge(data)
      await table.save()


      return response.json(table)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async delete({ request, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 70, metodo: 'delete' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const data = request.except(['_csrf'])

      const table = await Table.find(data.id)

      table.deleted_at = moment().format()
      table.name += table.deleted_at
      table.status = 0

      await table.save()

      let tables = await profile.tables().fetch()
      tables = tables.toJSON()
      tables = tables.filter(table => table.status === 1 && table.deleted_at === null)

      return response.json(tables)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getTables({ request, response, auth, params }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 96, metodo: 'getTables' })
      let profile, user;
      if (!params.profileId) {
        user = await auth.getUser()
        profile = await user.profile().fetch()
      } else {
        profile = await Profile.find(params.profileId)
      }

      if (!profile) {
        return response.json([])
      }

      let tables = await profile.tables().where('deleted_at', null).with('tablesOpened', query => {
        return query
          .whereBetween('updated_at', [
            moment().subtract(DateTime.local().ts > DateTime.fromObject({ hour: 4, minute: 0 }).ts ? 0 : 1, 'days').format('YYYY-MM-DD'),
            moment().add(1, 'days').format('YYYY-MM-DD')
          ])
          .where('status', 0)
          .with('commands', query => {
            return query.with('carts', (query) => {
              return query.where('type', 'T')
            })
          })
      }).fetch()

      tables = tables.toJSON()

      for (const table of tables) {
        const openedResult = await TableOpened.query().where('tableId', table.id).where('status', 1).with('commands', query => {
          return query.with('carts', (query) => {
            return query.where('type', 'T')
          })
        }).first()
        if (openedResult) {
          table.opened = openedResult.toJSON()
        }
      }

      return response.json(tables)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getTable({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 137, metodo: 'getTable' })
      let table = await Table.query().where('id', params.tableId)
        .with('opened', (openedQuery) => openedQuery.with('commands', commandQuery => commandQuery.with('carts', (cartsQuery) => cartsQuery.where('type', 'T').with('itens'))))
        .first()
      return response.json(table)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getTableByCommand({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 190, metodo: 'getTableByCommand' })
      const command = await Command.find(params.commandId)
      const table = await command.opened().with('commands.carts').fetch()
      const tableMaster = await Table.find(table.tableId)
      table.name = tableMaster.name

      return response.json(table)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  // async getTableById({ params, response }) {
  //   try {
  //     console.log('Starting: ', { controller: 'TableController', linha: 117, metodo: 'getTableById' })
  //     const table = await Table.query().where('id', params.tableId).with('commands.carts').fetch()
  //     return response.json(table.rows[0])
  //   } catch (error) {
  //     console.error(error)
  //     throw error
  //   }
  // }

  // async getCommands({ params, response }) {
  //   try {
  //     console.log('Starting: ', { controller: 'TableController', linha: 128, metodo: 'getCommands' })
  //     const table = await Table.find(params.tableId)
  //     const commands = await table.commands().with('carts').fetch()
  //     return response.json(commands)
  //   } catch (error) {
  //     console.error(error)
  //     throw error
  //   }

  // }

  async changeStatus({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 229, metodo: 'changeStatus' })
      const table = await Table.query().where({ id: params.id }).with('profile').first()
      const { profile } = table.toJSON()

      table.status = table.status ? false : true

      await table.save()

      const topic = Ws.getChannel('command:*').topic(`command:${profile.slug}`)

      if (topic) {
        topic.broadcast(`command:${profile.slug}`, { commandsWs: [], tableId: table.id, tableStatus: table.status })
      }

      return response.json(table)
    } catch (error) {
      console.error(error)
    }
  }

  async settings({ auth, response, view }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 224, metodo: 'settings' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const fees = await Fee.query().where('profileId', profile.id).where('deleted_at', null).fetch()
      const prof = profile.toJSON()
      prof.fees = fees.toJSON()

      return response.send(
        view.render('inner.settings.table', {
          profile: prof,
          profileSettings: JSON.stringify(prof)
        })
      )
    } catch (error) {
      console.error(error);
      throw error
    }
  }

  // async closeAllTableCommands({ request, response, auth }) {
  //   try {
  //     console.log('Starting: ', { controller: 'TableController', linha: 265, metodo: 'closeAllTableCommands' })
  //     const user = await auth.getUser()
  //     const profile = await user.profile().fetch()
  //     let { tableId, fees, formsPayment } = request.all()

  //     if (!tableId) {
  //       return response.status(500).json({ message: "tableId não foi definido" })
  //     }

  //     const opened = await TableOpened.query().where('id', tableId).first()
  //     const table = await opened.table().fetch()
  //     const commands = await Command.query().where('tableOpenedId', tableId).with('carts').fetch()

  //     const commandsFormsPayment = commands.rows.reduce((commandsFormsPayment, command) => {
  //       return commandsFormsPayment.concat(command.formsPayment)
  //     }, [])

  //     // formsPayment = formsPayment.concat(commandsFormsPayment)

  //     for (const command of commands.rows) {
  //       command.status = 0
  //       await command.save()
  //     }

  //     opened.status = 0
  //     opened.fees = fees
  //     opened.formsPayment = opened.formsPayment.concat(formsPayment)
  //     await opened.save()

  //     await axios.post(`https://rt2.whatsmenu.com.br/tableCommandsToRt2`, { commandsWs: [{ ...commands.toJSON()[0] }], finish: 'table', slug: profile.slug })

  //     const topic = Ws.getChannel('command:*').topic(`command:${profile.slug}`)

  //     if (topic) {
  //       topic.broadcast(`command:${profile.slug}`, { commandsWs: [{ ...commands.toJSON()[0] }], finish: 'table' })
  //     }

  //     table.opened = opened.toJSON()

  //     return response.json(table)

  //   } catch (error) {
  //     console.error(error);
  //     throw error
  //   }
  // }

  async closeTable({ params, request, response }) {
    const { slug, openedId } = params
    const { cashierId } = request.all()

    try {
      console.log('Starting: ', { controller: 'TableController', linha: 265, metodo: 'closeAllTableCommands' })
      const profile = await Profile.findBy('slug', slug)
      let { fees, formsPayment, commands } = request.all()

      if (!openedId) {
        return response.status(500).json({ message: "openedId não foi definido" })
      }

      let opened = await TableOpened.query().with('commands').where('id', openedId).first()
      const table = await opened.table().fetch()

      for (const command of opened.$relations.commands.rows) {
        const requestCommand = commands.find(c => c.id === command.id)
        if (requestCommand) {
          command.fees = JSON.stringify(requestCommand.fees)
        }
        command.status = 0
        await command.save()
      }

      // aqui criar nova transaction com valor do mesa

      opened.status = 0
      opened.fees = fees
      opened.formsPayment = opened.formsPayment.concat(formsPayment)
      opened.cashierId = cashierId
      await opened.save()

      // await axios.post(`https://rt2.whatsmenu.com.br/tableCommandsToRt2`, { commandsWs: [{ ...commands.toJSON()[0] }], finish: 'table', slug: profile.slug })

      const topic = Ws.getChannel('command:*').topic(`command:${profile.slug}`)

      if (topic) {
        topic.broadcast(`command:${profile.slug}`, { commandsWs: [{ ...commands[0] }], tableId: table.id, finish: 'table' })
      }

      opened = await TableOpened.query().with('commands', (commandsQuery) => commandsQuery.with('carts', (cartsQuery) => cartsQuery.where('type', 'T').with('command.opened').with('itens'))).where('id', openedId).first()

      table.opened = opened.toJSON()

      const cashier = await Cashier.query().where({ id: cashierId }).with('openeds').with('carts').first()
      cashier.transactions.push({
        obs: `Encerramento mesa ${table.name}`,
        type: "income",
        formsPayment: opened.formsPayment,
        value: opened.formsPayment.reduce((total, formPayment) => total += formPayment.value, 0),
        created_at: DateTime.local().toFormat("yyyy-MM-dd HH:mm:ss")
      })

      await cashier.save()

      return response.json({ table, cashier })
    } catch (error) {
      console.error(error);
      throw error
    }
  }

  async tableCommandsToRt2({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'TableController', linha: 311, metodo: 'tableCommandsToRt2' })
      const { commandsWs, tableId, finish, slug } = request.all()

      const topic = Ws.getChannel('command:*').topic(`command:${slug}`)

      if (topic) {
        topic.broadcast(`command:${slug}`, { commandsWs, tableId, finish })
      }
      return response.json({ message: 'Pedidos enviados para rt2', success: true })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = TableController
