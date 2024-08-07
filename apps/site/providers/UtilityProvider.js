'use strict'

const { ServiceProvider } = require('@adonisjs/fold')

class UtilityProvider extends ServiceProvider {
  /**
   * Register namespaces to the IoC container
   *
   * @method register
   *
   * @return {void}
   */
  register () {
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
    const View = this.app.use('Adonis/Src/View')
    const Env = this.app.use('Adonis/Src/Env')

    View.global('nativeDate', () => new Date())
    View.global('activeWhatsApp', () => JSON.parse(Env.get('ACTIVE_WHATSAPP', true)))
    View.global('EncodeURI', (txt) => encodeURIComponent(txt))
  }
}

module.exports = UtilityProvider
