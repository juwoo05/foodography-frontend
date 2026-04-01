import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ShoppingBag, Flame, ChevronRight, SlidersHorizontal, AlertCircle, ShoppingCart, X, Plus, Minus } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import styles from './RecipesPage.module.css'

const FILTERS = [
  { key: 'missing', label: '재료 완성도 높은 순' },
  { key: 'time',    label: '조리시간 짧은 순' },
  { key: 'cost',    label: '추가비용 적은 순' },
  { key: 'cal',     label: '칼로리 낮은 순' },
]

const WIZARD_STEPS = [
  { label: '사진 업로드', state: 'done'   },
  { label: 'AI 인식',    state: 'done'   },
  { label: '결과 교정',  state: 'done'   },
  { label: '요리 추천',  state: 'active' },
  { label: '쇼핑 가이드', state: ''      },
]

export default function RecipesPage() {
  const navigate = useNavigate()
  const recipes          = useAppStore(s => s.recipes)
  const setSelectedRecipe   = useAppStore(s => s.setSelectedRecipe)
  const addMissingToCart    = useAppStore(s => s.addMissingToCart)
  const [activeFilter, setActiveFilter] = useState('missing')
  const [hoveredId, setHoveredId] = useState(null)
  const [purchaseModal, setPurchaseModal] = useState({ open: false, recipe: null, cart: {} })
  const [successModal, setSuccessModal] = useState({ open: false, recipeName: '', itemCount: 0, totalCost: 0 })

  const sorted = useMemo(() => {
    if (!recipes.length) return []
    return [...recipes].sort((a, b) => {
      if (activeFilter === 'time')    return a.cookTime    - b.cookTime
      if (activeFilter === 'cost')    return a.extraCost   - b.extraCost
      if (activeFilter === 'cal')     return a.calories    - b.calories
      if (activeFilter === 'missing') return a.missingCount - b.missingCount
      return 0
    })
  }, [recipes, activeFilter])

  const handlePickRecipe = (recipe) => {
    setSelectedRecipe(recipe)
    navigate('/cooking')
  }

  const handleViewShopping = (recipe, e) => {
    e.stopPropagation()
    setSelectedRecipe(recipe)
    navigate('/shopping')
  }

  const openPurchaseModal = (recipe, e) => {
    e.stopPropagation()
    // 초기 장바구니: 모든 부족 재료 수량 1로 세팅
    const initCart = {}
    recipe.missingIngredients?.forEach(item => { initCart[item.name] = 1 })
    setPurchaseModal({ open: true, recipe, cart: initCart })
  }

  const closePurchaseModal = () => {
    setPurchaseModal({ open: false, recipe: null, cart: {} })
  }

  const handleCartQty = (name, delta) => {
    setPurchaseModal(prev => ({
      ...prev,
      cart: { ...prev.cart, [name]: Math.max(0, (prev.cart[name] ?? 1) + delta) }
    }))
  }

  const handleAddAllToCart = () => {
    const { recipe, cart } = purchaseModal
    const items = recipe?.missingIngredients ?? []
    const totalCost = items.reduce((sum, item) => sum + (item.price ?? 0) * (cart[item.name] ?? 1), 0)
    const itemCount = items.reduce((sum, item) => sum + (cart[item.name] ?? 1), 0)
    if (items.length) {
      addMissingToCart(items, cart, recipe.title)
    }
    closePurchaseModal()
    setSuccessModal({ open: true, recipeName: recipe?.title ?? '', itemCount, totalCost })
    setTimeout(() => setSuccessModal(prev => ({ ...prev, open: false })), 3000)
  }

  const closeSuccessModal = () => setSuccessModal(prev => ({ ...prev, open: false }))

  return (
    <div className={styles.pageWrap}>

      {/* ── Wizard Steps ── */}
      <div className={styles.statusBar}>
        {WIZARD_STEPS.map((step, i) => (
          <div
            key={i}
            className={`${styles.statusStep} ${step.state === 'done' ? styles.stepDone : ''} ${step.state === 'active' ? styles.stepActive : ''}`}
          >
            <div className={styles.stepNum}>{step.state === 'done' ? '✓' : i + 1}</div>
            {step.label}
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      {!recipes.length ? (
        <div className={styles.empty}>
          <AlertCircle size={40} style={{ color: '#484F58' }} />
          <p>레시피를 불러오려면 먼저 식재료를 분석해 주세요.</p>
          <button className={styles.goBtn} onClick={() => navigate('/')}>
            냉장고 분석하러 가기 →
          </button>
        </div>
      ) : (
        <div className={styles.body}>
          {/* 헤더 */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>요리 추천</h1>
              <p className={styles.sub}>분석된 식재료로 만들 수 있는 요리예요</p>
            </div>
            <div className={styles.countBadge}>{recipes.length}개 레시피</div>
          </div>

          {/* 필터 바 */}
          <div className={styles.filterBar}>
            <SlidersHorizontal size={13} style={{ color: '#484F58', flexShrink: 0 }} />
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`${styles.filterBtn} ${activeFilter === f.key ? styles.filterActive : ''}`}
                onClick={() => setActiveFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* 카드 그리드 */}
          <div className={styles.grid}>
            {sorted.map((recipe, idx) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                rank={idx + 1}
                isHovered={hoveredId === recipe.id}
                onMouseEnter={() => setHoveredId(recipe.id)}
                onMouseLeave={() => setHoveredId(null)}
                onPick={() => handlePickRecipe(recipe)}
                onShopping={e => handleViewShopping(recipe, e)}
                onCostClick={e => openPurchaseModal(recipe, e)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── 추가 구매 모달 ── */}
      {purchaseModal.open && purchaseModal.recipe && (() => {
        const { recipe, cart } = purchaseModal
        const items = recipe.missingIngredients ?? []
        const totalCost = items.reduce((sum, item) => {
          return sum + (item.price ?? 0) * (cart[item.name] ?? 1)
        }, 0)
        return (
          <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && closePurchaseModal()}>
            <div className={styles.modal}>
              {/* 헤더 */}
              <div className={styles.modalHeader}>
                <div>
                  <div className={styles.modalTitle}>🛒 추가 구매 목록</div>
                  <div className={styles.modalRecipeName}>{recipe.title}</div>
                </div>
                <button className={styles.modalCloseBtn} onClick={closePurchaseModal}>
                  <X size={16} />
                </button>
              </div>

              {/* 품목 리스트 */}
              <div className={styles.modalItemList}>
                {items.length === 0 ? (
                  <div className={styles.modalEmpty}>부족한 재료가 없습니다.</div>
                ) : items.map(item => (
                  <div key={item.name} className={styles.modalItem}>
                    <span className={styles.modalItemEmoji}>{item.emoji ?? '🛒'}</span>
                    <div className={styles.modalItemInfo}>
                      <span className={styles.modalItemName}>{item.name}</span>
                      <span className={styles.modalItemPrice}>
                        {item.price ? `${(item.price).toLocaleString()}원 / ${item.unit ?? '개'}` : '가격 미정'}
                      </span>
                    </div>
                    <div className={styles.modalQtyControl}>
                      <button className={styles.modalQtyBtn} onClick={() => handleCartQty(item.name, -1)}>
                        <Minus size={11} />
                      </button>
                      <span className={styles.modalQtyValue}>{cart[item.name] ?? 1}</span>
                      <button className={styles.modalQtyBtn} onClick={() => handleCartQty(item.name, 1)}>
                        <Plus size={11} />
                      </button>
                    </div>
                    <span className={styles.modalItemTotal}>
                      {item.price ? `${((item.price) * (cart[item.name] ?? 1)).toLocaleString()}원` : '-'}
                    </span>
                  </div>
                ))}
              </div>

              {/* 합계 */}
              <div className={styles.modalTotal}>
                <span className={styles.modalTotalLabel}>총 예상 금액</span>
                <span className={styles.modalTotalValue}>{totalCost.toLocaleString()}원</span>
              </div>

              {/* 액션 */}
              <div className={styles.modalActions}>
                <button className={styles.modalCancelBtn} onClick={closePurchaseModal}>취소</button>
                <button className={styles.modalCartBtn} onClick={handleAddAllToCart}>
                  <ShoppingCart size={15} />
                  장바구니 담기
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── 장바구니 담기 성공 모달 ── */}
      {successModal.open && (
        <div className={styles.successOverlay} onClick={closeSuccessModal}>
          <div className={styles.successModal} onClick={e => e.stopPropagation()}>
            <div className={styles.successIconWrap}>
              <div className={styles.successIconRing} />
              <div className={styles.successIconInner}>
                <ShoppingCart size={22} />
              </div>
            </div>
            <div className={styles.successContent}>
              <div className={styles.successTitle}>장바구니에 담았어요!</div>
              <div className={styles.successSub}>
                <span className={styles.successRecipeName}>{successModal.recipeName}</span> 재료
              </div>
              <div className={styles.successStats}>
                <div className={styles.successStat}>
                  <span className={styles.successStatVal}>{successModal.itemCount}</span>
                  <span className={styles.successStatLabel}>개 항목</span>
                </div>
                <div className={styles.successStatDivider} />
                <div className={styles.successStat}>
                  <span className={styles.successStatVal}>{successModal.totalCost.toLocaleString()}원</span>
                  <span className={styles.successStatLabel}>예상 금액</span>
                </div>
              </div>
            </div>
            <button className={styles.successCloseBtn} onClick={closeSuccessModal}>
              <X size={14} />
            </button>
            <div className={styles.successProgress} />
          </div>
        </div>
      )}
    </div>
  )
}

function RecipeCard({ recipe, rank, isHovered, onMouseEnter, onMouseLeave, onPick, onShopping, onCostClick }) {
  return (
    <div
      className={`${styles.card} ${isHovered ? styles.cardHovered : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onPick}
      style={{ animationDelay: `${rank * 0.06}s` }}
    >
      {/* 썸네일 */}
      <div className={styles.thumbWrap}>
        <img src={recipe.thumbnail} alt={recipe.title} className={styles.thumb} loading="lazy" />
        {rank === 1 && <span className={styles.topBadge}>🏆 추천 1위</span>}
        {recipe.missingCount === 0 && <span className={styles.readyBadge}>✓ 바로 가능</span>}
      </div>

      {/* 정보 */}
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{recipe.title}</h3>

        {recipe.tags?.length > 0 && (
          <div className={styles.tagRow}>
            {recipe.tags.map(t => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        )}

        <div className={styles.metaRow}>
          <MetaItem icon={<Clock size={12} />}       label={`${recipe.cookTime}분`} />
          <MetaItem icon={<Flame size={12} />}        label={`${recipe.calories}kcal`} />
          {recipe.missingCount > 0 && (
            <MetaItem icon={<ShoppingBag size={12} />} label={`재료 ${recipe.missingCount}개 부족`} accent="orange" />
          )}
        </div>

        {recipe.extraCost > 0 && (
          <div className={styles.costLine} onClick={onCostClick} title="클릭하여 품목 확인">
            <span className={styles.costLabel}>추가 구매 예상</span>
            <div className={styles.costRight}>
              <span className={styles.costValue}>{recipe.extraCost.toLocaleString()}원</span>
              <span className={styles.costHint}>목록 보기 →</span>
            </div>
          </div>
        )}

        <div className={styles.cardActions}>
          <button className={styles.cookBtn} onClick={onPick}>
            요리 시작 <ChevronRight size={14} />
          </button>
          {recipe.missingCount > 0 && (
            <button className={styles.shopBtn} onClick={onShopping} title="쇼핑 가이드">
              <ShoppingBag size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaItem({ icon, label, accent }) {
  return (
    <span className={`${styles.metaItem} ${accent === 'orange' ? styles.metaOrange : ''}`}>
      {icon}{label}
    </span>
  )
}
