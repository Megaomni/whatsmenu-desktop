import Complement from '#models/complement'
import Product from '#models/product'
import Profile from '#models/profile'
import env from '#start/env'
import encryption from '@adonisjs/core/services/encryption'
import { MultipartFile } from '@adonisjs/core/types/bodyparser'
import drive from '@adonisjs/drive/services/main'
import { ModelAttributes } from '@adonisjs/lucid/types/model'

type NewComplement = ModelAttributes<Complement>
type VinculatedComplement = ModelAttributes<Omit<Complement, 'id'>>
interface CreateProductPayload {
  image?: MultipartFile | null
  profile: Profile
  complements: NewComplement[]
  data: ModelAttributes<Product>
}

export class ProductService {
  async createProduct({ image, profile, complements, data }: CreateProductPayload) {
    try {
      const product = await Product.create({
        name: data.name,
        order: data.order,
        categoryId: data.categoryId,
        description: data.description,
        promoteStatus: data.promoteStatus,
        promoteStatusTable: data.promoteStatusTable,
        value: data.value,
        promoteValue: data.promoteValue,
        valueTable: data.valueTable,
        promoteValueTable: data.promoteValueTable,
        disponibility: data.disponibility,
        ncm_code: data.ncm_code,
        status: true,
      })

      if (data.image) {
        const imageKey = `${env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${'teste'}`
        const buffer = Buffer.from(data.image, 'base64')
        await drive.use('s3').put(imageKey, buffer, {
          contentType: 'image/webp',
          visibility: 'public',
        })

        // await image.moveToDisk(imageKey, 's3', {
        //   contentType: image.headers['content-type'],
        //   visibility: 'public',
        // })

        product.image = await drive.use('s3').getUrl(imageKey)
        console.log(product.image)

        await product.save()
      }

      let [newComplements, vinculatedComplements] = complements.reduce<
        [NewComplement[], VinculatedComplement[]]
      >(
        ([newComps, vinculatedComps], complement): [NewComplement[], VinculatedComplement[]] => {
          if (complement.id) {
            vinculatedComps.push(complement)
          } else {
            newComps.push(complement)
          }
          return [newComps, vinculatedComps]
        },
        [[], []]
      )

      if (complements) {
        newComplements = await product.related('complements').createMany(
          newComplements.map(({ id, ...complement }) => ({
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

      return { product: { ...product } }
    } catch (error) {
      throw error
    }
  }
}
