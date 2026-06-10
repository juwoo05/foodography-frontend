import React, { useState, useEffect } from 'react'
import { ExternalLink, ShoppingCart, Trash2, Package, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react'
import { searchShopping, addToCart, fetchCart, removeCartItem, clearCartApi } from '../utils/api'
import styles from './ShoppingPage.module.css'

// ── 순위 뱃지 색상 (1위=금, 2위=은, 3위=동) ─────────────────────────────────
const RANK_COLOR = ['#f59e0b', '#94a3b8', '#b45309']

// ── Confirm Modal ─────────────────────────────────────────────────────────
function ConfirmModal({ open, config, onConfirm, onCancel }) {
  if (!open) return null
  const variant = config.variant ?? 'warn'
  return (
    <div className={styles.confirmOverlay} onClick={onCancel}>
      <div className={styles.confirmModal} onClick={e => e.stopPropagation()}>
        <div className={`${styles.confirmIconWrap} ${styles[`confirmIcon_${variant}`]}`}>
          {config.icon ?? <AlertTriangle size={22} />}
        </div>
        <div className={styles.confirmContent}>
          <div className={styles.confirmTitle}>{config.title}</div>
          <div className={styles.confirmDesc}>{config.desc}</div>
        </div>
        <div className={styles.confirmActions}>
          <button className={styles.confirmCancelBtn} onClick={onCancel}>취소</button>
          <button
            className={`${styles.confirmOkBtn} ${styles[`confirmOk_${variant}`]}`}
            onClick={onConfirm}
          >
            {config.okLabel ?? '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ShoppingPage() {
  const [searchData,   setSearchData]   = useState([])   // List<IngredientSearchDTO>
  const [cartItems,    setCartItems]    = useState([])   // List<ShoppingDTO>
  const [loading,      setLoading]      = useState(false)
  const [cartLoading,  setCartLoading]  = useState({})   // { 'ingredient-rank': bool }
  const [error,        setError]        = useState(null)
  const [confirmModal, setConfirmModal] = useState({ open: false, config: {}, onConfirm: null })

  const openConfirm    = (config, fn) => setConfirmModal({ open: true, config, onConfirm: fn })
  const closeConfirm   = () => setConfirmModal({ open: false, config: {}, onConfirm: null })
  const handleConfirmOk = () => { confirmModal.onConfirm?.(); closeConfirm() }

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [search, cart] = await Promise.all([searchShopping(), fetchCart()])
      setSearchData(search)
      setCartItems(cart)
    } catch (e) {
      console.error(e)
      setError('데이터를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 장바구니 담기
  const handleAddToCart = async (item) => {
    const key = `${item.ingredient}-${item.sortType}`
    setCartLoading(prev => ({ ...prev, [key]: true }))
    try {
      const saved = await addToCart(item)
      setCartItems(prev => [saved, ...prev])
    } catch (e) {
      console.error('[쇼핑] 장바구니 추가 실패:', e.message)
    } finally {
      setCartLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  // 단일 삭제
  const handleRemove = (item) => {
    openConfirm(
      {
        variant: 'danger',
        icon: <Trash2 size={22} />,
        title: '항목을 삭제할까요?',
        desc: `"${item.ingredient}" 상품을 장바구니에서 제거합니다.`,
        okLabel: '삭제',
      },
      async () => {
        try {
          await removeCartItem(item.cartId)
          setCartItems(prev => prev.filter(i => i.cartId !== item.cartId))
        } catch (e) { console.error(e) }
      }
    )
  }

  // 전체 비우기
  const handleClearCart = () => {
    openConfirm(
      {
        variant: 'danger',
        icon: <Trash2 size={22} />,
        title: '장바구니를 비울까요?',
        desc: `담긴 ${cartItems.length}개 항목이 모두 삭제됩니다.`,
        okLabel: '전체 삭제',
      },
      async () => {
        try {
          await clearCartApi()
          setCartItems([])
        } catch (e) { console.error(e) }
      }
    )
  }

  const totalPrice = cartItems.reduce((sum, item) => sum + (parseInt(item.lprice) || 0), 0)

  return (
    <div className={styles.page}>

      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>🛒 쇼핑 가이드</h1>
          <p className={styles.sub}>
            최신 레시피에 필요한 추가 재료를 네이버 쇼핑에서 비교합니다
          </p>
        </div>
        <button className={styles.refreshBtn} onClick={loadAll} disabled={loading}>
          <RefreshCw size={15} className={loading ? styles.spinning : ''} />
          새로고침
        </button>
      </header>

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className={styles.layout}>

        {/* ── 왼쪽: 검색 결과 ── */}
        <div className={styles.priceSection}>
          <h2 className={styles.sectionTitle}>
            <TrendingDown size={16} />
            네이버 쇼핑 검색 결과
            {!loading && searchData.length > 0 && (
              <span className={styles.cartCount}>{searchData.length}개 재료</span>
            )}
          </h2>

          {loading ? (
            <div className={styles.loadingGrid}>
              {[1, 2, 3].map(i => (
                <div key={i} className={`${styles.priceCard} ${styles.skeletonCard}`} />
              ))}
            </div>
          ) : searchData.length === 0 ? (
            <div className={styles.noData}>
              <Package size={36} />
              <p>추가로 구매할 재료가 없습니다.</p>
              <small>레시피를 먼저 선택해주세요.</small>
            </div>
          ) : (
            <div className={styles.priceGrid}>
              {searchData.map(group => (
                <IngredientGroup
                  key={group.ingredient}
                  group={group}
                  cartLoading={cartLoading}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 오른쪽: 장바구니 ── */}
        <div className={styles.cartSection}>
          <h2 className={styles.sectionTitle}>
            <ShoppingCart size={16} />
            장바구니
            <span className={styles.cartCount}>{cartItems.length}</span>
          </h2>

          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <Package size={32} style={{ color: 'var(--text-dim)' }} />
              <p>담긴 상품이 없어요</p>
            </div>
          ) : (
            <>
              <div className={styles.cartList}>
                {cartItems.map(item => (
                  <CartItem key={item.cartId} item={item} onRemove={handleRemove} />
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>예상 합계</span>
                <span className={styles.totalPrice}>{totalPrice.toLocaleString()}원</span>
              </div>

              <button className={styles.clearBtn} onClick={handleClearCart}>
                <Trash2 size={13} />
                장바구니 비우기
              </button>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        config={confirmModal.config}
        onConfirm={handleConfirmOk}
        onCancel={closeConfirm}
      />
    </div>
  )
}

// ── 재료 그룹 카드 ─────────────────────────────────────────────────────────
function IngredientGroup({ group, cartLoading, onAddToCart }) {
  return (
    <div className={styles.priceCard}>
      <div className={styles.ingredientHeader}>
        <span className={styles.ingredientName}>{group.ingredient}</span>
        <span className={styles.ingredientCount}>{group.results.length}개 결과</span>
      </div>
      <div className={styles.resultList}>
        {group.results.map((item, idx) => (
          <NaverItemRow
            key={item.sortType}
            item={item}
            rank={idx}
            loading={!!cartLoading[`${item.ingredient}-${item.sortType}`]}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  )
}

// ── 상품 행 (컴팩트 가로 레이아웃) ───────────────────────────────────────
function NaverItemRow({ item, rank, loading, onAddToCart }) {
  const [imgErr, setImgErr] = useState(false)
  const price  = item.lprice ? parseInt(item.lprice).toLocaleString() + '원' : '—'
  const color  = RANK_COLOR[rank] ?? RANK_COLOR[2]

  return (
    <div className={styles.naverRow}>

      {/* 순위 번호 */}
      <span className={styles.rankBadge} style={{ color, borderColor: color + '55' }}>
        {rank + 1}
      </span>

      {/* 상품 이미지 */}
      <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.rowImgWrap}>
        {!imgErr && item.image ? (
          <img src={item.image} alt={item.title} className={styles.rowImg} onError={() => setImgErr(true)} />
        ) : (
          <div className={styles.rowImgFallback}><Package size={14} /></div>
        )}
      </a>

      {/* 상품 정보 */}
      <div className={styles.rowInfo}>
        <a href={item.link} target="_blank" rel="noopener noreferrer" className={styles.rowTitle}>
          {item.title}
        </a>
        <span className={styles.rowMall}>{item.mallName}</span>
      </div>

      {/* 가격 */}
      <span className={styles.rowPrice}>{price}</span>

      {/* 담기 버튼 */}
      <button
        className={styles.rowCartBtn}
        onClick={() => onAddToCart(item)}
        disabled={loading}
        title="장바구니 담기"
      >
        {loading ? '…' : <ShoppingCart size={13} />}
      </button>
    </div>
  )
}

// ── 장바구니 항목 행 ──────────────────────────────────────────────────────
function CartItem({ item, onRemove }) {
  return (
    <div className={styles.cartItem}>
      {item.image ? (
        <img src={item.image} alt={item.title} className={styles.cartThumb} onError={e => { e.target.style.display='none' }} />
      ) : (
        <div className={styles.cartThumbFallback}><Package size={14} /></div>
      )}

      <div className={styles.cartItemInfo}>
        <div className={styles.cartItemIngredient}>{item.ingredient}</div>
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cartItemTitle}
        >
          {item.title} <ExternalLink size={10} style={{ display: 'inline', verticalAlign: 'middle' }} />
        </a>
        <span className={styles.cartItemMarket}>{item.mallName}</span>
      </div>

      <span className={styles.cartItemPrice}>
        {item.lprice ? parseInt(item.lprice).toLocaleString() + '원' : '-'}
      </span>

      <button className={styles.removeBtn} onClick={() => onRemove(item)} title="삭제">
        <Trash2 size={13} />
      </button>
    </div>
  )
}
