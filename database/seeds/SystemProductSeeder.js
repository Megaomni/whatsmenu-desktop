'use strict'

const Database = require('@adonisjs/lucid/src/Database');
const { default: axios } = require('axios');
const AdministratorController = require('../../app/Controllers/Http/Administrator/AdministratorController');
const WmProvider = use("WmProvider")
const Env = use("Env");
const FlexPlan = use("App/Models/FlexPlan");
const SystemProduct = use("App/Models/SystemProduct");
/*
|--------------------------------------------------------------------------
| SystemProductSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

class SystemProductSeeder {
  async run() {
    try {


      const flexPlans = await FlexPlan.all();
      const { data: { EURBRL: eur } } = await axios.get("https://economia.awesomeapi.com.br/last/EUR-BRL");
      const { data: { USDBRL: usd } } = await axios.get("https://economia.awesomeapi.com.br/last/USD-BRL");

      for await (const plan of flexPlans.rows) {
        const periods = ["monthly", "yearly"];
        for (const period of periods) {
          const brl = plan[period];
          const dolar = brl / usd.bid;
          const euro = brl / eur.bid;

          const priceId = WmProvider.hash(15);
          const originalValue = plan[period];

          const systemProduct = {
            gateway: "stripe",
            period: period,
            plan: {
              id: plan.id,
              category: plan.category,
              type: plan.type,
              name: plan.name,
              value: plan[period]
            },
            product: {
              name: `Plano ${plan.name} ${period === "monthly" ? "Mensal" : "Anual"}`,
              description: `${plan.type === "upgrade" ? "Plano com desconto" : ""}`,
              status: true,
              default_price: priceId,
              operations: {
                type: period,
                value: originalValue,
                prices: [
                  {
                    id: priceId,
                    default_currency: "brl",
                    currencies: {
                      brl: {
                        unit_amount: (brl * 100).toFixed(0)
                      },
                      eur: {
                        unit_amount: (euro * 100).toFixed(0)
                      },
                      usd: {
                        unit_amount: (dolar * 100).toFixed(0)
                      }
                    }
                  }
                ]
              }
            },
            recurring: {
              interval: period.replace("ly", "")
            }
          }


          const data = await AdministratorController.systemProductCreate(systemProduct);
        }

      }

      const printerPriceId = WmProvider.hash(15);
      const printerBRL = 249.90;
      const printerEUR = printerBRL / eur.bid;
      const printerUSD = printerBRL / usd.bid;
      const printer = {
        gateway: "stripe",
        product: {
          name: `Impressora`,
          description: `Impressora MPT-2`,
          status: true,
          default_price: printerPriceId,
          service: "printer",
          operations: {
            prices: [
              {
                id: printerPriceId,
                default_currency: "brl",
                currencies: {
                  brl: {
                    unit_amount: (printerBRL * 100).toFixed(0)
                  },
                  eur: {
                    unit_amount: (printerEUR * 100).toFixed(0)
                  },
                  usd: {
                    unit_amount: (printerUSD * 100).toFixed(0)
                  }
                }
              }
            ]
          }
        }
      }

      const menuPriceId = WmProvider.hash(15);
      const menuBRL = 149.90;
      const menuEUR = menuBRL / eur.bid;
      const menuUSD = menuBRL / usd.bid;
      const menu = {
        gateway: "stripe",
        product: {
          name: `Montagem de Cardápio`,
          description: `Serviço Montagem de Cardápio`,
          status: true,
          default_price: menuPriceId,
          service: "menu",
          operations: {
            prices: [
              {
                id: menuPriceId,
                default_currency: "brl",
                currencies: {
                  brl: {
                    unit_amount: (menuBRL * 100).toFixed(0)
                  },
                  eur: {
                    unit_amount: (menuEUR * 100).toFixed(0)
                  },
                  usd: {
                    unit_amount: (menuUSD * 100).toFixed(0)
                  }
                }
              }
            ]
          }
        }
      }

      const systemProductPrinter = await AdministratorController.systemProductCreate(printer);
      const systemProductMenu = await AdministratorController.systemProductCreate(menu);


    } catch (error) {
      if (error.response) {
        console.error(error.response.data)
      } else {
        console.error(error);
      }
    }
  }
}

module.exports = SystemProductSeeder
