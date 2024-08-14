const { default: Stripe } = require('stripe')
const Env = use('Env')

const stripe = new Stripe(Env.get('STRIPE_API_KEY'), {
  apiVersion: '2022-11-15',
  appInfo: {
    name: 'Whatsmenu',
    version: '0.1.0',
  },
})

module.exports = stripe
