import { loadStripe } from '@stripe/stripe-js'
import { stripe } from './stripe'

export async function getStripeJS() {
  return await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string)
}
