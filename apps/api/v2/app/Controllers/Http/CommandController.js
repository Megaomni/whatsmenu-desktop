'use strict'

const Command = use('App/Models/Command')
const Table = use('App/Models/Table')
const TableOpened = use('App/Models/TableOpened')
const Profile = use('App/Models/Profile')
const Fee = use('App/Models/Fee')
const Cashier = use('App/Models/Cashier')
const Ws = use('Ws')
const axios = require('axios')
const { DateTime } = require('luxon')

class CommandController {
  async create({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'CommandController', linha: 16, metodo: 'create' })
      const data = request.except(['_csrf'])
      const { tableId, name, status, slug, cashierId } = data
      const table = await Table.query()
        .where('id', tableId)
        .with('opened', (openedQuery) =>
          openedQuery.with('commands', (commandQuery) =>
            commandQuery.where('status', 1).with('carts', (cartsQuery) => cartsQuery.where('type', 'T').with('itens'))
          )
        )
        .first()

      if (table.deleted_at) {
        return response.status(400).json({ message: `A mesa ${table.name} está desativada!` })
      }

      if (!table.status) {
        return response.status(400).json({ message: `A mesa ${table.name} está pausada!`, paused: true })
      }

      const profile = await Profile.find(table.profileId)
      let fees = await Fee.query().where('profileId', table.profileId).where('status', 1).where('automatic', 1).fetch()
      fees = fees.toJSON()

      fees.forEach((fee) => {
        if (fee.type === 'fixed') {
          fee.quantity = 1
        }
      })

      profile.command++
      await profile.save()

      let opened = table.toJSON().opened
      if (!opened) {
        opened = await TableOpened.create({
          tableId: table.id,
          status: 1,
          fees,
          cashierId,
        })
      } else {
        const commandAlreadyExistis = opened.commands.find(
          (command) => command.name.toLowerCase() === data.name.toLowerCase() || command.name.trim() === data.name.trim()
        )

        if (commandAlreadyExistis !== undefined) {
          return response.status(403).json({ message: `A comanda ${data.name} já existe nessa mesa!` })
        }
      }

      const command = await Command.create({
        tableOpenedId: opened.id,
        name,
        code: profile.command,
        status,
        fees,
      })
      // pegando comanda via ws.
      const topic = Ws.getChannel('command:*').topic(`command:${slug}`)

      if (topic) {
        topic.broadcast(`command:${slug}`, { commandsWs: [{ ...command.toJSON(), tableId, requests: [] }] })
      }

      return response.json({
        command,
        opened,
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getCommand({ params, response }) {
    try {
      console.log('Starting: ', { controller: 'CommandController', linha: 99, metodo: 'getCommand' })
      const command = await Command.find(params.commandId)
      if (command) {
        command.fees = command.fees
        return response.json(command)
      } else {
        return response.status(404).json({ message: 'Comanda não encontrada' })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async changeStatus({ request, params, response, auth }) {
    try {
      console.log('Starting: ', { controller: 'CommandController', linha: 125, metodo: 'changeStatus' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      let profileFees = await Fee.query().where('profileId', profile.id).where('deleted_at', null).fetch()
      profileFees = profileFees.toJSON()
      const command = await Command.query().where('id', params.commandId).with('carts').first()
      
      let table = await TableOpened.query()
        .where('id', command.tableOpenedId)
        .with('commands', (query) => {
          return query.from('commands').where('status', 1)
        })
        .first()

      const filteredCommands = table.toJSON().commands.filter((c) => c.id !== command.id)

      const { fees, formsPayment } = request.all()

      fees &&
        fees.forEach((fee) => {
          const haveFee = profileFees.find((profFee) => profFee.code === fee.code)

          if (haveFee) {
            fee.status = haveFee.status
          }
        })

      command.status = false
      command.fees = JSON.stringify(fees)
      command.formsPayment = JSON.stringify(formsPayment)

      await command.save()

      table.formsPayment = table.formsPayment.concat(command.formsPayment)

      if (!filteredCommands.length) {
        table.status = 0

        command.tableEmpty = true
      }
      await table.save()

      await axios.post(`https://rt3.whatsmenu.com.br/tableCommandsToRt2`, {
        commandsWs: [{ ...command.toJSON() }],
        tableId: table.tableId,
        finish: 'command',
        slug: profile.slug,
      })

      const topic = Ws.getChannel('command:*').topic(`command:${profile.slug}`)

      if (topic) {
        topic.broadcast(`command:${profile.slug}`, { commandsWs: [{ ...command.toJSON() }], tableId: table.tableId, finish: 'command' })
      }

      const commandResponse = { ...command }

      if (!command.toJSON().carts.length) {
        console.log(`deletando comanda vazia, id = ${command.id}`)
        await command.delete()
      }

      return response.json(commandResponse)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async closeCommand({ request, params, response }) {
    const { slug } = params
    const { cashierId } = request.all()
    try {
      console.log('Starting: ', { controller: 'CommandController', linha: 125, metodo: 'changeStatus' })
      const profile = await Profile.findBy('slug', slug)
      let profileFees = await Fee.query().where('profileId', profile.id).where('deleted_at', null).fetch()
      profileFees = profileFees.toJSON()
      const command = await Command.query().where('id', params.commandId).with('carts', (cartsQuery) => {cartsQuery.with('command').with('itens')}).first()
      let opened = await TableOpened.query()
        .where('id', command.tableOpenedId)
        .with('commands', (query) => {
          return query.from('commands').where('status', 1)
        })
        .first()

      const table = await opened.table().fetch()
      const filteredCommands = opened.toJSON().commands.filter((c) => c.id !== command.id)

      const { fees, formsPayment } = request.all()

      fees &&
        fees.forEach((fee) => {
          const haveFee = profileFees.find((profFee) => profFee.code === fee.code)

          if (haveFee) {
            fee.status = haveFee.status
          }
        })

      command.status = false
      command.fees = JSON.stringify(fees)
      command.formsPayment = JSON.stringify(formsPayment)

      await command.save()

      opened.formsPayment = opened.formsPayment.concat(command.formsPayment)
      opened.cashierId = cashierId

      if (!filteredCommands.length) {
        opened.status = 0
        command.tableEmpty = true
        try {
          const cashier = await Cashier.query().where({ id: cashierId }).with('openeds').with('carts.itens').first()
          if (cashier && cashier.transactions) {
            cashier.transactions.push({
              obs: `Encerramento mesa ${table.name}`,
              type: 'income',
              formsPayment: opened.formsPayment,
              value: opened.formsPayment.reduce((total, formPayment) => (total += formPayment.value), 0),
              created_at: DateTime.local().toFormat('yyyy-MM-dd HH:mm:ss'),
            })
            await cashier.save()
          }
        } catch (error) {
          console.error(error)
          throw error
        }
      }
      await opened.save()

      await axios.post(`https://rt2.whatsmenu.com.br/tableCommandsToRt2`, {
        commandsWs: [{ ...command.toJSON() }],
        tableId: opened.tableId,
        finish: 'command',
        slug: profile.slug,
      })

      const topic = Ws.getChannel('command:*').topic(`command:${profile.slug}`)

      if (topic) {
        topic.broadcast(`command:${profile.slug}`, { commandsWs: [{ ...command.toJSON() }], tableId: opened.tableId, finish: 'command' })
      }

      const commandResponse = JSON.parse(JSON.stringify(command))
      if (!command.toJSON().carts.length) {
        console.log(`deletando comanda vazia, id = ${command.id}`)
        await command.delete()
      }

      return response.json(commandResponse)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async changeTable({ request, response }) {
    //
    try {
      console.log('Starting: ', { controller: 'CommandController', linha: 171, metodo: 'changeTable' })
      const data = request.except(['_csrf'])
      const { oldTableId, newTableId, commandsIds } = data

      if (!commandsIds.length) {
        return response.status(403).json({ message: 'Nenhuma comanda selecionada' })
      }

      let newTable = await Table.query()
          .where('id', newTableId)
          .with('tablesOpened', (query) =>
            query
              .from('table_openeds')
              .where('status', 1)
              .with('commands', (query) =>
                query
                  .from('commands')
                  .where('status', 1)
                  .with('carts', (query) => {
                    return query.from('carts').where('type', 'T').with('itens')
                  })
              )
          )
          .first(),
        newTableOpened = newTable.$relations.tablesOpened.rows[0],
        oldTableOpened = await TableOpened.query()
          .where('id', oldTableId)
          .where('status', 1)
          .with('commands', (query) =>
            query
              .from('commands')
              .where('status', 1)
              .with('carts', (query) => {
                return query.from('carts').where('type', 'T').with('itens')
              })
          )
          .first(),
        oldTableCommands = oldTableOpened.$relations.commands.rows

      if (newTable.status === 0) {
        return response
          .status(403)
          .json({ message: { type: 'error', text: 'Não foi possivel trocar as comandas, verifique se a mesa selecionada está pausada.' } })
      }

      const filterdCommands = oldTableCommands.filter((command) => commandsIds.includes(command.id))
      const haveAllCommands = filterdCommands.length === oldTableCommands.length

      if (!newTableOpened) {
        newTableOpened = await TableOpened.create({
          tableId: newTableId,
          status: 1,
          fees: filterdCommands.reduce((fees, command) => {
            fees = fees.concat(command.fees)
            return fees
          }, []),
        })
      }

      if (haveAllCommands) {
        oldTableOpened.status = 0
        await oldTableOpened.save()
      }

      for (const command of filterdCommands) {
        if (newTableOpened.$relations.commands) {
          if (newTableOpened.$relations.commands.rows.every((c) => c.name !== command.name)) {
            command.tableOpenedId = newTableOpened.id
            await command.save()
          }
        } else {
          command.tableOpenedId = newTableOpened.id
          await command.save()
        }
      }
      oldTableOpened.$relations.commands = oldTableCommands.filter((command) => !commandsIds.includes(command.id))
      if (newTableOpened.$relations.commands) {
        newTableOpened.$relations.commands.rows = newTableOpened.$relations.commands.rows.concat(filterdCommands)
      } else {
        newTableOpened.$relations.commands = filterdCommands
      }

      return response.json({ newTableOpened, oldTableOpened, filterdCommands })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateFees({ request, response }) {
    try {
      console.log('Starting: ', { controller: 'CommandController', linha: 236, metodo: 'updateFees' })
      const { commandId, fees } = request.all()
      const command = await Command.find(commandId)

      command.fees = fees
      await command.save()

      return response.json(command)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateTableFees({ auth, request, response }) {
    try {
      console.log('Starting: ', { controller: 'CommandController', linha: 255, metodo: 'updateTableFees' })
      const user = await auth.getUser()
      const profile = await user.profile().fetch()
      const fees = await Fee.query().where('profileId', profile.id).where('status', 1).where('deleted_at', null).fetch()
      const { commands } = request.all()

      if (fees.rows.length) {
        let tableId

        for (let command of commands) {
          let newCommand = await Command.find(command.id)
          tableId = newCommand.tableOpenedId
          let haveFeeIndex = newCommand.fees.findIndex((fee) => fee.code === command.feeCode)

          if (haveFeeIndex !== -1) {
            newCommand.fees[haveFeeIndex].quantity = Number(command.feeQuantity)
            newCommand.fees[haveFeeIndex].automatic = Number(command.feeAutomatic)
          } else {
            const newFee = fees.toJSON().find((fee) => fee.code === command.feeCode)
            newFee.quantity = Number(command.feeQuantity)
            newFee.automatic = Number(command.feeAutomatic)
            newCommand.fees.push(newFee)
          }
          await newCommand.save()
        }

        let tableOpened = await TableOpened.query().where('id', tableId).with('commands.carts').first()
        tableOpened = tableOpened.toJSON()
        return response.json(tableOpened)
      } else {
        return response.json({ success: true })
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async updateFormPayment({ params, request, response }) {
    try {
      console.log('Starting: ', { controller: 'CommandController', linha: 339, metodo: 'updateFormPayment' })
      const { commandId } = params
      const { formsPayment } = request.all()
      const command = await Command.find(commandId)
      command.formsPayment = command.formsPayment.concat(formsPayment)
      await command.save()
      return response.json(command.formsPayment)
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

module.exports = CommandController
