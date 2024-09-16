import Complement from '#models/complement'
import Product from '#models/product'
import Profile from '#models/profile'
import env from '#start/env'
import encryption from '@adonisjs/core/services/encryption'
import { MultipartFile } from '@adonisjs/core/types/bodyparser'
import drive from '@adonisjs/drive/services/main'
import { ModelAttributes } from '@adonisjs/lucid/types/model'

type NewComplement = ModelAttributes<Complement>
type VinculatedComplement = ModelAttributes<Complement>
export interface CreateProductPayload<Partial> {
  image?: MultipartFile | null
  profile: Profile
  complements: NewComplement[]
  data: ModelAttributes<Product>
}

export class ProductService {
  async createProduct({ profile, complements, data }: CreateProductPayload<Partial<Product>>) {
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

        product.image = await drive.use('s3').getUrl(imageKey)

        await product.save()
      }

      // Separando complementos novos dos complementos vinculados já existentes
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

      // Criando novos complementos
      if (newComplements.length) {
        newComplements = await product.related('complements').createMany(
          newComplements.map(({ id, ...complement }) => ({
            ...complement,
            itens:
              complement.itens.map((item) => ({
                ...item,
                code: encryption.encrypt(item.name).substring(0, 6),
              })) || [],
          }))
        )
      }

      // Vinculando complementos já existentes (reutilizados)
      if (vinculatedComplements.length) {
        await product
          .related('complements')
          .attach(vinculatedComplements.map((complement) => complement.id))
      }

      // Retornando o produto criado junto com os complementos associados
      return { product: { ...product, complements: [...newComplements, ...vinculatedComplements] } }
    } catch (error) {
      throw error
    }
  }
}
