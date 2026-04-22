import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  image?: string
}

const toasts = ref<Toast[]>([])
let counter = 0

function showToast(message: string, image?: string) {
  const id = counter++
  toasts.value.push({ id, message, image })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

export function useToast() {
  return { toasts, showToast }
}
