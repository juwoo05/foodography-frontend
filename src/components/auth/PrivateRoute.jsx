import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

/**
 * 인증된 사용자만 접근 가능한 라우트 보호 컴포넌트
 *
 * 동작 흐름:
 *   isChecking=true  → 앱 시작 직후 세션 확인 중 → 로딩 표시 (깜빡임 방지)
 *   isChecking=false, user=null → 미인증 → /login 리다이렉트 (현재 경로 state로 전달)
 *   isChecking=false, user!=null → 인증됨 → children 렌더링
 */
export default function PrivateRoute({ children }) {
  const user       = useAuthStore(s => s.user)
  const isChecking = useAuthStore(s => s.isChecking)
  const location   = useLocation()

  // 세션 확인 중 — 빈 화면 (레이아웃 깜빡임 없이 대기)
  if (isChecking) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0f0f0f',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid #333', borderTopColor: '#00ff7f',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // 미인증 — 로그인 후 원래 경로로 돌아올 수 있도록 현재 위치 전달
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
