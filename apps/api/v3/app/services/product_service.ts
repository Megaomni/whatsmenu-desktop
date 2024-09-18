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
  data: ModelAttributes<Product>
}

export interface UpdateProductPayload {
  image?: MultipartFile | null
  profile: Profile
  complements: NewComplement[]
  data: ModelAttributes<Product>
  productId: Product['id']
}

export class ProductService {
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

      await product.load('complements')

      // Retornando o produto criado junto com os complementos associados
      return { product }
    } catch (error) {
      throw error
    }
  }

  // async updateProduct({ profile, productId, complements, data }: UpdateProductPayload) {
  //   try {
  //     const product = await Product.findOrFail(productId)

  //     // Atualizando os dados principais do produto
  //     product.merge({
  //       categoryId: data.categoryId,
  //       name: data.name,
  //       description: data.description,
  //       order: data.order,
  //       value: data.value,
  //       valueTable: data.valueTable,
  //       promoteStatus: data.promoteStatus,
  //       promoteValue: data.promoteValue,
  //       promoteStatusTable: data.promoteStatusTable,
  //       promoteValueTable: data.promoteValueTable,
  //       disponibility: data.disponibility,
  //       ncm_code: data.ncm_code,
  //       amount: data.amount,
  //       amount_alert: data.amount_alert,
  //       bypass_amount: data.bypass_amount,
  //     })

  //     if (data.image) {
  //       const imageKey = `${env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${'teste'}`
  //       const buffer = Buffer.from(data.image, 'base64')
  //       await drive.use('s3').put(imageKey, buffer, {
  //         contentType: 'image/webp',
  //         visibility: 'public',
  //       })

  //       product.image = await drive.use('s3').getUrl(imageKey)
  //     }

  //     await product.save()

  //     // Separando complementos novos dos complementos vinculados já existentes
  //     let [newComplements, vinculatedComplements] = complements.reduce<
  //       [NewComplement[], VinculatedComplement[]]
  //     >(
  //       ([newComps, vinculatedComps], complement): [NewComplement[], VinculatedComplement[]] => {
  //         if (complement.id) {
  //           vinculatedComps.push(complement)
  //         } else {
  //           newComps.push(complement)
  //         }
  //         return [newComps, vinculatedComps]
  //       },
  //       [[], []]
  //     )

  //     // Criando novos complementos
  //     if (newComplements.length) {
  //       newComplements = await product.related('complements').createMany(
  //         newComplements.map(({ id, ...complement }) => ({
  //           ...complement,
  //           itens:
  //             complement.itens.map((item) => ({
  //               ...item,
  //               code: encryption.encrypt(item.name).substring(0, 6),
  //             })) || [],
  //         }))
  //       )
  //     }

  //     // Vinculando complementos já existentes (reutilizados)
  //     if (vinculatedComplements.length) {
  //       await product
  //         .related('complements')
  //         .attach(vinculatedComplements.map((complement) => complement.id))
  //     }

  //     await product.load('complements')

  //     const complementsToRemove = product.complements
  //       .filter((complement) => !complements.some((c) => c.id === complement.id))
  //       .map((complement) => complement.id)

  //     await product.related('complements').detach(complementsToRemove)
  //     await product.load('complements')

  //     // Retornando o produto atualizado com seus complementos
  //     return { product }
  //   } catch (error) {
  //     throw error
  //   }
  // }

  async updateProduct({ profile, productId, complements, data }: UpdateProductPayload) {
    try {
      const product = await Product.findOrFail(productId)

      // Atualizando os dados principais do produto
      product.merge({
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

      if (data.image) {
        const imageKey = `${env.get('NODE_ENV')}/${profile.slug}/products/${product.id}/${'teste'}`
        const buffer = Buffer.from(data.image, 'base64')
        await drive.use('s3').put(imageKey, buffer, {
          contentType: 'image/webp',
          visibility: 'public',
        })

        product.image = await drive.use('s3').getUrl(imageKey)
      }

      await product.save()

      // Carregando complementos existentes para comparação
      await product.load('complements')
      const existingComplements = product.complements.map((complement) => complement.id)

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

      // Atualizando complementos já vinculados (reutilizados)
      if (vinculatedComplements.length) {
        const complementIds = vinculatedComplements.map((complement) => complement.id)

        // Remover complementos que não estão mais vinculados
        const complementsToRemove = existingComplements.filter(
          (existingId) => !complementIds.includes(existingId)
        )
        if (complementsToRemove.length) {
          await product.related('complements').detach(complementsToRemove)
        }

        // Anexar os novos complementos reutilizados
        await product.related('complements').sync(complementIds)
      } else {
        // Se nenhum complemento vinculado, remover todos os existentes
        await product.related('complements').detach(existingComplements)
      }

      // Criando novos complementos (caso tenha)
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

      // Carregando complementos atualizados
      await product.load('complements')

      // Retornando o produto atualizado com seus complementos
      return { product }
    } catch (error) {
      throw error
    }
  }
}
