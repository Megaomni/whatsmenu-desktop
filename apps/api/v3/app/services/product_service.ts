import Complement from '#models/complement'
import Product from '#models/product'
import Profile from '#models/profile'
import env from '#start/env'
import encryption from '@adonisjs/core/services/encryption'
import { MultipartFile } from '@adonisjs/core/types/bodyparser'
import drive from '@adonisjs/drive/services/main'
import { ModelAttributes } from '@adonisjs/lucid/types/model'

interface CreateProductPayload {
  image: MultipartFile | null
  profile: Profile
  complements: ModelAttributes<Complement>[]
  recicle: ModelAttributes<Complement & { link: boolean }>[]
  data: ModelAttributes<Product>
}

export class ProductService {
  async createProduct({ image, profile, complements, recicle, data }: CreateProductPayload) {
    try {
      const product = await Product.create({
        name: data.name,
        order: data.order,
        categoryId: data.categoryId,
        description: data.description,
        promoteStatus: JSON.parse(data.promoteStatus as any),
        promoteStatusTable: JSON.parse(data.promoteStatusTable as any),
        value: Number(data.value) || 0,
        promoteValue: Number(data.promoteValue) || 0,
        valueTable: Number(data.valueTable) || 0,
        promoteValueTable: Number(data.promoteValueTable) || 0,
        disponibility: data.disponibility,
        ncm_code: data.ncm_code,
        status: true,
      })

      if (image) {
        const imageKey = `${env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${image.clientName}`
        await image.moveToDisk(imageKey, 's3', {
          contentType: image.headers['content-type'],
          visibility: 'public',
        })

        product.image = await drive.use('s3').getUrl(imageKey)
      }

      let newComplements: Array<Complement> = []

      if (complements) {
        newComplements = await product.related('complements').createMany(
          complements.map(({ id, ...complement }) => ({
            ...complement,
            itens: complement.itens.map((item) => ({
              ...item,
              code: encryption.encrypt(item.name).substring(0, 6),
            })),
          }))
        )
      }

      // if (recicle) {
      //   for (const complement of recicle) {
      //     if (complement.link) {
      //       const pivot = await product.related('complements').attach([])
      //       const newRecicledComplement = await Complement.find(complement.id)
      //       newRecicledComplement.pivot = pivot
      //       complementsRecicleds.push(newRecicledComplement)
      //     }
      //   }
      // }

      return { product: { ...product, complements: newComplements } }
    } catch (error) {
      throw error
    }
  }
}
