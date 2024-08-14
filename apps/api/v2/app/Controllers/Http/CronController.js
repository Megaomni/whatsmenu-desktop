'use strict'
const User = use('App/Models/User')
const SystemRequest = use('App/Models/SystemRequest')
const Invoice = use('App/Models/Invoice')
const BonusSupport = use('App/Models/BonusSupport')
const moment = use('moment')
const Database = use('Database')
const { DateTime } = require('luxon')
const Mail = use('Mail')
const Ws = use('Ws')

const Cart = use('App/Models/Cart')
const CartController = use('App/Controllers/Http/CartController')
const Bartender = use('App/Models/Bartender')
const ProductComplements = use('App/Models/ProductComplement')
const InventoryProvider = use('InventoryProvider')

const { randomBytes } = require('crypto')
const WmProvider = use('WmProvider')
const Logger = use('Logger')

//IMPORTS MIGRACAO
const Seller = use('App/Models/Seller')
const RelatedPlan = use('App/Models/RelatedPlan')
const FlexPlan = use('App/Models/FlexPlan')
const UserPlan = use('App/Models/UserPlan')
const SystemProduct = use('App/Models/SystemProduct')
const Plans = use('App/Models/Plan')

class CronController {
  async deleteByNotPaidFirst({ response }) {
    try {
      console.log('Starting: ', {
        controller: 'CronController',
        linha: 11,
        metodo: 'deleteByNotPaidFirst',
      })
      const list = await User.query()
        .innerJoin('system_requests', 'users.id', 'system_requests.userId')
        .whereRaw(
          `date(users.created_at) = date(system_requests.created_at) and system_requests.expiration = '${moment()
            .subtract(4, 'days')
            .format('YYYY-MM-DD')}' and system_requests.status in ('pending', 'canceled')`
        )
        .fetch()

      for (let item of list.rows) {
        const user = await User.find(item.userId)
        const systemRequest = await user.requests().where('id', item.id).first()

        await systemRequest.delete()
        await user.delete()
      }

      return response.json(list)
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
      return response.json(error)
    }
  }

  async blockProfile({ response }) {
    try {
      console.log('Starting: ', {
        controller: 'CronController',
        linha: 36,
        metodo: 'blockProfile',
      })
      const blockList = await SystemRequest.query().where('limit', moment().format('YYYY-MM-DD')).whereNull('blocked_at').fetch()

      if (blockList) {
        for (let invoice of blockList.rows) {
          const fature = await invoice.invoice().fetch()

          if (
            (invoice.paghiper && invoice.paghiper[invoice.paghiper.length - 1].status === 'canceled') ||
            (invoice.paghiper && invoice.paghiper[invoice.paghiper.length - 1].status === 'refunded')
          ) {
            const user = await invoice.user().fetch()
            const profile = await user.profile().fetch()
            const checkPayment = await Invoice.find(invoice.invoiceId)

            if (checkPayment.status !== 'paid' && profile && (fature.type === 'monthly' || fature.type === 'first')) {
              profile.status = 0
              invoice.blocked_at = moment().format()
              profile.save()

              const bonusSupport = await BonusSupport.query().where('invoiceId', checkPayment.id).first()
              const firstBonusSupport = await Invoice.query().where({ userId: user.id, type: 'monthly' }).first()

              if (firstBonusSupport && checkPayment.id === firstBonusSupport.id) {
                if (bonusSupport) {
                  bonusSupport.status = 'canceled'
                  await bonusSupport.save()
                } else {
                  await BonusSupport.create({
                    userId: user.id,
                    supportId: user.supportId,
                    invoiceId: checkPayment.id,
                    status: 'canceled',
                    month: 2,
                  })
                }
              }

              invoice.status = invoice.paghiper[invoice.paghiper.length - 1].status
              fature.status = invoice.paghiper[invoice.paghiper.length - 1].status

              await fature.save()
              await invoice.save()
            }
          }
        }
      }

      return response.json(blockList)
    } catch (error) {
      console.error({
        date: moment().format(),
        error: error,
      })
      return response.json(error)
    }
  }

  async countPaidInvoices(user) {
    try {
      console.log('Starting: ', {
        controller: 'CronController',
        linha: 102,
        metodo: 'countPaidInvoices',
      })
      const invoices = await user.requests().whereIn('status', ['reserved', 'paid', 'completed']).fetch()

      if (!invoices) {
        return 0
      }

      return invoices.rows.length
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async dataSystemMigrate({ response }) {
    console.log('Starting: ', {
      controller: 'CronController',
      linha: 138,
      metodo: 'dataSystemMigrate',
    })
    const newConnectionDatabase = Database.connection('mysql2')

    //FLEX_PLANS
    await this.migrateTable({
      model: FlexPlan,
      all: true,
      connection: newConnectionDatabase,
      insertTableName: 'flex_plans',
      columnsDateConvert: 'deleted_at',
      callbackAfterLastElement: (tableName) => console.log(`Tabela ${tableName}, migrada com sucesso`),
    }).catch(console.error)

    //RELATED_PLANS
    await this.migrateTable({
      model: RelatedPlan,
      all: true,
      connection: newConnectionDatabase,
      insertTableName: 'related_plans',
      callbackAfterLastElement: (tableName) => {
        console.log(`Tabela ${tableName}, migrada com sucesso`)
      },
    }).catch(console.error)

    //SYSTEM_PRODUCTS
    await this.migrateTable({
      model: SystemProduct,
      all: true,
      connection: newConnectionDatabase,
      insertTableName: 'system_products',
      callbackAfterLastElement: (tableName) => console.log(`Tabela ${tableName}, migrada com sucesso`),
    }).catch(console.error)

    //SELLERS
    await this.migrateTable({
      model: Seller,
      all: true,
      connection: newConnectionDatabase,
      insertTableName: 'sellers',
      callbackAfterLastElement: (tableName) => console.log(`Tabela ${tableName}, migrada com sucesso`),
    }).catch(console.error)

    //PLANS

    await this.migrateTable({
      model: Plans,
      all: true,
      connection: newConnectionDatabase,
      insertTableName: 'plans',
      callbackAfterLastElement: (tableName) => console.log(`Tabela ${tableName}, migrada com sucesso`),
    }).catch(console.error)

    //SUPPORTS
    await this.migrateTable({
      model: User,
      insertTableName: 'users',
      where: (query) => query.where('controls', 'like', '%"type": "support%'),
      connection: newConnectionDatabase,
      closeConnection: true,
      callbackAfterAnyElement: async (userModel) => {
        const profile = await userModel.profile().fetch()

        if (profile) {
          const newProfile = this.deserialize(profile)
          await newConnectionDatabase.table('profiles').insert(newProfile)
        }

        await this.migrateTable({
          model: userModel,
          relationName: 'invoices',
          insertTableName: 'invoices',
          connection: newConnectionDatabase,
          columnsDateConvert: 'expiration',
        })
        await this.migrateTable({
          model: userModel,
          relationName: 'requests',
          insertTableName: 'system_requests',
          connection: newConnectionDatabase,
          columnsDateConvert: 'expiration;limit;blocked_at',
        })
      },
      callbackAfterLastElement: (tableName) => console.log(`Tabela ${tableName}, migrada com sucesso`),
    })

    return response.json({
      message: 'Dados Básicos do Sistema Migrados com Sucesso',
    })
  }

  async migrateDataUser({ request }) {
    console.log('Starting: ', {
      controller: 'CronController',
      linha: 159,
      metodo: 'migrateDataUser',
    })
    const initialTime = DateTime.local()

    try {
      const newConnectionDatabase = Database.connection('mysql2')
      const data = request.except(['_csrf'])

      const users = await User.query().whereIn('id', data.ids).fetch()
      const migrateds = []
      users.rows.forEach(async (user) => {
        if (user.controls.migrated_at) {
          console.log(`Usuário ${user.id} já foi migrado em ${user.controls.migrated_at}`)
          return
        }
        console.log('Iniciando Migração do Usuário:', user.id)
        try {
          //DESCERIALIZANDO OBJETO MODEL
          const newUser = this.deserialize({ model: user })
          const time = DateTime.local()
          let totalCarts = 0

          //INICIO DA MIGRAÇÃO
          //INSERINDO USUÁRIO NA TABELA
          await newConnectionDatabase.table('users').insert(newUser)
          console.log('Usuário inserido com sucesso!')

          //UserPlans
          await this.migrateTable({
            model: UserPlan,
            insertTableName: 'user_plans',
            where: { userId: user.id },
            connection: newConnectionDatabase,
            callbackAfterLastElement: (tableName) => console.log(`Table: ${tableName}, migrada com sucesso`),
          })

          //Invoices
          const bonusSupport = async (tableName) => {
            if (user.supportId) {
              //BonusSuport
              await this.migrateTable({
                model: BonusSupport,
                insertTableName: 'bonus_supports',
                where: { userId: user.id, supportId: user.supportId },
                connection: newConnectionDatabase,
              })
            }

            console.log(`Table: ${tableName}, migrada com sucesso`)
          }
          await this.migrateTable({
            model: user,
            relationName: 'invoices',
            insertTableName: 'invoices',
            connection: newConnectionDatabase,
            columnsDateConvert: 'expiration',
            callbackAfterLastElement: bonusSupport,
          })

          //SYSTEM_REQUESTS
          await this.migrateTable({
            model: user,
            relationName: 'requests',
            insertTableName: 'system_requests',
            connection: newConnectionDatabase,
            columnsDateConvert: 'expiration;limit;blocked_at',
            callbackAfterLastElement: (tableName) => console.log(`Table: ${tableName}, migrada com sucesso`),
          })

          //INSERINDO PERFIL NA TABELA
          const doubleProfile = await user.profileAll().fetch()

          if (doubleProfile) {
            for (const profile of doubleProfile.rows) {
              const newProfile = this.deserialize({
                model: profile,
                columnsEmojiConvert: 'name;description',
              })

              newProfile.options = JSON.parse(newProfile.options)
              newProfile.options = {
                ...newProfile.options,
                pizza: {
                  ...profile.options.pizza,
                  multipleBorders: false,
                  multipleComplements: true,
                },
                pdv: {
                  cashierManagement: false,
                  clientConfig: {
                    birthDate: false,
                    required: false,
                  },
                },
              }
              newProfile.options = JSON.stringify(newProfile.options)

              await newConnectionDatabase.table('profiles').insert(newProfile)
              console.log(`Perfil ${profile.slug} inserido com sucesso!`)

              const categories = await profile.categories().with('products').fetch()

              //BARTENDERS
              await this.migrateTable({
                model: profile,
                relationName: 'bartenders',
                insertTableName: 'bartenders',
                connection: newConnectionDatabase,
                columnsDateConvert: 'deleted_at',
              })

              const lastBartenderNewDB = await Database.connection('mysql2').select(Database.raw('MAX(id) as max_id')).from('bartenders')

              const lastBartenderOldDB = await Database.connection('mysql').select(Database.raw('MAX(id) as max_id')).from('bartenders')

              const nextId = lastBartenderOldDB[0].max_id > lastBartenderNewDB[0].max_id ? lastBartenderOldDB[0].max_id : lastBartenderNewDB[0].max_id

              const newBartenderPerfil = {
                id: nextId + 1,
                name: user.name.split(' ')[0],
                profileId: profile.id,
                password: user.password,
                controls: JSON.stringify({
                  type: 'manager',
                  defaultCashier: true,
                  blockedCategories: [],
                }),
                created_at: new Date(),
                updated_at: new Date(),
              }

              await newConnectionDatabase.table('bartenders').insert(newBartenderPerfil)
              console.log(`Tabela: Bartender, migrada com sucesso`)

              //Fees
              await this.migrateTable({
                model: profile,
                relationName: 'fees',
                insertTableName: 'fees',
                connection: newConnectionDatabase,
                columnsDateConvert: 'deleted_at',
              })
              console.log(`Tabela: fees, migrada com sucesso`)

              //Cupons
              await this.migrateTable({
                model: profile,
                relationName: 'cupons',
                insertTableName: 'cupons',
                connection: newConnectionDatabase,
                columnsDateConvert: 'deleted_at',
              })
              console.log(`Tabela: cupons, migrada com sucesso`)

              //Domains
              await this.migrateTable({
                model: profile,
                relationName: 'domains',
                insertTableName: 'domains',
                connection: newConnectionDatabase,
              })
              console.log(`Tabela: domains, migrada com sucesso`)
              //COMMAND
              const createCommand = async (tableOpened) => {
                await this.migrateTable({
                  model: tableOpened,
                  relationName: 'commands',
                  insertTableName: 'commands',
                  connection: newConnectionDatabase,
                })
              }

              //TablesOpened
              const createTablesOpened = async (modelTable) => {
                await this.migrateTable({
                  model: modelTable,
                  relationName: 'tablesOpened',
                  insertTableName: 'table_openeds',
                  connection: newConnectionDatabase,
                  callbackAfterAnyElement: createCommand,
                })
              }

              //Tables
              await this.migrateTable({
                model: profile,
                relationName: 'tables',
                insertTableName: 'tables',
                connection: newConnectionDatabase,
                callbackAfterAnyElement: createTablesOpened,
                columnsDateConvert: 'deleted_at',
                columnsEmojiConvert: 'name',
              })
              console.log(`Table: tables, migrada com sucesso`)

              const createProductsAndPizza = async (modelCategory) => {
                //PizzaProducts

                await this.migrateTable({
                  model: modelCategory,
                  relationName: 'pizzaProduct',
                  insertTableName: 'pizza_products',
                  connection: newConnectionDatabase,
                  columnsEmojiConvert: 'sizes;flavors;implementations',
                  callbackBeforeAnyElement: async (pizza) => {
                    for (const flavor of pizza.flavors) {
                      flavor.amount = 0
                      flavor.amount_alert = 0
                      flavor.bypass_amount = true
                    }
                    return pizza
                  },
                })

                //ProductComplements
                const createProductComplements = async (modelComplement, modelProduct) => {
                  await this.migrateTable({
                    model: ProductComplements,
                    insertTableName: 'product_complements',
                    connection: newConnectionDatabase,
                    where: {
                      complementId: modelComplement.id,
                      productId: modelProduct.id,
                    },
                  })
                }

                //COMPLEMENTS
                const createComplement = async (modelProduct) => {
                  await this.migrateTable({
                    model: modelProduct,
                    relationName: 'complements',
                    insertTableName: 'complements',
                    connection: newConnectionDatabase,
                    callbackAfterAnyElement: (modelComplement) => createProductComplements(modelComplement, modelProduct),
                    verifyExistsFromProperty: 'id',
                    callbackBeforeAnyElement: async (complement) => {
                      for (const item of complement.itens) {
                        item.amount = 0
                        item.amount_alert = 0
                        item.bypass_amount = true
                      }
                      return complement
                    },
                  })
                }

                //Products
                await this.migrateTable({
                  model: modelCategory,
                  relationName: 'products',
                  insertTableName: 'products',
                  connection: newConnectionDatabase,
                  columnsEmojiConvert: 'name',
                  columnsDateConvert: 'deleted_at',
                  callbackAfterAnyElement: createComplement,
                })
              }

              //Categories

              await this.migrateTable({
                model: profile,
                relationName: 'categories',
                insertTableName: 'categories',
                connection: newConnectionDatabase,
                columnsEmojiConvert: 'name',
                callbackAfterAnyElement: createProductsAndPizza,
                callbackAfterLastElement: async () => {
                  console.log(`Tabela: categories, migrada com sucesso`)
                  totalCarts = await this.migrateCarts(profile, newConnectionDatabase, categories)
                  console.log(`Tabela: carts, migrada com sucesso`)
                  migrateds.push(user.id)
                },
              })

              profile.options.migrated_at = DateTime.local().toFormat('dd/MM/yyyy HH:mm')
              profile.options.forceLogout = new Date().getTime()
              await user.save()
              await profile.save()
            }

            const endTime = DateTime.local()
            migrateds.push(`${user.id}`)
            user.controls.migrated_at = DateTime.local().toFormat('dd/MM/yyyy HH:mm')
            user.controls.beta = true
            await user.save()
            console.log({
              userId: user.id,
              totalCarts,
              duracao: endTime.diff(time).toFormat('hh:mm:ss'),
              status: 'Sucesso',
            })
          }

          const endTime = DateTime.local()
          const duration = endTime.diff(initialTime)
          await Mail.raw(
            `
              <ul>
              ${migrateds.some((el) => typeof el === 'string' && el.includes(':')) ? '<li><b>Contem erros</b></li>' : ''}

                <li>
                    Usuários Migrados
                    <ol>
                    ${migrateds.map((item) => `<li>${item}</li>`).join('')}
                    </ol>
                </li>
                <li>Início: ${initialTime.toFormat('dd/MM/yyyy HH:mm:ss')}</li>
                <li>Fim: ${endTime.toFormat('dd/MM/yyyy HH:mm:ss')}</li>
                <li>Duração: ${duration.toFormat('mm')} minutos e ${duration.toFormat('ss')} segundos</li>
              </ul>
              `,
            (message) => {
              message
                .from('whatsmenu@grovecompany.com.br')
                .to('jasonaries@gmail.com')
                .subject(`Migração de Usuários - ${DateTime.local().toFormat('dd/MM/yyyy HH:mm')}`)
            }
          )
        } catch (error) {
          migrateds.push(`${user.id}: ${error.code ? error.code : error.status}`)
          console.log(error)
          if (migrateds.length === data.ids.length) {
            const endTime = DateTime.local()
            const duration = endTime.diff(initialTime)

            await Mail.raw(
              `
              <ul>
                <li><b>Contem erros</b></li>
                <li>Usuários Migrados: [ ${migrateds.join(', ')} ]</li>
                <li>Início: ${initialTime.toFormat('dd/MM/yyyy HH:mm:ss')}</li>
                <li>Fim: ${endTime.toFormat('dd/MM/yyyy HH:mm:ss')}</li>
                <li>Duração: ${duration.toFormat('mm')} minutos e ${duration.toFormat('ss')} segundos</li>
              </ul>
              `,
              (message) => {
                message
                  .from('whatsmenu@grovecompany.com.br')
                  .to('jasonaries@gmail.com')
                  .subject(`Migração de Usuários [ ERROR ]- ${DateTime.local().toFormat('dd/MM/yyyy HH:mm')}`)
              }
            )
          }
        }
      })
    } catch (error) {
      console.error(error)
    }
  }

  async migrateCarts(profile, newConnectionDatabase, categories) {
    console.log(`Iniciando migração carts: `, profile.id)

    let requestPage = 1
    let requests = {}
    let duplicateRequests = []
    let allCodes = []
    let totalRequests = 0
    const dateNow = DateTime.now().setZone('America/Sao_Paulo')
    const fiveDaysAgo = dateNow.minus({ days: 5 })
    do {
      requests = await profile
        .requests()
        .whereBetween('created_at', [fiveDaysAgo.toFormat('yyyy-MM-dd HH:mm:ss'), dateNow.toFormat('yyyy-MM-dd HH:mm:ss')])
        .paginate(requestPage, 100)
      console.log(dateNow, fiveDaysAgo)

      for (const req of requests.rows) {
        const request = req.toJSON()

        let requestDuplicate = duplicateRequests.find((r) => r && r.code === req.code)
        if (allCodes.some((code) => code === req.code)) {
          if (!requestDuplicate) {
            requestDuplicate = { code: request.code, times: 1 }
            request.code += `*${requestDuplicate.times}`
            duplicateRequests.push(requestDuplicate)
          } else {
            requestDuplicate.times++
            request.code += `*${requestDuplicate.times}`
          }
        }

        const cart = await this.generateCart(request, profile, newConnectionDatabase)

        if (cart) {
          totalRequests++
          allCodes.push(cart.code)
          this.generateCartItens(
            {
              cart: request.cart,
              cartPizza: request.cartPizza,
              cartId: cart.id,
              valueType: request.type,
              profile,
              categories: categories.toJSON(),
            },
            newConnectionDatabase
          )
        }
      }
      requestPage++
    } while (requestPage <= requests.pages.lastPage)

    return totalRequests
  }

  async migrateTable({
    model,
    relationName,
    insertTableName,
    connection,
    where,
    all,
    closeConnection,
    callbackAfterLastElement,
    callbackAfterAnyElement,
    callbackBeforeAnyElement,
    columnsDateConvert,
    columnsEmojiConvert,
    verifyExistsFromProperty,
  }) {
    try {
      const data = !all ? (where ? await model.query().where(where).fetch() : await model[relationName]().fetch()) : await model.all()

      if (!data) {
        return
      }

      if (data.rows) {
        let index = 0
        for (const dt of data.rows) {
          if (callbackBeforeAnyElement) {
            await callbackBeforeAnyElement(dt)
          }
          await this.insertInTable(
            insertTableName,
            connection,
            columnsDateConvert,
            columnsEmojiConvert,
            dt,
            callbackAfterAnyElement,
            verifyExistsFromProperty
          )
          Logger.transport('file').info(`Tabela ${insertTableName} id ${dt.id}`)

          if (data.rows.length - index === 1) {
            if (callbackAfterLastElement && typeof callbackAfterLastElement === 'function') {
              await callbackAfterLastElement(insertTableName)
            }

            if (closeConnection) {
              console.log('fechando conexão')
              this.closeConnection()
            }
          }

          index++
        }
      } else {
        if (callbackBeforeAnyElement) {
          await callbackBeforeAnyElement(data)
        }
        await this.insertInTable(
          insertTableName,
          connection,
          columnsDateConvert,
          columnsEmojiConvert,
          data,
          callbackAfterAnyElement,
          verifyExistsFromProperty
        )
        if (callbackAfterLastElement && typeof callbackAfterLastElement === 'function') {
          await callbackAfterLastElement(insertTableName)
        }
      }
    } catch (error) {
      console.error(error)
      Logger.transport('file').error('', error)
      throw error
    }
  }

  async insertInTable(tableName, connection, columnsDateConvert, columnsEmojiConvert, model, callbackAfterAnyElement, verifyExistsFromProperty) {
    const objectDeserialized = this.deserialize({
      model,
      columnsDateConvert,
      columnsEmojiConvert,
    })

    delete objectDeserialized.pivot

    if (verifyExistsFromProperty) {
      const exists = await connection.table(tableName).where(verifyExistsFromProperty, objectDeserialized[verifyExistsFromProperty]).first()
      if (exists) {
        console.log('Evitando item duplicado na table', tableName, exists.id)
        if (callbackAfterAnyElement) {
          await callbackAfterAnyElement(model)
        }
        return
      }
    }

    await connection.table(tableName).insert(objectDeserialized)

    if (callbackAfterAnyElement) {
      await callbackAfterAnyElement(model)
    }
  }

  async generateCart(request, profile, newConnectionDatabase) {
    try {
      const cart = { controls: {} }
      for (const [key, value] of Object.entries(request)) {
        switch (key) {
          case 'id':
          case 'profileId':
          case 'cupomId':
          case 'commandId':
          case 'bartenderId':
          case 'code':
          case 'status':
          case 'type':
          case 'taxDelivery':
          case 'timeDelivery':
          case 'total':
          case 'print':
          case 'tentatives':
          case 'packageDate':
          case 'created_at':
          case 'updated_at':
            cart[key] = request[key]
            break
          case 'name':
            cart.clientId = await this.generateClient(
              {
                clientSearchData: {
                  profileId: request.profileId,
                  whatsapp: request.contact,
                },
                name: request.name,
                date_last_request: request.created_at,
                profile,
              },
              newConnectionDatabase
            )
            break
          case 'deliveryAddress':
            cart.controls.ip = value.ip
            delete request[key].ip
            if (request.typeDelivery === 0) {
              cart.addressId = await this.generateClientAddress(
                {
                  deliveryAddress: request.deliveryAddress,
                  clientId: cart.clientId,
                  uf: profile.address.state,
                },
                newConnectionDatabase
              )
            }
            break
          case 'formPayment':
            const formPayment = await this.generateFormPayment({
              label: request.formPayment,
              flag: request.formPaymentFlag,
              value: request.total,
              change: request.transshipment,
              profileFormsPayment: profile.formsPayment,
            })
            cart.formsPayment = [formPayment]
            break
          default:
            break
        }
      }

      let newCart = this.deserialize({
        model: cart,
        columnsDateConvert: 'packageDate',
      })
      const letters = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'X',
        'W',
        'Y',
        'Z',
      ]
      let index = 0
      let cartsAlreadyExists

      do {
        if (newCart.type !== 'T' && newCart.commandId) {
          newCart.commandId = null
        }
        cartsAlreadyExists = await newConnectionDatabase.table('carts').where({ profileId: profile.id, code: newCart.code }).first()

        if (cartsAlreadyExists) {
          newCart.code = `${newCart.code}${letters[index]}`
        }
        index++
      } while (cartsAlreadyExists)

      const cartId = await newConnectionDatabase.table('carts').insert(newCart)
      newCart = await newConnectionDatabase.table('carts').where('id', cartId).first()

      return newCart
    } catch (error) {
      console.error(error)
    }
  }

  async generateCartItens({ cart, cartPizza, cartId, valueType, categories }, newConnectionDatabase) {
    try {
      if (!categories || !categories.length) {
        return
      }

      const products = categories.reduce((products, category) => [...products, ...category.products], [])
      cart = cart.map((product) => {
        const profileProduct = products.find((p) => p.id === product.id)
        const details = JSON.stringify({
          value: this.getProductFinalValue(product, valueType),
          isPromote: !!(product.promoteStatus || product.promoteStatusTable),
          complements: product.complements,
        })

        return {
          productId: profileProduct ? profileProduct.id : null,
          cartId,
          quantity: product.quantity ? product.quantity : 1,
          obs: product.obs,
          details: details,
          name: product.name,
          type: 'default',
        }
      })

      const pizzas = categories.map((category) => category.pizzaProduct).filter((pizza) => pizza)

      cartPizza = cartPizza.map((pizza) => {
        const pizzaProfile = pizzas.find((pizzaProfile) => {
          return (
            pizza.flavors.some((flavor) => pizzaProfile.flavors.some((f) => f.code === flavor.code)) ||
            pizzaProfile.sizes.some((size) => size.name === pizza.size)
          )
        })

        const flavors = pizza.flavors.map((flavor) => flavor.name).join()

        const pizzaId = pizzaProfile ? pizzaProfile.id : null
        return {
          cartId,
          pizzaId,
          quantity: pizza.quantity ? pizza.quantity : 1,
          obs: pizza.obs,
          details: JSON.stringify({
            value: pizza.value,
            size: pizza.size,
            complements: pizza.complements ? pizza.complements : [],
            flavors: pizza.flavors ? pizza.flavors : [],
            implementations: pizza.implementations ? pizza.implementations : [],
          }),
          name: pizzaProfile
            ? `Pizza ${pizza.size} ${pizza.flavors.length} Sabor${pizza.flavors.length > 1 ? 'es' : ''} ${flavors} ${
                pizza.implementations.length ? 'com ' + pizza.implementations[0].name : ''
              }`
            : '-',
          type: 'pizza',
        }
      })
      const itens = [...cartPizza, ...cart]

      await newConnectionDatabase.table('cart_itens').insert(itens)
    } catch (error) {
      console.error(error)
    }
  }

  async generateClient({ clientSearchData, name, date_last_request }, newConnectionDatabase) {
    try {
      let client = await newConnectionDatabase.table('clients').where(clientSearchData).first()
      if (!client) {
        const clientId = await newConnectionDatabase.table('clients').insert({
          ...clientSearchData,
          name,
          date_last_request,
        })

        client = await newConnectionDatabase.table('clients').where('id', clientId).first()
      } else {
        await newConnectionDatabase.table('clients').where('id', client.id).update({ date_last_request, name })
        client.date_last_request = date_last_request
        client.name = name
        //   console.log('client aquiiiiiii', client)
        // await client.save()
      }

      return client.id
    } catch (error) {
      console.error(error)
    }
  }

  async generateClientAddress({ deliveryAddress, clientId, uf }, newConnectionDatabase) {
    try {
      deliveryAddress.clientId = clientId
      deliveryAddress.uf = uf ? uf : ''
      deliveryAddress.number = typeof deliveryAddress.number === 'number' ? deliveryAddress.number : null
      deliveryAddress.city = deliveryAddress.city ? deliveryAddress.city : ''
      delete deliveryAddress.ip
      deliveryAddress.deleted_at = null
      let address = await newConnectionDatabase.table('client_addresses').where(deliveryAddress).first()

      if (!address) {
        const addressId = await newConnectionDatabase.table('client_addresses').insert(deliveryAddress)
        address = await newConnectionDatabase.table('client_addresses').where('id', addressId).first()
      }
      return address.id
    } catch (error) {
      console.error(error)
    }
  }

  async generateFormPayment({ label, flag, value, change, profileFormsPayment }) {
    try {
      const formPayment = {
        label,
        flag,
        value,
      }
      if (label === 'Dinheiro' && change) {
        formPayment.change = change
      }

      const profileFormPayment = profileFormsPayment.find((f) => f.label === label)
      if (profileFormPayment) {
        formPayment.payment = profileFormPayment.payment
        formPayment.code = randomBytes(3).toString('hex')
      }
      return formPayment
    } catch (error) {
      console.error(error)
    }
  }

  getProductFinalValue(product, valueType) {
    const valueMenu = valueType === 'T' ? 'valueTable' : 'value'
    const promoteStatusMenu = valueType === 'T' ? 'promoteStatusTable' : 'promoteStatus'
    const promoteValueMenu = valueType === 'T' ? 'promoteValueTable' : 'promoteValue'

    return product[promoteStatusMenu] ? product[promoteValueMenu] : product[valueMenu]
  }

  closeConnection(time) {
    setTimeout(
      () => {
        Database.close(['mysql2'])
      },
      time ? time : 1500
    )
  }

  deserialize({ model, columnsDateConvert, columnsEmojiConvert }) {
    if (!model) return model

    const data = model.toJSON ? model.toJSON() : model

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value) {
        data[key] = JSON.stringify(value)
      }
    }
    if (columnsDateConvert) {
      const columns = columnsDateConvert.split(';')

      columns.forEach((colum) => {
        if (data[colum] && typeof data[colum] === 'string') {
          const newDeletedAt = data[colum].split('"').join('')

          data[colum] = DateTime.fromISO(newDeletedAt).toFormat('yyyy-MM-dd HH:mm:ss').replace('"', '')
        }
      })
    }

    if (columnsEmojiConvert) {
      const columns = columnsEmojiConvert.split(';')

      columns.forEach((colum) => {
        if (data[colum] && typeof data[colum] === 'string') {
          const newColumn = WmProvider.encryptEmoji(data[colum])
          data[colum] = newColumn
        }
      })
    }

    return data
  }

  async updateOptionsPdv({ request, response }) {
    try {
      const { userIdsRange } = request.all()
      const dbConnection = await Database.connection('mysql2')
      const profiles = await dbConnection.table('profiles').whereBetween('userId', userIdsRange).fetch()
      for (const profile of profiles.rows) {
        profile.options = {
          ...profile.options,
          pizza: { ...profile.options.pizza, multipleBorders: false, multipleComplements: true },
          pdv: {
            cashierManagement: false,
            clientConfig: {
              birthDate: false,
              required: false,
            },
          },
        }
        await Bartender.create({
          name: profile.toJSON().user.name,
          profileId: profile.id,
          password: profile.toJSON().user.password,
          controls: {
            type: 'manager',
            defaultCashier: true,
          },
        })
        await profile.save()
      }

      return response.json({ message: 'Atualizado!' })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async cancelPendingRequests({ response }) {
    try {
      const carts = await Cart.query()
        .where({ statusPayment: 'pending' })
        .where('created_at', '<', DateTime.local().minus({ minutes: 10 }).toSQL())
        .with('itens')
        .fetch()
      for (let cart of carts.rows) {
        cart.statusPayment = 'cancelled'
        await cart.save()
        const { itens } = cart.toJSON()
        for (const item of itens) {
          await InventoryProvider.restoreProductDisponibility(item)
        }
      }
      return response.json({ message: `${carts.rows.length} Pedidos Cancelados` })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async deletePendingOnlinePendingRequest({ response }) {
    try {
      const carts = await Cart.query().where({ statusPayment: 'cancelled' }).with('itens').fetch()
      for (const cart of carts.rows) {
        await cart.itens().delete()
        await cart.delete()
      }
      return response.json({ carts })
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async checkCartPayment({ response }) {
    try {
      const carts = await Cart.query()
        .where('formsPayment', 'like', '%pix%')
        .where('formsPayment', 'like', '%"paid": true%')
        .where('statusPayment', 'pending')
        .where('created_at', '>', DateTime.local().toFormat('yyyy-MM-dd'))
        .with('itens')
        .with('cupom')
        .with('address')
        .with('cupom')
        .with('command', (commandQuery) => commandQuery.with('opened', (openedQuery) => openedQuery.with('commands.carts').with('table')))
        .with('bartender')
        .with('cashier')
        .with('client', (clientQuery) => clientQuery.setVisible(['name', 'whatsapp', 'controls']))
        .fetch()

      const process = []

      for (const cart of carts.rows) {
        process.push({
          cartId: cart.id,
          totalFormsPayment: CartController.getTotalFormsPayment(cart),
          totalcartValue: CartController.getTotalcartValue(cart),
        })

        if (CartController.getTotalFormsPayment(cart) >= CartController.getTotalcartValue(cart)) {
          const profile = await cart.profile().fetch()
          cart.statusPayment = 'paid'
          await cart.save()

          const requestTopic = Ws.getChannel('request:*').topic(`request:${profile.slug}`)
          if (requestTopic) {
            requestTopic.broadcast(`request:${profile.slug}`, [{ ...cart.toJSON() }])
          }
        }
      }
      response.json(process)
    } catch (error) {
      throw error
    }
  }
}

module.exports = CronController
