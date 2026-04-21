import { reactive } from 'vue'

export interface DeliveryAddress {
  fullName: string
  line1: string
  line2: string
  city: string
  state: string
  zip: string
  country: string
}

const address = reactive<DeliveryAddress>({
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: 'United States',
})

export function useCheckout() {
  return { address }
}
