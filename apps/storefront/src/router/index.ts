import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import SignUpPage from '../pages/SignUpPage.vue'
import ForgotPasswordPage from '../pages/ForgotPasswordPage.vue'
import UserProfilePage from '../pages/UserProfilePage.vue'
import OrderHistoryPage from '../pages/OrderHistoryPage.vue'
import OrderDetailPage from '../pages/OrderDetailPage.vue'
import ProductDetailPage from '../pages/ProductDetailPage.vue'
import CartPage from '../pages/CartPage.vue'
import CheckoutPage from '../pages/CheckoutPage.vue'
import PaymentPage from '../pages/PaymentPage.vue'
import OrderSuccessPage from '../pages/OrderSuccessPage.vue'
import { useAuth, authReady } from '../modules/auth/useAuth'
import SidePanelPage from '../pages/SidePanelPage.vue'
import ProductListPage from '../pages/ProductListPage.vue'
import SearchPage from '../pages/SearchPage.vue'
import WishlistPage from '../pages/WishlistPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage },
    { path: '/signup', component: SignUpPage },
    { path: '/forgot-password', component: ForgotPasswordPage },
    { path: '/product/:id', component: ProductDetailPage },
    { path: '/plp', component: ProductListPage },
    { path: '/search', component: SearchPage },
    { path: '/cart', component: CartPage },
    { path: '/user', component: UserProfilePage, meta: { requiresAuth: true } },
    { path: '/orders', component: OrderHistoryPage, meta: { requiresAuth: true } },
    { path: '/orders/:id', component: OrderDetailPage, meta: { requiresAuth: true } },
    { path: '/checkout', component: CheckoutPage, meta: { requiresAuth: true } },
    { path: '/checkout/payment', component: PaymentPage, meta: { requiresAuth: true } },
    { path: '/order-success', component: OrderSuccessPage, meta: { requiresAuth: true } },
    { path: '/account', component: SidePanelPage, meta: { requiresAuth: true } },
    { path: '/wishlist', component: WishlistPage, meta: { requiresAuth: true } },
    { path: '/:pathMatch(.*)*', component: NotFoundPage },
  ],
})

router.beforeEach(async (to) => {
  await authReady
  const { isLoggedIn, isGuest } = useAuth()
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/user' && isGuest.value) {
    return { path: '/' }
  }
})

export default router
