import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore, isAdmin } from '../../store/authStore'
import PrivateRoute from './PrivateRoute'

/**
 * 관리자만 접근 가능한 라우트 보호 컴포넌트
 *
 *   세션 확인·미로그인 처리 → PrivateRoute 에 위임 (로딩 표시 / /login 리다이렉트)
 *   로그인했지만 관리자가 아님 → fallback 경로로 리다이렉트
 *
 * 화면 노출 제어용 — 실제 API 권한 검사는 서버 SecurityConfig(hasRole ADMIN)가 담당
 */
export default function AdminRoute({ children, fallback = '/' }) {
  const user = useAuthStore(s => s.user)

  return (
    <PrivateRoute>
      {isAdmin(user) ? children : <Navigate to={fallback} replace />}
    </PrivateRoute>
  )
}
