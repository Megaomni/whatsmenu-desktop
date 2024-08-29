import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class LogRequestMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    const { name, reference } = ctx.route?.handler as unknown as {
      name: string
      reference: string[]
    }

    if (reference) {
      console.log(`(Rota: ${ctx.routeKey}) - ${name}.${reference[1]} `)
    }
    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}
