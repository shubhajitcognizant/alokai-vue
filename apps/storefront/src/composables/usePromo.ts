import { ref, computed } from 'vue'

interface PromoCode {
  type: 'percent' | 'fixed'
  value: number
  description: string
}

const CODES: Record<string, PromoCode> = {
  SHOPVUE:  { type: 'percent', value: 10, description: '10% off your order' },
  SAVE20:   { type: 'percent', value: 20, description: '20% off your order' },
  FIRST10:  { type: 'fixed',   value: 10, description: '$10 off your order' },
  FREESHIP: { type: 'fixed',   value: 0,  description: 'Free shipping applied' },
}

const appliedCode = ref<string | null>(null)
const appliedPromo = ref<PromoCode | null>(null)

export function usePromo() {
  const discount = computed(() => {
    if (!appliedPromo.value || !appliedCode.value) return 0
    return appliedPromo.value.value
  })

  const discountType = computed(() => appliedPromo.value?.type ?? 'percent')
  const promoDescription = computed(() => appliedPromo.value?.description ?? '')

  function calcDiscount(subtotal: number): number {
    if (!appliedPromo.value) return 0
    if (appliedPromo.value.type === 'percent') {
      return +(subtotal * appliedPromo.value.value / 100).toFixed(2)
    }
    return Math.min(appliedPromo.value.value, subtotal)
  }

  function applyCode(code: string): { success: boolean; message: string } {
    const upper = code.trim().toUpperCase()
    const promo = CODES[upper]
    if (!promo) {
      return { success: false, message: 'Invalid promo code. Try SHOPVUE or SAVE20.' }
    }
    appliedCode.value = upper
    appliedPromo.value = promo
    return { success: true, message: promo.description }
  }

  function removeCode() {
    appliedCode.value = null
    appliedPromo.value = null
  }

  return {
    appliedCode,
    promoDescription,
    discount,
    discountType,
    calcDiscount,
    applyCode,
    removeCode,
  }
}
