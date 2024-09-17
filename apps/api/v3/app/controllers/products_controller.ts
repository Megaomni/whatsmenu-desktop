import Product from '#models/product'
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

  async update({ request, params, response, auth }: HttpContext) {
    try {
      const { complements, recicle, ...data } = request.all()
      const image = request.file('image', { size: '8mb' })
      const user = auth.user
      const product = Product.findOrFail(params.id)
      await user?.load('profile')

      const { productUpdated }  = await this.productService.updateProduct({
        profile: user!.profile,
        complements,
        data,
        image?,
        product
      })

      return response.json({ productUpdated })
    } catch (error) {
      throw error
    }
  }
}
