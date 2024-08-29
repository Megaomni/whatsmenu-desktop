import Complement from '#models/complement'
import { PizzaFlavorType, PizzaImplementationType } from './pizza.js'

export type CartItenDetails = {
  value: number
  complements: Complement[]
  flavors?: PizzaFlavorType[]
  implementations?: PizzaImplementationType[]
}
