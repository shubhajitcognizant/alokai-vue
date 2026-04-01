/**
 * Cart API — src/api/cart.ts
 *
 * Exposes cart endpoints to the frontend.
 * In a real project, POST /api/cart/add would call the commerce platform's
 * cart mutation (e.g. Shopify storefront API, commercetools cart update).
 */

import { Router } from 'express'

export const cartRouter = Router()

const UPSTREAM = 'https://fake-store-api.mock.beeceptor.com/api'

// GET /api/carts — returns cart(s) for the current user
cartRouter.get('/carts', async (_req, res) => {
  try {
    const upstream = await fetch(`${UPSTREAM}/carts`)
    const data = await upstream.json()
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch cart' })
  }
})
