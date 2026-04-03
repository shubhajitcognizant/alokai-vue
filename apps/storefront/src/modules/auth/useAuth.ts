import { computed, ref } from "vue"

interface ApiUser {
    user_id: number
    username: string
    email: string
    password: string
}

export interface AuthUser {
    user_id: number
    username: string
    email: string
}

const STORAGE_KEY = 'shopvue_user'

function loadUserFromStorage(): AuthUser | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch {
        return null
    }
}

const currentUser = ref<AuthUser | null>(loadUserFromStorage())
const isLoginOpen = ref(false)
const loginError = ref('')
const loginLoading = ref(false)

async function login(email: string, password: string): Promise<boolean> {
    loginLoading.value = true
    loginError.value = ''

    try {
        const res = await fetch('https://fake-store-api.mock.beeceptor.com/api/users')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const users: ApiUser[] = await res.json()

        const match = users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )

        if (!match) {
            loginError.value = 'Invalid email or password. Please try again.'
            return false
        }

        const user: AuthUser = {
            user_id: match.user_id,
            username: match.username,
            email: match.email
        }

        currentUser.value = user
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user))

        isLoginOpen.value = false
        return true
    } catch {
        loginError.value = 'Could not reach the server. Please try again later.'
        return false
    } finally {
        loginLoading.value = false
    }
}

function logout() {
    currentUser.value = null
    localStorage.removeItem(STORAGE_KEY)
}

const isLoggedIn = computed(() => currentUser.value !== null)

export function useAuth() {
    return {
        currentUser,
        isLoginOpen,
        loginError,
        loginLoading,
        isLoggedIn,
        login,
        logout
    }
}
