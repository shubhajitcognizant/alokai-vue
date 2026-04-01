/**
 * Fake Store Integration — src/integrations/fake-store/index.ts
 *
 * In a real Alokai project, each folder here would be a connector to a
 * specific platform: commercetools/, shopify/, magento/, etc.
 *
 * This connector wraps the fake-store-api and normalises the response
 * into a clean format the frontend can depend on regardless of which
 * backend is actually being used.
 */

const BASE_URL = 'https://fake-store-api.mock.beeceptor.com/api'

export async function getProducts() {
  const res = await fetch(`${BASE_URL}/products`)
  return res.json()
}

export async function getProductById(id: number) {
  const res = await fetch(`${BASE_URL}/products/${id}`)
  return res.json()
}

export async function getCarts() {
  const res = await fetch(`${BASE_URL}/carts`)
  return res.json()
}
