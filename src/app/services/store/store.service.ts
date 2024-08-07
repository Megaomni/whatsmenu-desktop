import { Injectable } from '@angular/core'
import { DateTime } from 'luxon'
import { CartService } from '../cart/cart.service'

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  constructor(public cartService: CartService) {}

  /** Função para verificar a disponibilidade de datas dos itens cardápio */
  public verifyDateDisponibility(categories) {
    categories.forEach((category) => {
      if (category.type === 'default') {
        category.products.forEach((product) => {
          const dayName = DateTime.local().setLocale('en-US').weekdayLong.toLowerCase()
          const nowTime = DateTime.local().toFormat('HH:mm')
          product.isAvaliable = product.disponibility.week[dayName].some((hour) => nowTime > hour.open && nowTime < hour.close && hour.active)
          product.quantity = 1
        })
        // if (!this.context.profile.options.disponibility.showProductsWhenPaused) {
        //   category.products = category.products.filter(product => product.status)
        // }
      }
      if (category.type === 'pizza') {
        category.pizzas = this.cartService.pizzaMenuFormat(category.product)
      }
    })
  }
}
