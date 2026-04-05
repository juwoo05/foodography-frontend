import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, Search, X, ShoppingCart, LogIn, LogOut, User, ChevronRight } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { useAuthStore } from '../../store/authStore'
import LogoutModal from '../ui/LogoutModal'
import styles from './Navbar.module.css'

// 전역 검색 색인
const SEARCH_INDEX = [
  { label: '홈',            path: '/',         desc: '냉장고 사진 업로드',      icon: '🏠' },
  { label: 'AI 분석',       path: '/analyze',  desc: '식재료 인식 및 교정',     icon: '🔍' },
  { label: '레시피 추천',   path: '/recipes',  desc: '요리 추천 및 필터',       icon: '🍳' },
  { label: '쇼핑 가이드',   path: '/shopping', desc: '재료 가격 비교 구매',     icon: '🛒' },
  { label: '요리 가이드',   path: '/cooking',  desc: '단계별 조리 & 유튜브',    icon: '👨‍🍳' },
  { label: '로그인',        path: '/login',    desc: '이메일로 로그인',         icon: '🔐' },
  { label: '회원가입',      path: '/signup',   desc: '무료 계정 만들기',        icon: '✨' },
  { label: '아이디 찾기',   path: '/find-id',  desc: '이메일 주소 확인',        icon: '📧' },
  { label: '비밀번호 찾기', path: '/find-pw',  desc: '비밀번호 재설정',         icon: '🔑' },
]

const PAGE_TITLES = {
  '/':         '홈',
  '/analyze':  'AI 분석',
  '/recipes':  '레시피 추천',
  '/shopping': '쇼핑 가이드',
  '/cooking':  '요리 가이드',
  '/login':    '로그인',
  '/signup':   '회원가입',
  '/find-id':  '아이디 찾기',
  '/find-pw':  '비밀번호 찾기',
}

export default function Navbar({ onMenuClick }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const cartItems = useAppStore(s => s.cartItems)
  const { user, logout } = useAuthStore()
  const displayName = user?.email?.split('@')[0] ?? ''

  const [searchOpen,    setSearchOpen]    = useState(false)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [focusedIdx,    setFocusedIdx]    = useState(-1)
  const [logoutOpen,    setLogoutOpen]    = useState(false)

  const searchRef   = useRef(null)
  const inputRef    = useRef(null)

  const pageTitle = PAGE_TITLES[location.pathname] ?? ''

  // 검색 필터링
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) { setSearchResults([]); setFocusedIdx(-1); return }
    setSearchResults(
      SEARCH_INDEX.filter(item =>
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q)
      )
    )
    setFocusedIdx(-1)
  }, [searchQuery])

  // 바깥 클릭 닫기
  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) closeSearch()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const goTo = (path) => {
    navigate(path)
    closeSearch()
  }

  const handleKeyDown = (e) => {
    if (!searchResults.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, searchResults.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const t = focusedIdx >= 0 ? searchResults[focusedIdx] : searchResults[0]
      if (t) goTo(t.path)
    }
    else if (e.key === 'Escape') closeSearch()
  }

  const handleLogoutConfirm = async () => {
    await logout()
    setLogoutOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <>
    <header className={styles.navbar}>
      {/* 왼쪽: 햄버거 + 로고 */}
      <div className={styles.navLeft}>
        {onMenuClick && (
          <button className={styles.menuBtn} onClick={onMenuClick} aria-label="메뉴 열기">
            <Menu size={20} />
          </button>
        )}
        <div className={styles.logo} onClick={() => navigate('/')}>
          <span className={styles.logoEmoji}>📸</span>
          <span className={styles.logoText}>찍고먹어요</span>
        </div>
        {pageTitle && (
          <div className={styles.breadcrumb}>
            <ChevronRight size={13} className={styles.breadcrumbArrow} />
            <span>{pageTitle}</span>
          </div>
        )}
      </div>

      {/* 오른쪽: 검색 + 장바구니 + 유저 */}
      <div className={styles.navRight}>
        {/* 검색 */}
        <div className={styles.searchWrap} ref={searchRef}>
          {searchOpen ? (
            <div className={styles.searchExpanded}>
              <Search size={15} className={styles.searchIcon} />
              <input
                ref={inputRef}
                className={styles.searchInput}
                placeholder="페이지 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className={styles.searchClose} onClick={closeSearch}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button className={styles.iconBtn} onClick={openSearch} aria-label="검색">
              <Search size={18} />
            </button>
          )}

          {/* 드롭다운 */}
          {searchOpen && (searchResults.length > 0 || searchQuery) && (
            <div className={styles.searchDropdown}>
              {searchResults.length > 0 ? searchResults.map((item, idx) => (
                <button
                  key={item.path}
                  className={`${styles.searchItem} ${focusedIdx === idx ? styles.searchItemFocused : ''}`}
                  onClick={() => goTo(item.path)}
                  onMouseEnter={() => setFocusedIdx(idx)}
                >
                  <span className={styles.searchItemIcon}>{item.icon}</span>
                  <div className={styles.searchItemText}>
                    <span className={styles.searchItemLabel}>{item.label}</span>
                    <span className={styles.searchItemDesc}>{item.desc}</span>
                  </div>
                  <span className={styles.searchItemPath}>{item.path}</span>
                </button>
              )) : (
                <div className={styles.searchEmpty}>
                  <Search size={14} style={{ opacity: 0.3 }} />
                  <span>검색 결과가 없습니다</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 장바구니 */}
        <button
          className={styles.iconBtn}
          onClick={() => navigate('/shopping')}
          aria-label="장바구니"
          style={{ position: 'relative' }}
        >
          <ShoppingCart size={18} />
          {cartItems.length > 0 && (
            <span className={styles.cartBadge}>{cartItems.length}</span>
          )}
        </button>

        {/* 유저 */}
        {user ? (
          <div className={styles.userWrap}>
            <User size={18} className={styles.avatar} />
            <span className={styles.userName}>{displayName}</span>
            <button className={styles.logoutBtn} onClick={() => setLogoutOpen(true)} title="로그아웃">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button className={styles.loginBtn} onClick={() => navigate('/login')}>
            <LogIn size={15} />
            <span>로그인</span>
          </button>
        )}
      </div>
    </header>

      <LogoutModal
        open={logoutOpen}
        onConfirm={handleLogoutConfirm}
        onClose={() => setLogoutOpen(false)}
      />
    </>
  )
}
