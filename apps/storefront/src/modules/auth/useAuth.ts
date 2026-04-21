import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'

export interface AuthUser {
  user_id: string
  username: string
  email: string
  isGuest?: boolean
}

const GUEST_KEY = 'shopvue_user'

const currentUser = ref<AuthUser | null>(null)
const isLoginOpen = ref(false)
const loginError = ref('')
const loginLoading = ref(false)

// Resolves after Firebase fires its first auth state — used by the router guard
// to avoid redirecting before the session is known.
let _resolveAuthReady!: () => void
export const authReady = new Promise<void>((resolve) => { _resolveAuthReady = resolve })

// Sync auth state from Firebase — runs once on startup and on every sign-in/out
onAuthStateChanged(auth, (firebaseUser: User | null) => {
  if (firebaseUser) {
    currentUser.value = {
      user_id: firebaseUser.uid,
      username: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
      email: firebaseUser.email ?? '',
    }
    // Clear any leftover guest session when a real user signs in
    sessionStorage.removeItem(GUEST_KEY)
  } else {
    // Restore guest session if one exists
    try {
      const raw = sessionStorage.getItem(GUEST_KEY)
      const guest = raw ? (JSON.parse(raw) as AuthUser) : null
      currentUser.value = guest?.isGuest ? guest : null
    } catch {
      currentUser.value = null
    }
  }
  _resolveAuthReady()
})

async function login(email: string, password: string): Promise<boolean> {
  loginLoading.value = true
  loginError.value = ''
  try {
    await signInWithEmailAndPassword(auth, email, password)
    isLoginOpen.value = false
    return true
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-credential'
    ) {
      loginError.value = 'Invalid email or password. Please try again.'
    } else {
      loginError.value = 'Could not reach the server. Please try again later.'
    }
    return false
  } finally {
    loginLoading.value = false
  }
}

async function register(email: string, password: string, username: string): Promise<boolean> {
  loginLoading.value = true
  loginError.value = ''
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: username })
    // Store extra profile data in Firestore
    await setDoc(doc(db, 'users', credential.user.uid), {
      username,
      email,
      createdAt: new Date().toISOString(),
    })
    return true
  } catch (err: unknown) {
    const code = (err as { code?: string }).code
    if (code === 'auth/email-already-in-use') {
      loginError.value = 'An account with this email already exists.'
    } else if (code === 'auth/weak-password') {
      loginError.value = 'Password must be at least 6 characters.'
    } else {
      loginError.value = 'Registration failed. Please try again.'
    }
    return false
  } finally {
    loginLoading.value = false
  }
}

async function logout() {
  await signOut(auth)
  currentUser.value = null
  sessionStorage.removeItem(GUEST_KEY)
  sessionStorage.removeItem('shopvue_cart')
}

function loginAsGuest() {
  const guest: AuthUser = { user_id: '0', username: 'Guest', email: '', isGuest: true }
  currentUser.value = guest
  sessionStorage.setItem(GUEST_KEY, JSON.stringify(guest))
}

const isLoggedIn = computed(() => currentUser.value !== null)
const isGuest = computed(() => currentUser.value?.isGuest === true)

export function useAuth() {
  return {
    currentUser,
    isLoginOpen,
    loginError,
    loginLoading,
    isLoggedIn,
    isGuest,
    login,
    register,
    logout,
    loginAsGuest,
  }
}
