import { ProductService } from '#services/product_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ProductsController {
  constructor(protected productService: ProductService) {}
  async store({ auth, request, response }: HttpContext) {
    try {
      const { complements, recicle, ...data } = request.all()
      const user = auth.user
      await user?.load('profile')

      const { product } = await this.productService.createProduct({
        profile: user!.profile,
        data: data as any,
        complements,
      })

      return response.json({ product })
    } catch (error) {
      throw error
    }
  }
}
