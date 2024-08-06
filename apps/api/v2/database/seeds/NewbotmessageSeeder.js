'use strict'

/*
|--------------------------------------------------------------------------
| NewbotmessageSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Profile = use('App/Models/Profile')
const Logger = use('Logger')

class NewbotmessageSeeder {
  async run () {
    try {
      const profiles = await Profile.all()
      for (const profile of profiles.rows) {
        if (profile && profile.options.placeholders) {
          profile.options.placeholders = {
            ...profile.options.placeholders,
            welcomeMessage: `Olá! Seja bem vindo ao ${profile.name}

Veja o nosso cardápio e faça seu pedido rapidamente

https://www.whatsmenu.com.br/${profile.slug}

Equipe ${profile.name}`,
            absenceMessage: `Olá [Nome], estamos fechados no momento.

Os horários de funcionamento e o cardápio completo você pode consultar em https://whatsmenu.com.br/${profile.slug}

Até mais`,
          }
          Logger.info(`${profile.slug} Atualizado com sucesso`)
          try {
            await profile.save()
          } catch (error) {
            console.error(profile.slug, error);            
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = NewbotmessageSeeder
