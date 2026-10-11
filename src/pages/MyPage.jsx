import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, Calendar, ChefHat, Star, ShoppingCart,
  Clock, Flame, ExternalLink, AlertTriangle, RefreshCw, MapPin, Edit2, Check, X
} from 'lucide-react'
import { fetchMyPage, updateAddress } from '../utils/api'
import styles from './MyPage.module.css'

function openAddressSearch(onSelect) {
  const load = () => {
    new window.daum.Postcode({
      oncomplete(data) { onSelect(data.roadAddress || data.jibunAddress) },
    }).open()
  }

  if (window.daum?.Postcode) { load(); return }

  const script = document.createElement('script')
  script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
  script.onload = load
  document.head.appendChild(script)
}

// ── 별점 렌더링 ────────────────────────────────────────────────────────────
function StarRating({ value }) {
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          size={12}
          fill={n <= value ? '#f59e0b' : 'none'}
          stroke={n <= value ? '#f59e0b' : '#4b5563'}
        />
      ))}
    </span>
  )
}

// ── 날짜 포맷 ──────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str) return '—'
  try { return new Date(str).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return str }
}
function fmtDateShort(str) {
  if (!str) return '—'
  try { return new Date(str).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) }
  catch { return str }
}

// ── 이름 이니셜 아바타 ─────────────────────────────────────────────────────
function Avatar({ name }) {
  const ch = name ? name.charAt(0).toUpperCase() : '?'
  return <div className={styles.avatar}>{ch}</div>
}

export default function MyPage() {
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const [addrEdit,    setAddrEdit]    = useState(false)
  const [addrValue,   setAddrValue]   = useState('')
  const [addrSaving,  setAddrSaving]  = useState(false)
  const [addrMsg,     setAddrMsg]     = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchMyPage()
      setData(res)
    } catch (e) {
      console.error(e)
      setError('정보를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleAddrSave = async () => {
    setAddrSaving(true)
    setAddrMsg('')
    try {
      const res = await updateAddress(addrValue)
      if (res.result === 1) {
        setData(prev => ({ ...prev, address: addrValue }))
        setAddrEdit(false)
        setAddrMsg('주소가 변경되었습니다.')
      } else {
        setAddrMsg(res.msg || '변경에 실패했습니다.')
      }
    } catch {
      setAddrMsg('서버 오류가 발생했습니다.')
    } finally {
      setAddrSaving(false)
    }
  }

  if (loading) return (
    <div className={styles.page}>
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p>프로필 불러오는 중…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className={styles.page}>
      <div className={styles.errorWrap}>
        <AlertTriangle size={32} className={styles.errorIcon} />
        <p>{error}</p>
        <button className={styles.retryBtn} onClick={load}>
          <RefreshCw size={14} /> 다시 시도
        </button>
      </div>
    </div>
  )

  const { userName, email, phoneNum, address, regDt,
          recipeCount, reviewCount, cartCount,
          recentRecipes, recentReviews } = data

  return (
    <div className={styles.page}>

      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <h1 className={styles.title}>👤 마이페이지</h1>
      </header>

      <div className={styles.layout}>

        {/* ── 왼쪽 컬럼 ── */}
        <div className={styles.leftCol}>

          {/* 프로필 카드 */}
          <div className={styles.profileCard}>
            <Avatar name={userName} />
            <div className={styles.profileName}>{userName}</div>
            <div className={styles.profileInfoList}>
              <div className={styles.profileInfoRow}>
                <Mail size={13} className={styles.profileInfoIcon} />
                <span>{email}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <Phone size={13} className={styles.profileInfoIcon} />
                <span>{phoneNum}</span>
              </div>
              <div className={styles.profileInfoRow}>
                <Calendar size={13} className={styles.profileInfoIcon} />
                <span>가입일 {fmtDate(regDt)}</span>
              </div>

              {/* 주소 표시 + 편집 */}
              <div className={styles.profileInfoRow} style={{ alignItems: 'flex-start', gap: 6 }}>
                <MapPin size={13} className={styles.profileInfoIcon} style={{ marginTop: 2, flexShrink: 0 }} />
                {addrEdit ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        type="text"
                        value={addrValue}
                        readOnly
                        placeholder="주소 검색 버튼을 눌러주세요"
                        style={{
                          flex: 1,
                          background: 'var(--color-surface-2, #161B22)',
                          border: '1px solid var(--color-border, #30363D)',
                          borderRadius: 6,
                          color: 'var(--color-text, #E6EDF3)',
                          padding: '4px 8px',
                          fontSize: 13,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => openAddressSearch(setAddrValue)}
                        style={{
                          background: '#21262D',
                          border: '1px solid #30363D',
                          borderRadius: 6,
                          color: '#E6EDF3',
                          padding: '4px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        검색
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={handleAddrSave}
                        disabled={addrSaving || !addrValue}
                        style={{
                          background: '#2ECC71',
                          border: 'none',
                          borderRadius: 6,
                          color: '#fff',
                          padding: '4px 12px',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Check size={12} /> 저장
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddrEdit(false); setAddrMsg('') }}
                        style={{
                          background: 'transparent',
                          border: '1px solid #30363D',
                          borderRadius: 6,
                          color: '#8B949E',
                          padding: '4px 12px',
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <X size={12} /> 취소
                      </button>
                    </div>
                    {addrMsg && (
                      <span style={{ fontSize: 11, color: addrMsg.includes('변경') ? '#2ECC71' : '#f85149' }}>
                        {addrMsg}
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ flex: 1, color: address ? 'inherit' : '#8B949E', fontSize: 13 }}>
                      {address || '주소 미등록'}
                    </span>
                    <button
                      type="button"
                      title="주소 변경"
                      onClick={() => { setAddrValue(address || ''); setAddrEdit(true); setAddrMsg('') }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#8B949E',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    {addrMsg && !addrEdit && (
                      <span style={{ fontSize: 11, color: '#2ECC71' }}>{addrMsg}</span>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* 통계 카드 */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <ChefHat size={20} className={styles.statIcon} style={{ color: '#2ECC71' }} />
              <div className={styles.statValue}>{recipeCount}</div>
              <div className={styles.statLabel}>분석 레시피</div>
            </div>
            <div className={styles.statCard}>
              <Star size={20} className={styles.statIcon} style={{ color: '#f59e0b' }} />
              <div className={styles.statValue}>{reviewCount}</div>
              <div className={styles.statLabel}>작성 리뷰</div>
            </div>
            <div className={styles.statCard}>
              <ShoppingCart size={20} className={styles.statIcon} style={{ color: '#3b82f6' }} />
              <div className={styles.statValue}>{cartCount}</div>
              <div className={styles.statLabel}>장바구니</div>
            </div>
          </div>

        </div>

        {/* ── 오른쪽 컬럼 ── */}
        <div className={styles.rightCol}>

          {/* 최근 레시피 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <ChefHat size={15} />
              <h2 className={styles.sectionTitle}>최근 레시피</h2>
              <button className={styles.seeAllBtn} onClick={() => navigate('/recipes')}>
                전체 보기 <ExternalLink size={11} />
              </button>
            </div>

            {!recentRecipes || recentRecipes.length === 0 ? (
              <div className={styles.empty}>
                <ChefHat size={28} />
                <p>아직 분석한 레시피가 없습니다</p>
              </div>
            ) : (
              <div className={styles.recipeList}>
                {recentRecipes.map(r => (
                  <div key={r.recipeId} className={styles.recipeRow}>
                    {r.youtubeUrlThumbnail ? (
                      <img src={r.youtubeUrlThumbnail} alt={r.title} className={styles.recipeThumb} />
                    ) : (
                      <div className={styles.recipeThumbFallback}><ChefHat size={16} /></div>
                    )}
                    <div className={styles.recipeInfo}>
                      <div className={styles.recipeTitle}>{r.title}</div>
                      <div className={styles.recipeMeta}>
                        {r.difficulty && <span className={styles.diffBadge}>{r.difficulty}</span>}
                        {r.cookingTime && (
                          <span className={styles.metaItem}><Clock size={11} /> {r.cookingTime}분</span>
                        )}
                        {r.calories && (
                          <span className={styles.metaItem}><Flame size={11} /> {r.calories}kcal</span>
                        )}
                      </div>
                    </div>
                    <span className={styles.recipeDate}>{fmtDateShort(r.regDt)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 최근 리뷰 */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <Star size={15} />
              <h2 className={styles.sectionTitle}>최근 리뷰</h2>
              <button className={styles.seeAllBtn} onClick={() => navigate('/review')}>
                전체 보기 <ExternalLink size={11} />
              </button>
            </div>

            {!recentReviews || recentReviews.length === 0 ? (
              <div className={styles.empty}>
                <Star size={28} />
                <p>아직 작성한 리뷰가 없습니다</p>
              </div>
            ) : (
              <div className={styles.reviewList}>
                {recentReviews.map(rv => (
                  <div key={rv.reviewId} className={styles.reviewRow}>
                    {rv.imageUrl ? (
                      <img src={rv.imageUrl} alt="요리 사진" className={styles.reviewThumb} />
                    ) : (
                      <div className={styles.reviewThumbFallback}><Star size={14} /></div>
                    )}
                    <div className={styles.reviewInfo}>
                      <div className={styles.reviewRecipe}>{rv.recipeTitle}</div>
                      <StarRating value={rv.rating} />
                      {rv.comment && (
                        <div className={styles.reviewComment}>{rv.comment}</div>
                      )}
                    </div>
                    <span className={styles.reviewDate}>{fmtDateShort(rv.regDt)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
