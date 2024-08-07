'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')
const Drive = use('Drive')
const Helpers = use('Helpers')

/**
 * This class handles all exceptions thrown during
 * the HTTP request lifecycle.
 *
 * @class ExceptionHandler
 */
class ExceptionHandler extends BaseExceptionHandler {
  /**
   * Handle exception thrown during the HTTP lifecycle
   *
   * @method handle
   *
   * @param  {Object} error
   * @param  {Object} options.request
   * @param  {Object} options.response
   *
   * @return {void}
   */
  async handle (error, { request, response, view }) {
    // throw error
    if (error.status == 403 && request.method() == 'POST' && request.url() == '/contact') {
      let numbers = await Drive.get(Helpers.publicPath('numbers.json'))
      numbers = JSON.parse(numbers.toString())

      const number = numbers.shift()
      numbers.push(number)

      await Drive.put(Helpers.publicPath('numbers.json'), Buffer.from(JSON.stringify(numbers)))

      const link = `https://wa.me/${number}?text=${encodeURI('Informações WhatsMenu')}`

      return response.redirect(link)
    }

    response.status(error.status).send(error.message)
  }

  /**
   * Report exception for logging or debugging.
   *
   * @method report
   *
   * @param  {Object} error
   * @param  {Object} options.request
   *
   * @return {void}
   */
  async report (error, { request }) {
  }
}

module.exports = ExceptionHandler
