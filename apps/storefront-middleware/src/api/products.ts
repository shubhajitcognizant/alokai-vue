/**
 * Products API — src/api/products.ts
 *
 * Exposes GET /api/products to the frontend.
 * In a real project this would call commercetools/Shopify/Magento.
 * Here we proxy the fake-store-api to simulate the pattern.
 */

import { Router } from 'express'

export const productsRouter = Router()

const UPSTREAM = 'https://fake-store-api.mock.beeceptor.com/api'

// GET /api/products — returns all products
productsRouter.get('/products', async (_req, res) => {
  try {
    const upstream = await fetch(`${UPSTREAM}/products`)
    const data = await upstream.json()
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET /api/products/:id — returns a single product
productsRouter.get('/products/:id', async (req, res) => {
  try {
    const upstream = await fetch(`${UPSTREAM}/products/${req.params.id}`)
    const data = await upstream.json()
    res.json(data)
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})
