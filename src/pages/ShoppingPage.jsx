import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, ExternalLink, Trash2, CheckCircle, TrendingDown, Zap, Package, AlertTriangle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { fetchPrices } from '../utils/api'
import styles from './ShoppingPage.module.css'

// Mock price data
const MOCK_PRICES = [
  {
    ingredient: '간장',
    image: 'https://images.unsplash.com/photo-1624657082850-67e5f3d5a0b1?w=120&h=120&fit=crop&auto=format',
    markets: [
      { name: '쿠팡', price: 3200, url: 'https://www.coupang.com', fastDelivery: true, logo: '🛒' },
      { name: '마켓컬리', price: 3500, url: 'https://www.kurly.com', fastDelivery: true, logo: '🌿' },
      { name: '이마트', price: 3100, url: 'https://www.emart.com', fastDelivery: false, logo: '🏪' },
    ],
  },
  {
    ingredient: '설탕',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&h=120&fit=crop&auto=format',
    markets: [
      { name: '쿠팡', price: 1800, url: 'https://www.coupang.com', fastDelivery: true, logo: '🛒' },
      { name: '마켓컬리', price: 2100, url: 'https://www.kurly.com', fastDelivery: true, logo: '🌿' },
      { name: '이마트', price: 1700, url: 'https://www.emart.com', fastDelivery: false, logo: '🏪' },
    ],
  },
]

// Ingredient image map for enriching API data
const INGREDIENT_IMAGES = {
  '간장': 'https://images.unsplash.com/photo-1624657082850-67e5f3d5a0b1?w=120&h=120&fit=crop&auto=format',
  '설탕': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=120&h=120&fit=crop&auto=format',
  '소금': 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=120&h=120&fit=crop&auto=format',
  '달걀': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=120&h=120&fit=crop&auto=format',
  '우유': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=120&h=120&fit=crop&auto=format',
  '버터': 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=120&h=120&fit=crop&auto=format',
  '마늘': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=120&h=120&fit=crop&auto=format',
  '양파': 'https://images.unsplash.com/photo-1508747703725-719777637510?w=120&h=120&fit=crop&auto=format',
  '감자': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120&h=120&fit=crop&auto=format',
  '당근': 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=120&h=120&fit=crop&auto=format',
  '돼지고기': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=120&h=120&fit=crop&auto=format',
  '닭고기': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=120&h=120&fit=crop&auto=format',
  '소고기': 'https://images.unsplash.com/photo-1551135049-8a33b5883817?w=120&h=120&fit=crop&auto=format',
  '두부': 'https://images.unsplash.com/photo-1645690183361-3ddfb83f7f77?w=120&h=120&fit=crop&auto=format',
  '김치': 'https://images.unsplash.com/photo-1583224994559-0d1c87ec0025?w=120&h=120&fit=crop&auto=format',
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop&auto=format'
const USE_MOCK = true

// ── Confirm Modal ───────────────────────────────────────────────────
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

// ── Main Page ───────────────────────────────────────────────────────
export default function ShoppingPage() {
  const navigate = useNavigate()
  const selectedRecipe = useAppStore((s) => s.selectedRecipe)
  const cartItems      = useAppStore((s) => s.cartItems)
  const addToCart      = useAppStore((s) => s.addToCart)
  const removeFromCart = useAppStore((s) => s.removeFromCart)
  const clearCart      = useAppStore((s) => s.clearCart)

  const [priceData, setPriceData] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState('coupang')
  const [confirmed, setConfirmed] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, config: {}, onConfirm: null })

  const openConfirm  = (config, fn) => setConfirmModal({ open: true, config, onConfirm: fn })
  const closeConfirm = () => setConfirmModal({ open: false, config: {}, onConfirm: null })
  const handleConfirmOk = () => { confirmModal.onConfirm?.(); closeConfirm() }

  const missingItems = selectedRecipe
    ? (selectedRecipe.missingIngredients ?? MOCK_PRICES.map(p => p.ingredient))
    : []

  useEffect(() => {
    if (!missingItems.length) return
    setLoading(true)
    const load = async () => {
      try {
        const raw = USE_MOCK
          ? await new Promise(r => setTimeout(() => r(MOCK_PRICES), 800))
          : await fetchPrices(missingItems)
        const data = raw.map(item => ({
          ...item,
          image: item.image ?? INGREDIENT_IMAGES[item.ingredient] ?? DEFAULT_IMAGE,
        }))
        setPriceData(data)
        data.forEach(item => {
          const best = [...item.markets].sort((a, b) => a.price - b.price)[0]
          addToCart({ id: item.ingredient, name: item.ingredient, price: best.price, market: best.name })
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedRecipe])

  const totalCart = cartItems.reduce((s, i) => s + i.price, 0)

  const TABS = [
    { key: 'coupang', label: '🛒 쿠팡',    deepLink: 'https://www.coupang.com/np/search?q=' },
    { key: 'kurly',   label: '🌿 마켓컬리', deepLink: 'https://www.kurly.com/search?sword=' },
    { key: 'emart',   label: '🏪 이마트몰', deepLink: 'https://emart.ssg.com/search/result.ssg?target=all&query=' },
  ]

  const doDeepLink = (base) => {
    const query = encodeURIComponent(cartItems.map(i => i.name).join(' '))
    window.open(base + query, '_blank', 'noopener')
    setConfirmed(true)
  }

  // ── Button handlers with confirm dialogs ─────────────────────────
  const handleDeepLinkClick = () => {
    const tab = TABS.find(t => t.key === activeTab)
    openConfirm(
      {
        variant: 'primary',
        icon: <ExternalLink size={22} />,
        title: `${tab.label}로 이동할까요?`,
        desc: `장바구니 ${cartItems.length}개 항목을 검색하는 페이지가 새 탭으로 열립니다.`,
        okLabel: '이동하기',
      },
      () => doDeepLink(tab.deepLink)
    )
  }

  const handleRemoveItem = (item) => {
    openConfirm(
      {
        variant: 'danger',
        icon: <Trash2 size={22} />,
        title: '항목을 삭제할까요?',
        desc: `"${item.name}"을 장바구니에서 제거합니다.`,
        okLabel: '삭제',
      },
      () => removeFromCart(item.id)
    )
  }

  const handleClearCart = () => {
    openConfirm(
      {
        variant: 'danger',
        icon: <Trash2 size={22} />,
        title: '장바구니를 비울까요?',
        desc: `담긴 ${cartItems.length}개 항목이 모두 삭제됩니다. 되돌릴 수 없어요.`,
        okLabel: '전체 삭제',
      },
      () => clearCart()
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>쇼핑 가이드</h1>
          <p className={styles.sub}>
            {selectedRecipe
              ? `"${selectedRecipe.title}" 에 필요한 재료를 구매해요`
              : '장바구니에 담긴 재료를 구매해요'}
          </p>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Left — Price comparison */}
        <div className={styles.priceSection}>
          <h2 className={styles.sectionTitle}>
            <TrendingDown size={16} />
            가격 비교
          </h2>

          {loading ? (
            <div className={styles.loadingGrid}>
              {[1, 2].map(i => (
                <div key={i} className={`${styles.priceCard} skeleton`} style={{ height: 180 }} />
              ))}
            </div>
          ) : (
            <div className={styles.priceGrid}>
              {priceData.map(item => (
                <PriceCard key={item.ingredient} item={item} />
              ))}
              {!priceData.length && (
                <div className={styles.noData}>가격 정보가 없습니다.</div>
              )}
            </div>
          )}
        </div>

        {/* Right — Cart */}
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
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.cartItemInfo}>
                      <span className={styles.cartItemName}>{item.name}</span>
                      <span className={styles.cartItemMarket}>{item.market}</span>
                    </div>
                    <span className={styles.cartItemPrice}>{item.price.toLocaleString()}원</span>
                    <button className={styles.removeBtn} onClick={() => handleRemoveItem(item)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <span>예상 총 금액</span>
                <span className={styles.totalPrice}>{totalCart.toLocaleString()}원</span>
              </div>

              <div className={styles.marketTabs}>
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    className={`${styles.marketTab} ${activeTab === tab.key ? styles.marketTabActive : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button className={styles.deepLinkBtn} onClick={handleDeepLinkClick}>
                <ExternalLink size={16} />
                {TABS.find(t => t.key === activeTab)?.label} 장바구니에 담기
              </button>

              <p className={styles.deepLinkNote}>클릭 시 새 탭으로 해당 쇼핑몰이 열립니다</p>

              {confirmed && (
                <div className={styles.confirmedBanner}>
                  <CheckCircle size={16} />
                  쇼핑몰 페이지가 열렸어요! 장바구니에서 결제를 완료해 주세요.
                </div>
              )}

              <button className={styles.clearBtn} onClick={handleClearCart}>
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

// ── PriceCard with ingredient image ────────────────────────────────
function PriceCard({ item }) {
  const sorted   = [...item.markets].sort((a, b) => a.price - b.price)
  const minPrice = sorted[0].price
  const [imgErr, setImgErr] = useState(false)

  return (
    <div className={styles.priceCard}>
      <div className={styles.priceCardHeader}>
        <div className={styles.ingredientImageWrap}>
          {!imgErr ? (
            <img
              src={item.image}
              alt={item.ingredient}
              className={styles.ingredientImage}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className={styles.ingredientImageFallback}>
              <Package size={22} />
            </div>
          )}
        </div>
        <div className={styles.ingredientMeta}>
          <span className={styles.ingredientName}>{item.ingredient}</span>
          <span className={styles.bestPrice}>최저 {minPrice.toLocaleString()}원</span>
        </div>
      </div>

      <div className={styles.marketList}>
        {sorted.map((m, i) => (
          <a
            key={m.name}
            href={m.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.marketRow} ${i === 0 ? styles.bestMarket : ''}`}
          >
            <span className={styles.marketLogo}>{m.logo}</span>
            <span className={styles.marketName}>{m.name}</span>
            {m.fastDelivery && (
              <span className={styles.fastTag}>
                <Zap size={10} /> 빠른배송
              </span>
            )}
            <span className={styles.marketPrice}>{m.price.toLocaleString()}원</span>
            {i === 0 && <span className={styles.cheapestBadge}>최저가</span>}
          </a>
        ))}
      </div>
    </div>
  )
}
