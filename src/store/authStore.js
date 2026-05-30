import { create } from 'zustand'
import { loginUser, logoutUser, sessionCheck } from '../utils/api'

export const useAuthStore = create((set) => ({
    // user: { userId: number, userName: string } | null
    user:       null,
    isLoading:  false,
    isChecking: true,   // 앱 최초 로드 시 세션 확인 중 → PrivateRoute 가 이 값으로 대기
    error:      null,

    // ── 앱 시작 시 JWT 쿠키로 세션 복원 ──────────────
    // isChecking: true 인 동안 PrivateRoute 는 로딩 표시 (로그인 미확정 상태에서 /login 튀는 현상 방지)
    checkSession: async () => {
        try {
            const data = await sessionCheck()
            set({
                user: data.existYn === 'Y'
                    ? { userId: data.userId, userName: data.userName }
                    : null,
                isChecking: false,
            })
        } catch {
            set({ user: null, isChecking: false })
        }
    },

    // ── 로그인 ────────────────────────────────────────
    // 1. loginUser() → 서버에서 JWT 쿠키 발급
    // 2. sessionCheck() → 발급된 JWT 에서 사용자 정보 추출
    login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
            const data = await loginUser(email, password)
            if (data.result === 1) {
                // JWT 가 쿠키에 세팅됐으므로 즉시 sessionCheck 로 유저 정보 확정
                const session = await sessionCheck()
                set({
                    user: { userId: session.userId, userName: session.userName },
                    isLoading: false,
                })
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
    // Spring Security LogoutFilter 가 JWT 쿠키 삭제
    logout: async () => {
        try {
            await logoutUser()
        } finally {
            set({ user: null, error: null })
        }
    },

    clearError: () => set({ error: null }),
}))
