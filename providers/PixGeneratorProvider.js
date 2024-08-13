'use strict'

const { ServiceProvider } = require('@adonisjs/fold')


class PixGeneratorProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
    this.app.singleton('PixGenerator', () => {
      const Env = use("Env");
      return {
        generatePix: (data) => {
          return {
            customer: {
              phones: {
                mobile_phone: {
                  country_code: '55',
                  area_code: data.phone.area_code,
                  number: data.phone.number,
                }
              },
              name: data.name,
              type: 'individual',
              email: 'whatsmenu@grovecompany.com.br',
              document: data.document,
              document_type: 'CPF'
            },
            items: [
              {
                amount: data.amount,
                description: data.description,
                quantity: 1
              }
            ],
            payments: [
              {
                Pix: {
                  expires_in: data.expiresIn,
                },
                payment_method: 'pix',
                split: [{
                  recipient_id_shopkeeper: data.shopkeeperRecipient
                },
                {
                  recipient_id_wmenu: Env.get('WMENU_RECIPIENT', 're_clle1is0f06zi019t2t40gwfg')
                },
                {
                  recipient_id_wmenu_pass: Env.get('WMENU_PASS_RECIPIENT', 're_clle1v8bm0at7019togk8t5wv')
                }]
              }
            ]
          }
        }
      }
    })
    //
  }

  /**
   * Attach context getter when all providers have
   * been registered
   *
   * @method boot
   *
   * @return {void}
   */
  boot () {
    //
  }
}

module.exports = PixGeneratorProvider
