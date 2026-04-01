/**
 * Middleware Entry Point — src/index.ts
 *
 * In a real Alokai project, this Express server acts as the integration layer
 * between the frontend and backend systems (commercetools, Shopify, Magento, etc.)
 *
 * The frontend NEVER calls the commerce platform directly.
 * It calls THIS middleware, which then calls the appropriate backend.
 *
 * Flow:
 *   Frontend (Vue) → Middleware (Express) → Commerce/CMS/Search API
 *
 * For this learning project, the middleware simply proxies
 * the fake-store-api to demonstrate the pattern.
 */

import express from 'express'
import { productsRouter } from './api/products.js'
import { cartRouter } from './api/cart.js'

const app = express()
const PORT = 3000

app.use(express.json())

// All API routes are mounted under /api
app.use('/api', productsRouter)
app.use('/api', cartRouter)

app.listen(PORT, () => {
  console.log(`Middleware running at http://localhost:${PORT}`)
})
