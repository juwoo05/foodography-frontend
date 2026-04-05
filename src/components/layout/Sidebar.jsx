import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Camera, ChefHat, ShoppingCart, BookOpen, Home,
  RotateCcw, LogOut, LogIn, UserPlus, X,
  Refrigerator, Star, User
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/',         icon: Home,         label: '홈',         emoji: '🏠' },
  { to: '/analyze',  icon: Camera,       label: 'AI 분석',    emoji: '🔍' },
  { to: '/recipes',  icon: ChefHat,      label: '레시피',     emoji: '🍳' },
  { to: '/shopping', icon: ShoppingCart, label: '쇼핑',       emoji: '🛒' },
  { to: '/cooking',  icon: BookOpen,     label: '요리 가이드', emoji: '👨‍🍳' },
  { to: '/fridge',   icon: Refrigerator, label: '나의 냉장고 분석', emoji: '🧊' },
  { to: '/review',   icon: Star,         label: '오늘의 레시피 후기', emoji: '⭐' },
]

export default function Sidebar({ open, onClose }) {
  const navigate  = useNavigate()
  const reset     = useAppStore(s => s.reset)
  const cartItems = useAppStore(s => s.cartItems)
  const { user, logout } = useAuthStore()
  const displayName = user?.email?.split('@')[0] ?? ''

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    onClose()
  }

  const handleNav = () => onClose()

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />

      {/* 사이드바 드로어 */}
      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        {/* 헤더 */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logo} onClick={() => { navigate('/'); onClose() }}>
            <span className={styles.logoEmoji}>📸</span>
            <span className={styles.logoText}>찍고먹어요</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* 유저 카드 */}
        {user ? (
          <div className={styles.userCard}>
            <User size={32} className={styles.avatar} />
            <div className={styles.userInfo}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>
        ) : (
          <div className={styles.authCard}>
            <button className={styles.authBtn} onClick={() => { navigate('/login'); onClose() }}>
              <LogIn size={15} /> 로그인
            </button>
            <button className={`${styles.authBtn} ${styles.authBtnPrimary}`} onClick={() => { navigate('/signup'); onClose() }}>
              <UserPlus size={15} /> 회원가입
            </button>
          </div>
        )}

        {/* 구분선 */}
        <div className={styles.divider} />

        {/* 네비게이션 */}
        <nav className={styles.nav}>
          <p className={styles.navLabel}>메뉴</p>
          {NAV_ITEMS.map(({ to, icon: Icon, label, emoji }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              onClick={handleNav}
            >
              <span className={styles.navEmoji}>{emoji}</span>
              <span className={styles.navLabel2}>{label}</span>
              {label === '쇼핑' && cartItems.length > 0 && (
                <span className={styles.badge}>{cartItems.length}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className={styles.divider} />

        {/* 하단 액션 */}
        <div className={styles.bottomActions}>
          <button className={styles.actionBtn} onClick={() => { reset(); onClose() }}>
            <RotateCcw size={15} /> 데이터 초기화
          </button>
          {user && (
            <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} onClick={handleLogout}>
              <LogOut size={15} /> 로그아웃
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
