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
  product: Product
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

  // async updateProduct({ profile, complements, data, product, image }: UpdateProductPayload) {
  //   try {
  //     // Atualiza os dados básicos do produto
  //     product.merge({
  //       name: data.name ?? product.name,
  //       categoryId: data.categoryId ?? product.categoryId,
  //       description: data.description ?? '',
  //       disponibility: data.disponibility ?? product.disponibility,
  //       amount: data.amount || 0,
  //       amount_alert: data.amount_alert || 0,
  //       bypass_amount: data.bypass_amount !== undefined ? !!data.bypass_amount : true,
  //       value: data.value || product.value,
  //       valueTable: data.valueTable || product.valueTable,
  //       promoteValue: data.promoteValue || product.promoteValue,
  //       promoteValueTable: data.promoteValueTable || product.promoteValueTable,
  //       promoteStatus: data.promoteStatus ? data.promoteStatus : product.promoteStatus,
  //       promoteStatusTable: data.promoteStatusTable
  //         ? data.promoteStatusTable
  //         : product.promoteStatusTable,
  //     })

  //     // Se houver imagem, faz o upload
  //     if (image) {
  //       const imageName = `${Date.now()}_${image.clientName}`
  //       const imagePath = `uploads/${profile.slug}/products/${product.id}/${imageName}`

  //       await image.move(imagePath, {
  //         name: imageName,
  //         overwrite: true,
  //       })

  //       const imageUrl = await drive.getUrl(imagePath)

  //       // Se existir uma imagem anterior, deleta do storage
  //       if (product.image) {
  //         await drive.delete(product.image)
  //       }

  //       product.image = imageUrl
  //     }

  //     await product.save()

  //     // Tratando complementos removidos
  //     if (data.removeComplements) {
  //       const removeComplements = data.removeComplements
  //       for (const complementId of removeComplements) {
  //         const complement = await Complement.find(complementId)
  //         if (complement) {
  //           const relation = await ProductComplement.query()
  //             .where({ complementId: complement.id, productId: product.id })
  //             .first()

  //           if (relation) {
  //             await relation.delete()
  //           }

  //           const stillLinked = await ProductComplement.query().where('complementId', complement.id)
  //           if (stillLinked.length === 0) {
  //             await complement.delete()
  //           }
  //         }
  //       }
  //     }

  //     // Lidando com reciclagem de complementos
  //     const complementsRecicleds = []
  //     if (data.recicle) {
  //       const recicleComplements = data.recicle
  //       for (const complementData of recicleComplements) {
  //         const complement = await Complement.findOrFail(complementData.id)
  //         const relation = await ProductComplement.query()
  //           .where({ productId: product.id, complementId: complement.id })
  //           .first()

  //         if (!relation) {
  //           await ProductComplement.create({ productId: product.id, complementId: complement.id })
  //         }

  //         complementsRecicleds.push(complement)
  //       }
  //     }

  //     // Lidando com novos complementos
  //     const newComplements = []
  //     if (data.complements) {
  //       const complementsData = data.complements
  //       for (const complementData of complementsData) {
  //         let complement = (await Complement.find(complementData.id)) || new Complement()

  //         complement.merge({
  //           name: complementData.name,
  //           min: complementData.min,
  //           max: complementData.max,
  //           required: complementData.required,
  //           itens: complementData.itens.map((item) => ({
  //             ...item,
  //             code: item.code || Encryption.encrypt(item.name).substring(0, 6),
  //             status: JSON.parse(item.status),
  //             value: Number(item.value),
  //           })),
  //         })

  //         await complement.save()

  //         if (!complementData.pivot) {
  //           await ProductComplement.create({ productId: product.id, complementId: complement.id })
  //         }

  //         newComplements.push(complement)
  //       }
  //     }

  //     product.complements = [...newComplements, ...complementsRecicleds]

  //     // Verificando inventário
  //     let inventory = { low: [], soldOut: [] }
  //     if (profile.options.inventoryControl) {
  //       inventory = await InventoryProvider.identifyLowInventory(profile.id)
  //     }

  //     return { product, inventory }
  //   } catch (error) {}
  // }
}
