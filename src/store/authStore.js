import { create } from 'zustand'
import { loginUser, logoutUser, sessionCheck } from '../utils/api'

export const useAuthStore = create((set) => ({
    user:      null,   // { email: 'xxx@xxx.com' } | null
    isLoading: false,
    error:     null,

    // ── 앱 시작 시 세션 복원 ──────────────────────────
    checkSession: async () => {
        try {
            const data = await sessionCheck()
            set({ user: data.existYn === 'Y'
                    ? { email: data.email }
                    : null
            })
        } catch {
            set({ user: null })
        }
    },

    // ── 로그인 ────────────────────────────────────────
    login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
            const data = await loginUser(email, password)
            if (data.result === 1) {
                set({ user: { email }, isLoading: false })
                return { success: true }
            }
            set({ error: data.msg, isLoading: false })
            return { success: false }
        } catch {
            set({ error: '서버 오류가 발생했습니다.', isLoading: false })
            return { success: false }
        }
    },

    // ── 로그아웃 ──────────────────────────────────────
    logout: async () => {
        try {
            await logoutUser()
        } finally {
            set({ user: null, error: null })
        }
    },

    clearError: () => set({ error: null }),
}))