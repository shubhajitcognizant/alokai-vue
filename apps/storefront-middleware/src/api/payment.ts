/**
 * Payment API — src/api/payment.ts
 *
 * Exposes POST /api/create-payment-intent to the frontend.
 *
 * WHY SERVER-SIDE?
 * The Stripe secret key must NEVER be exposed in browser code.
 * The frontend sends the order amount, this endpoint calls Stripe with
 * the secret key, and returns only a short-lived `clientSecret` token.
 * The frontend then uses that token to confirm the payment directly with
 * Stripe — our server never sees the card details.
 */

import { Router } from 'express'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export const paymentRouter = Router()

// POST /api/create-payment-intent
// Body: { amount: number }  — amount in cents (e.g. $29.99 → 2999)
paymentRouter.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body as { amount: number }

  if (!amount || amount < 50) {
    res.status(400).json({ error: 'Invalid amount. Minimum is $0.50.' })
    return
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
    })

    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Payment setup failed.'
    res.status(500).json({ error: message })
  }
})
