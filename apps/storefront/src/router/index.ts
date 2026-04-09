import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import SignUpPage from '../pages/SignUpPage.vue'
import UserProfilePage from '../pages/UserProfilePage.vue'
import { useAuth } from '../modules/auth/useAuth'
import OrderHistoryPage from '../pages/OrderHistoryPage.vue'
import ProductDetailPage from '../pages/ProductDetailPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/login', component: LoginPage },
    { path: '/signup', component: SignUpPage},
    { path: '/user', component:UserProfilePage ,meta: { requiresAuth: true }  },
    { path: '/orders', component:OrderHistoryPage ,meta: { requiresAuth: true }},
    {
      path: '/product/:id',
      component: ProductDetailPage,
    },
  ],
})
router.beforeEach((to) => {
  const { isLoggedIn, isGuest } = useAuth()
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { path: '/login' }
  }
  // Guest users cannot access the user profile page
  if (to.path === '/user' && isGuest.value) {
    return { path: '/' }
  }
})

export default router
