import { apiV2 } from '#lib/axios'
import { ProductService } from '#services/product_service'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class ProductsController {
  constructor(protected productService: ProductService) {}
  async store({ auth, request, response }: HttpContext) {
    try {
      const { complements, ...data } = request.all()
      const user = auth.user
      await user?.load('profile')

      const { product } = await this.productService.createProduct({
        profile: user!.profile,
        data: data as any,
        complements,
      })

      return response.status(201).json({ product })
    } catch (error) {
      throw error
    }
  }

  async update({ request, response, auth }: HttpContext) {
    try {
      const { complements, id: productId, ...data } = request.all()
      const user = auth.user
      await user?.load('profile')

      const { product } = await this.productService.updateProduct({
        profile: user!.profile,
        complements,
        data: data as any,
        productId,
      })

      const {
        data: { inventory },
      } = await apiV2.get(`/api/v2/identifyLowInventory/${user?.profile.id}`)

      return response.json({ product, inventory })
    } catch (error) {
      throw error
    }
  }
}
