import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── 임시 계정 (이 계정만 로그인/가입 허용) ──────────────────────────
const MOCK_ACCOUNT = {
  email:    'jijuwoo@gmail.ocm',
  password: 'jizoowoo123',
  name:     '지주우',
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user:      null,   // { id, email, name, avatar }
      token:     null,
      isLoading: false,
      error:     null,

      // ── 로그인 ──────────────────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          await new Promise(r => setTimeout(r, 900))

          // 임시 계정 외 로그인 차단
          if (email !== MOCK_ACCOUNT.email || password !== MOCK_ACCOUNT.password) {
            throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
          }

          const user = {
            id:     'user_mock',
            email:  MOCK_ACCOUNT.email,
            name:   MOCK_ACCOUNT.name,
            avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${MOCK_ACCOUNT.email}`,
          }
          set({ user, token: 'mock_token_' + Date.now(), isLoading: false })
          return { success: true }
        } catch (e) {
          set({ isLoading: false, error: e.message })
          return { success: false, error: e.message }
        }
      },

      // ── 회원가입 ─────────────────────────────────────────────────────
      signup: async (name, email, password) => {
        set({ isLoading: true, error: null })
        try {
          await new Promise(r => setTimeout(r, 1100))

          // 임시 계정 이메일로 가입 시도 → 중복 처리
          if (email === MOCK_ACCOUNT.email) {
            throw new Error('이미 사용 중인 이메일입니다.')
          }

          // 임시 계정 외 신규 가입 차단
          throw new Error('현재 신규 회원가입이 불가합니다. 데모 계정으로 로그인해 주세요.')
        } catch (e) {
          set({ isLoading: false, error: e.message })
          return { success: false, error: e.message }
        }
      },

      // ── 소셜 로그인 (Mock) ───────────────────────────────────────────
      socialLogin: async (provider) => {
        set({ isLoading: true, error: null })
        await new Promise(r => setTimeout(r, 800))
        // 소셜 로그인도 임시 계정으로만 처리
        const user = {
          id:     'user_mock',
          email:  MOCK_ACCOUNT.email,
          name:   MOCK_ACCOUNT.name,
          avatar: `https://api.dicebear.com/7.x/thumbs/svg?seed=${MOCK_ACCOUNT.email}`,
        }
        set({ user, token: 'mock_token_social_' + Date.now(), isLoading: false })
        return { success: true }
      },

      // ── 로그아웃 ─────────────────────────────────────────────────────
      logout: () => set({ user: null, token: null, error: null }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'freshlens-auth',
      partialize: state => ({ user: state.user, token: state.token }),
    }
  )
)
