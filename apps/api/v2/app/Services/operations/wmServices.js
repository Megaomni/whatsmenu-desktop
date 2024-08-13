const SystemProduct = use('App/Models/SystemProduct')

class WmServices {
  async getSystemProduct(whereFunction) {
    const product = await SystemProduct.query().where(whereFunction).first()
    return product
  }
}
