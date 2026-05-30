import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import PrivateRoute from './components/auth/PrivateRoute'
import Layout from './components/layout/Layout'

// ── 공개 페이지 ──────────────────────────────────────
import LoginPage  from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import FindIdPage from './pages/FindIdPage'
import FindPwPage from './pages/FindPwPage'
import HomePage   from './pages/HomePage'

// ── 인증 필요 페이지 ─────────────────────────────────
import UploadPage   from './pages/UploadPage'
import AnalyzePage  from './pages/AnalyzePage'
import RecipesPage  from './pages/RecipesPage'
import ShoppingPage from './pages/ShoppingPage'
import CookingPage  from './pages/CookingPage'
import FridgePage   from './pages/FridgePage'
import ReviewPage   from './pages/ReviewPage'

export default function App() {
  const checkSession = useAuthStore(s => s.checkSession)

  useEffect(() => {
    checkSession()   // 새로고침 포함, 앱 시작 시 딱 한 번 JWT 쿠키 유효성 확인
  }, [])

  return (
    <BrowserRouter>
      <Routes>

        {/* ── 공개 라우트 (인증 불필요) ─────────────────── */}
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignupPage />} />
        <Route path="/find-id" element={<FindIdPage />} />
        <Route path="/find-pw" element={<FindPwPage />} />

        <Route path="/" element={<Layout />}>
          {/* 홈은 공개 (로그인 유도 랜딩 역할) */}
          <Route index element={<HomePage />} />

          {/* ── 인증 필요 라우트 (JWT 유효해야 진입 가능) ── */}
          <Route path="upload"   element={<PrivateRoute><UploadPage /></PrivateRoute>} />
          <Route path="analyze"  element={<PrivateRoute><AnalyzePage /></PrivateRoute>} />
          <Route path="recipes"  element={<PrivateRoute><RecipesPage /></PrivateRoute>} />
          <Route path="shopping" element={<PrivateRoute><ShoppingPage /></PrivateRoute>} />
          <Route path="cooking"  element={<PrivateRoute><CookingPage /></PrivateRoute>} />
          <Route path="fridge"   element={<PrivateRoute><FridgePage /></PrivateRoute>} />
          <Route path="review"   element={<PrivateRoute><ReviewPage /></PrivateRoute>} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}
