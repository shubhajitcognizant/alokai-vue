import { ref } from 'vue'
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase/config'

export interface SavedAddress {
  id: string
  label: string
  fullName: string
  line1: string
  line2: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
}

const savedAddresses = ref<SavedAddress[]>([])
const addressesLoading = ref(false)

export function useSavedAddresses() {
  async function load(userId: string) {
    addressesLoading.value = true
    try {
      const snap = await getDocs(
        query(collection(db, 'users', userId, 'savedAddresses'), orderBy('isDefault', 'desc'))
      )
      savedAddresses.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedAddress))

      // Migrate legacy single address from user doc if subcollection is empty
      if (savedAddresses.value.length === 0) {
        const userSnap = await getDoc(doc(db, 'users', userId))
        const legacy = userSnap.data()?.address
        if (legacy?.line1) {
          const migrated = {
            label: 'Home',
            fullName: legacy.fullName ?? '',
            line1: legacy.line1 ?? '',
            line2: legacy.line2 ?? '',
            city: legacy.city ?? '',
            state: legacy.state ?? '',
            zip: legacy.zip ?? '',
            country: legacy.country ?? 'United States',
            isDefault: true,
          }
          const docRef = await addDoc(collection(db, 'users', userId, 'savedAddresses'), migrated)
          savedAddresses.value = [{ ...migrated, id: docRef.id }]
        }
      }
    } catch {
      savedAddresses.value = []
    } finally {
      addressesLoading.value = false
    }
  }

  async function clearDefaults(userId: string) {
    const defaults = savedAddresses.value.filter(a => a.isDefault)
    await Promise.all(
      defaults.map(a =>
        updateDoc(doc(db, 'users', userId, 'savedAddresses', a.id), { isDefault: false })
      )
    )
  }

  async function addAddress(userId: string, address: Omit<SavedAddress, 'id'>) {
    if (address.isDefault) await clearDefaults(userId)
    const docRef = await addDoc(collection(db, 'users', userId, 'savedAddresses'), address)
    const newEntry = { ...address, id: docRef.id }
    if (address.isDefault) {
      savedAddresses.value = [newEntry, ...savedAddresses.value.map(a => ({ ...a, isDefault: false }))]
    } else {
      savedAddresses.value = [...savedAddresses.value, newEntry]
    }
  }

  async function updateAddress(userId: string, id: string, address: Omit<SavedAddress, 'id'>) {
    if (address.isDefault) await clearDefaults(userId)
    await updateDoc(doc(db, 'users', userId, 'savedAddresses', id), address)
    savedAddresses.value = savedAddresses.value.map(a =>
      a.id === id
        ? { ...address, id }
        : address.isDefault ? { ...a, isDefault: false } : a
    )
    if (address.isDefault) {
      savedAddresses.value.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
    }
  }

  async function deleteAddress(userId: string, id: string) {
    await deleteDoc(doc(db, 'users', userId, 'savedAddresses', id))
    savedAddresses.value = savedAddresses.value.filter(a => a.id !== id)
  }

  async function setDefault(userId: string, id: string) {
    await clearDefaults(userId)
    await updateDoc(doc(db, 'users', userId, 'savedAddresses', id), { isDefault: true })
    savedAddresses.value = savedAddresses.value.map(a => ({ ...a, isDefault: a.id === id }))
    savedAddresses.value.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
  }

  function clearAddresses() {
    savedAddresses.value = []
  }

  return {
    savedAddresses,
    addressesLoading,
    load,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
    clearAddresses,
  }
}
