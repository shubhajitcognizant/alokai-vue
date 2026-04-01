/**
 * Middleware Config — src/config/middleware.config.ts
 *
 * In a real Alokai project, this file registers all active integrations
 * (commercetools, Contentful, Algolia, etc.) and their credentials.
 * The middleware reads this config to know which integration to call.
 */

export const middlewareConfig = {
  integrations: {
    // The key 'fakeStore' is the integration name.
    // The middleware routes calls to the correct connector based on this.
    fakeStore: {
      baseUrl: 'https://fake-store-api.mock.beeceptor.com/api',
    },
  },
}
