import React from "react"
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Layout from "./components/layout/Layout"
import HomePage from "./pages/HomePage"
import UploadPage from './pages/UploadPage'
import AnalyzePage from "./pages/AnalyzePage"
import RecipesPage from "./pages/RecipesPage"
import ShoppingPage from "./pages/ShoppingPage"
import CookingPage from "./pages/CookingPage"
import LoginPage from "./pages/LoginPage"
import SignupPage from "./pages/SignupPage"
import FindIdPage from "./pages/FindIdPage"
import FindPwPage from "./pages/FindPwPage"
import FridgePage from './pages/FridgePage'
import ReviewPage from './pages/ReviewPage'

// inside Routes
export default function App() {

  const checkSession = useAuthStore(s => s.checkSession)

  useEffect(() => {
    checkSession()  // 새로고침 포함, 앱 시작 시 딱 한 번
  }, [])
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"   element={<LoginPage />} />
        <Route path="/signup"  element={<SignupPage />} />
        <Route path="/find-id" element={<FindIdPage />} />
        <Route path="/find-pw" element={<FindPwPage />} />

        <Route path="/" element={<Layout />}>
          <Route index         element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="analyze"  element={<AnalyzePage />} />
          <Route path="recipes"  element={<RecipesPage />} />
          <Route path="shopping" element={<ShoppingPage />} />
          <Route path="cooking"  element={<CookingPage />} />
          <Route path="/fridge" element={<FridgePage />} />
          <Route path="/review" element={<ReviewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
