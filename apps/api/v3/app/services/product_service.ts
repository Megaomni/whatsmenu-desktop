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
export interface CreateProductPayload {
  image?: MultipartFile | null
  profile: Profile
  complements: NewComplement[]
  data: ModelAttributes<Product> & { imageName?: string }
}

export interface UpdateProductPayload {
  image?: MultipartFile | null
  profile: Profile
  complements: NewComplement[]
  data: ModelAttributes<Product> & { imageName?: string }
  productId: Product['id']
}

export class ProductService {
  /**
   * Cria um novo produto e seus complementos associados.
   * @param {CreateProductPayload} payload - Dados do produto e seus complementos.
   * @returns {Promise<{ product: Product }>} - O produto criado com seus complementos associados.
   */
  async createProduct({ profile, complements, data }: CreateProductPayload) {
    try {
      const product = await Product.create({
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        order: data.order,
        value: data.value,
        valueTable: data.valueTable,
        promoteStatus: data.promoteStatus,
        promoteValue: data.promoteValue,
        promoteStatusTable: data.promoteStatusTable,
        promoteValueTable: data.promoteValueTable,
        disponibility: data.disponibility,
        ncm_code: data.ncm_code,
        amount: data.amount,
        amount_alert: data.amount_alert,
        bypass_amount: data.bypass_amount,
        status: true,
      })

      if (data.image) {
        const imageKey = `${env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${data.imageName}`
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

      await product.load('complements')

      // Retornando o produto criado junto com os complementos associados
      return { product }
    } catch (error) {
      throw error
    }
  }

  /**
   * Atualiza um produto e seus complementos.
   *
   * @param {Object} params
   * @param {Profile} params.profile - O perfil do produto.
   * @param {Number} params.productId - O ID do produto.
   * @param {Array<NewComplement | VinculatedComplement>} params.complements - Os complementos do produto.
   * @param {Object} params.data - Os dados do produto.
   * @param {Number} params.data.categoryId - O ID da categoria do produto.
   * @param {String} params.data.name - O nome do produto.
   * @param {String} params.data.description - A descri o do produto.
   * @param {Number} params.data.order - A ordem do produto.
   * @param {Number} params.data.value - O valor do produto.
   * @param {Number} params.data.valueTable - O valor do produto na mesa.
   * @param {Boolean} params.data.promoteStatus - O status da promo o do produto.
   * @param {Number} params.data.promoteValue - O valor da promo o do produto.
   * @param {Boolean} params.data.promoteStatusTable - O status da promo o do produto na mesa.
   * @param {Number} params.data.promoteValueTable - O valor da promo o do produto na mesa.
   * @param {Object} params.data.disponibility - A disponibilidade do produto.
   * @param {String} params.data.ncm_code - O C digo NCM do produto.
   * @param {Number} params.data.amount - A quantidade do produto.
   * @param {Number} params.data.amount_alert - A quantidade de alerta do produto.
   * @param {Boolean} params.data.bypass_amount - Se o produto tem bypass de quantidade.
   * @param {String} [params.data.image] - A imagem do produto.
   */
  async updateProduct({ profile, productId, complements, data }: UpdateProductPayload) {
    try {
      const product = await Product.findOrFail(productId)
      await product
        .merge({
          categoryId: data.categoryId,
          name: data.name,
          description: data.description,
          order: data.order,
          value: data.value,
          valueTable: data.valueTable,
          promoteStatus: data.promoteStatus,
          promoteValue: data.promoteValue,
          promoteStatusTable: data.promoteStatusTable,
          promoteValueTable: data.promoteValueTable,
          disponibility: data.disponibility,
          ncm_code: data.ncm_code,
          amount: data.amount,
          amount_alert: data.amount_alert,
          bypass_amount: data.bypass_amount,
        })
        .save()

      if (data.image) {
        const imageKey = `${env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${data.imageName}`
        const buffer = Buffer.from(data.image, 'base64')
        await drive.use('s3').put(imageKey, buffer, {
          contentType: 'image/webp',
          visibility: 'public',
        })

        product.image = await drive.use('s3').getUrl(imageKey)
      }

      await product.save()

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

      // Atualizando complementos já vinculados (reutilizados)
      for (const complement of vinculatedComplements) {
        let complementToUpdate = await Complement.find(complement.id)
        if (complementToUpdate) {
          await complementToUpdate.merge(complement).save()
        }
      }

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

      complements = [...vinculatedComplements, ...newComplements]

      await product.related('complements').sync(complements.map((complement) => complement.id))
      await new Promise<void>((resolve) => setTimeout(resolve, 5000))
      await product.load('complements')

      return { product }
    } catch (error) {
      throw error
    }
  }
}
