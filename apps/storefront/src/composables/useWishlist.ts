import { ref, computed } from 'vue'
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export interface WishlistItem {
  product_id: number
  name: string
  price: number
  image: string
  category: string
}

const items = ref<WishlistItem[]>([])
const loaded = ref(false)

const GUEST_KEY = 'shopvue_wishlist'

export function useWishlist() {
  const count = computed(() => items.value.length)

  function isWishlisted(productId: number) {
    return items.value.some(i => i.product_id === productId)
  }

  async function load(userId?: string) {
    if (loaded.value) return
    if (userId) {
      try {
        const snap = await getDoc(doc(db, 'users', userId))
        const saved = snap.data()?.wishlist as WishlistItem[] | undefined
        items.value = saved ?? []
      } catch {
        items.value = []
      }
    } else {
      try {
        const raw = localStorage.getItem(GUEST_KEY)
        items.value = raw ? JSON.parse(raw) : []
      } catch {
        items.value = []
      }
    }
    loaded.value = true
  }

  async function persist(userId?: string) {
    if (userId) {
      try {
        await updateDoc(doc(db, 'users', userId), { wishlist: items.value })
      } catch {
        await setDoc(doc(db, 'users', userId), { wishlist: items.value }, { merge: true })
      }
    } else {
      localStorage.setItem(GUEST_KEY, JSON.stringify(items.value))
    }
  }

  async function toggle(item: WishlistItem, userId?: string) {
    if (!loaded.value) await load(userId)
    if (isWishlisted(item.product_id)) {
      items.value = items.value.filter(i => i.product_id !== item.product_id)
    } else {
      items.value = [...items.value, item]
    }
    await persist(userId)
  }

  async function remove(productId: number, userId?: string) {
    items.value = items.value.filter(i => i.product_id !== productId)
    await persist(userId)
  }

  function clearWishlist() {
    items.value = []
    loaded.value = false
  }

  return { items, count, isWishlisted, load, toggle, remove, clearWishlist }
}
