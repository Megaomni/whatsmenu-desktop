'use strict'

/*
|--------------------------------------------------------------------------
| CreateTagSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Tag = use('App/Models/v3/Tag')
class CreateTagSeeder {
  async run () {
    try {
      await Tag.createMany([
        {name: 'Açai', type: 'gastronomy', image: '/img/iconcategoria/acai.webp', status: true},
        {name: 'Arabe', type: 'gastronomy', image: '/img/iconcategoria/arabe.webp', status: true},
        {name: 'Carne', type: 'gastronomy', image: '/img/iconcategoria/carne.webp', status: true},
        {name: 'Chinesa', type: 'gastronomy', image: '/img/iconcategoria/chinesa.webp', status: true},
        {name: 'Doces e Bolos', type: 'gastronomy', image: '/img/iconcategoria/doces.webp', status: true},
        {name: 'Feijoada', type: 'gastronomy', image: '/img/iconcategoria/feijoada.webp', status: true},
        {name: 'Frutos do Mar', type: 'gastronomy', image: '/img/iconcategoria/frutos-do-mar.webp', status: true},
        {name: 'Goumert', type: 'gastronomy', image: '/img/iconcategoria/goumert.webp', status: true},
        {name: 'Italiana', type: 'gastronomy', image: '/img/iconcategoria/italiana.webp', status: true},
        {name: 'Japonesa', type: 'gastronomy', image: '/img/iconcategoria/japonesa.webp', status: true},
        {name: 'Hamburguer', type: 'gastronomy', image: '/img/iconcategoria/lanche.webp', status: true},
        {name: 'Padaria', type: 'gastronomy', image: '/img/iconcategoria/padaria.webp', status: true},
        {name: 'Pizza', type: 'gastronomy', image: '/img/iconcategoria/pizza.webp', status: true},
        {name: 'PUB', type: 'gastronomy', image: '/img/iconcategoria/pub.webp', status: true},
        {name: 'Salgados', type: 'gastronomy', image: '/img/iconcategoria/salgados.webp', status: true},
        {name: 'Saudável', type: 'gastronomy', image: '/img/iconcategoria/saudavel.webp', status: true},
        {name: 'Sushi', type: 'gastronomy', image: '/img/iconcategoria/sushi.webp', status: true},
        {name: 'Tradicional', type: 'gastronomy', image: '/img/iconcategoria/tradicional.webp', status: true},
        {name: 'Vegetariana', type: 'gastronomy', image: '/img/iconcategoria/vegetariana.webp', status: true},
        {name: 'Vegetariana', type: 'restrict', status: true},
        {name: 'Vegana', type: 'restrict', status: true},
        {name: 'Sem Glúten', type: 'restrict', status: true}
      ])
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = CreateTagSeeder
