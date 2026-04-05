import React, { useEffect, useState, useRef } from 'react'

// ────────────────────────────────────────────
//  Samsung Family Hub–inspired Fridge UI
//  공공데이터 식품영양성분 API 연동
// ────────────────────────────────────────────

const SERVICE_KEY = '' // ← 발급받은 인증키로 교체하세요

// 관리할 식재료 목록 (추가/삭제 가능)
const DEFAULT_INGREDIENTS = ['당근', '계란', '브로콜리', '닭가슴살', '우유']

// 영양소별 색상
const NUTRIENT_COLORS = {
  carb:    '#F4C842',
  protein: '#4FC3F7',
  fat:     '#FF8A65',
  sugar:   '#CE93D8',
  sodium:  '#EF5350',
}

// 냉장칸 카테고리
const ZONES = ['채소·과일', '육류·수산', '유제품·계란', '가공식품', '기타']

export default function FridgePage() {
  const [mounted, setMounted]           = useState(false)
  const [ingredients, setIngredients]   = useState(DEFAULT_INGREDIENTS)
  const [data, setData]                 = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [inputValue, setInputValue]     = useState('')
  const [activeTab, setActiveTab]       = useState('fridge') // fridge | nutrition | summary
  const [time, setTime]                 = useState(new Date())
  const inputRef = useRef(null)

  // 시계 업데이트
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setTimeout(() => setMounted(true), 80)
    fetchAll(DEFAULT_INGREDIENTS)
  }, [])

  // ── API 호출 ──────────────────────────────
  const fetchNutrition = async (food) => {
    const url =
        `https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02` +
        `?serviceKey=${SERVICE_KEY}&type=json&desc_kor=${encodeURIComponent(food)}&pageNo=1&numOfRows=5`

    const res  = await fetch(url)
    const json = await res.json()
    const item = json?.body?.items?.[0]

    if (!item) return null

    return {
      name:    food,
      dbName:  item.DESC_KOR       || food,
      kcal:    Number(item.NUTR_CONT1 || 0),
      carb:    Number(item.NUTR_CONT2 || 0),
      protein: Number(item.NUTR_CONT3 || 0),
      fat:     Number(item.NUTR_CONT4 || 0),
      sugar:   Number(item.NUTR_CONT5 || 0),
      sodium:  Number(item.NUTR_CONT6 || 0),
      serving: item.SERVING_SIZE    || '100g',
      group:   item.FOOD_GROUP      || '기타',
    }
  }

  const fetchAll = async (list) => {
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(list.map(fetchNutrition))
      setData(results.filter(Boolean))
    } catch (e) {
      console.error(e)
      setError('API 호출 중 오류가 발생했습니다. 인증키를 확인해주세요.')
      // 오류 시 목(mock) 데이터로 폴백
      setData(list.map((name, i) => ({
        name,
        dbName:  name,
        kcal:    [41, 155, 34, 165, 61][i % 5],
        carb:    [10, 1.1, 7, 0, 4.8][i % 5],
        protein: [0.9, 13, 2.8, 31, 3.2][i % 5],
        fat:     [0.2, 11, 0.4, 3.6, 3.3][i % 5],
        sugar:   [5, 1, 1.7, 0, 5.1][i % 5],
        sodium:  [69, 124, 33, 74, 44][i % 5],
        serving: '100g',
        group:   ZONES[i % ZONES.length],
      })))
    }
    setLoading(false)
  }

  const addIngredient = () => {
    const name = inputValue.trim()
    if (!name || ingredients.includes(name)) return
    const next = [...ingredients, name]
    setIngredients(next)
    fetchAll(next)
    setInputValue('')
  }

  const removeIngredient = (name) => {
    const next = ingredients.filter(n => n !== name)
    setIngredients(next)
    setData(prev => prev.filter(d => d.name !== name))
    if (selectedItem?.name === name) setSelectedItem(null)
  }

  const totals = data.reduce(
      (acc, d) => {
        acc.kcal    += d.kcal
        acc.carb    += d.carb
        acc.protein += d.protein
        acc.fat     += d.fat
        acc.sugar   += d.sugar
        acc.sodium  += d.sodium
        return acc
      },
      { kcal: 0, carb: 0, protein: 0, fat: 0, sugar: 0, sodium: 0 }
  )

  const maxKcal = Math.max(...data.map(d => d.kcal), 1)

  const fmt = (n) => Number(n.toFixed(1))
  const hh = time.getHours().toString().padStart(2, '0')
  const mm = time.getMinutes().toString().padStart(2, '0')

  return (
      <div style={css.root} className={mounted ? 'hub-in' : ''}>
        <style>{globalStyles}</style>

        {/* ── 상단 상태바 ── */}
        <header style={css.statusBar}>
          <div style={css.statusLeft}>
            <span style={css.statusDot} />
            <span style={css.statusText}>냉장고 온도 3°C  |  냉동 –18°C</span>
          </div>
          <div style={css.clock}>{hh}:{mm}</div>
          <div style={css.statusRight}>
            <span style={css.statusText}>신선도 양호</span>
            <FreshIcon />
          </div>
        </header>

        {/* ── 탭 네비 ── */}
        <nav style={css.nav}>
          {[
            { id: 'fridge',    label: '🧊 냉장고' },
            { id: 'nutrition', label: '📊 영양정보' },
            { id: 'summary',   label: '📋 총합 분석' },
          ].map(tab => (
              <button
                  key={tab.id}
                  style={{ ...css.navBtn, ...(activeTab === tab.id ? css.navBtnActive : {}) }}
                  onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
          ))}
        </nav>

        {/* ── 메인 콘텐츠 ── */}
        <main style={css.main}>

          {/* ════ 냉장고 탭 ════ */}
          {activeTab === 'fridge' && (
              <div style={css.fadeIn}>
                {/* 식재료 추가 바 */}
                <div style={css.addBar}>
                  <input
                      ref={inputRef}
                      style={css.addInput}
                      placeholder="식재료 이름 입력 (예: 두부)"
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addIngredient()}
                  />
                  <button style={css.addBtn} onClick={addIngredient}>+ 추가</button>
                </div>

                {/* 냉장고 그리드 */}
                <div style={css.fridgeGrid}>
                  {data.map((item, i) => (
                      <IngredientCard
                          key={item.name}
                          item={item}
                          index={i}
                          maxKcal={maxKcal}
                          selected={selectedItem?.name === item.name}
                          onClick={() => setSelectedItem(prev => prev?.name === item.name ? null : item)}
                          onRemove={() => removeIngredient(item.name)}
                      />
                  ))}
                  {data.length === 0 && !loading && (
                      <div style={css.empty}>
                        <span style={{ fontSize: 48 }}>🧊</span>
                        <p style={{ color: '#4a7c5e', marginTop: 12 }}>냉장고가 비어 있습니다</p>
                      </div>
                  )}
                </div>

                {/* 선택된 아이템 상세 패널 */}
                {selectedItem && (
                    <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
                )}
              </div>
          )}

          {/* ════ 영양정보 탭 ════ */}
          {activeTab === 'nutrition' && (
              <div style={css.fadeIn}>
                <div style={css.nutritionGrid}>
                  {data.map((item, i) => (
                      <NutritionCard key={item.name} item={item} index={i} />
                  ))}
                </div>
              </div>
          )}

          {/* ════ 총합 분석 탭 ════ */}
          {activeTab === 'summary' && (
              <div style={css.fadeIn}>
                <SummaryPanel totals={totals} data={data} />
              </div>
          )}
        </main>

        {/* 로딩 오버레이 */}
        {loading && (
            <div style={css.loadingOverlay}>
              <div style={css.loadingSpinner} />
              <p style={{ color: '#2ECC71', marginTop: 16, fontFamily: 'inherit' }}>영양 정보 분석 중…</p>
            </div>
        )}

        {/* 에러 배너 */}
        {error && (
            <div style={css.errorBanner}>
              ⚠️ {error} &nbsp;
              <button style={css.errorClose} onClick={() => setError(null)}>✕</button>
            </div>
        )}
      </div>
  )
}

// ── 냉장고 식재료 카드 ────────────────────────
function IngredientCard({ item, index, maxKcal, selected, onClick, onRemove }) {
  const barW = Math.round((item.kcal / maxKcal) * 100)

  return (
      <div
          style={{
            ...css.ingCard,
            ...(selected ? css.ingCardSelected : {}),
            animationDelay: `${index * 0.06}s`,
          }}
          className="hub-card"
          onClick={onClick}
      >
        <button
            style={css.removeBtn}
            onClick={e => { e.stopPropagation(); onRemove() }}
            title="삭제"
        >✕</button>

        <div style={css.ingEmoji}>{getFoodEmoji(item.name)}</div>
        <div style={css.ingName}>{item.name}</div>
        <div style={css.ingGroup}>{item.group || '기타'}</div>

        <div style={css.kcalRow}>
          <span style={css.kcalNum}>{item.kcal}</span>
          <span style={css.kcalUnit}>kcal</span>
        </div>

        <div style={css.kcalBarBg}>
          <div style={{ ...css.kcalBarFill, width: `${barW}%` }} />
        </div>

        <div style={css.ingMacros}>
          <MacroDot color={NUTRIENT_COLORS.carb}    label="탄" value={fmt1(item.carb)} />
          <MacroDot color={NUTRIENT_COLORS.protein} label="단" value={fmt1(item.protein)} />
          <MacroDot color={NUTRIENT_COLORS.fat}     label="지" value={fmt1(item.fat)} />
        </div>
      </div>
  )
}

function MacroDot({ color, label, value }) {
  return (
      <div style={css.macroDot}>
        <div style={{ ...css.macroDotCircle, background: color }} />
        <span style={css.macroDotLabel}>{label}</span>
        <span style={css.macroDotVal}>{value}g</span>
      </div>
  )
}

// ── 상세 패널 ──────────────────────────────
function DetailPanel({ item, onClose }) {
  const nutrients = [
    { key: 'carb',    label: '탄수화물', color: NUTRIENT_COLORS.carb,    unit: 'g',  dv: 324 },
    { key: 'protein', label: '단백질',   color: NUTRIENT_COLORS.protein, unit: 'g',  dv: 55  },
    { key: 'fat',     label: '지방',     color: NUTRIENT_COLORS.fat,     unit: 'g',  dv: 54  },
    { key: 'sugar',   label: '당류',     color: NUTRIENT_COLORS.sugar,   unit: 'g',  dv: 100 },
    { key: 'sodium',  label: '나트륨',   color: NUTRIENT_COLORS.sodium,  unit: 'mg', dv: 2000 },
  ]

  return (
      <div style={css.detailPanel} className="hub-slide-up">
        <button style={css.detailClose} onClick={onClose}>✕ 닫기</button>
        <div style={css.detailHeader}>
          <span style={css.detailEmoji}>{getFoodEmoji(item.name)}</span>
          <div>
            <div style={css.detailName}>{item.name}</div>
            <div style={css.detailDbName}>{item.dbName} · {item.serving} 기준</div>
          </div>
          <div style={css.detailKcal}>
            <span style={css.detailKcalNum}>{item.kcal}</span>
            <span style={css.detailKcalUnit}>kcal</span>
          </div>
        </div>

        <div style={css.detailBars}>
          {nutrients.map(n => {
            const val = item[n.key]
            const pct = Math.min(Math.round((val / n.dv) * 100), 100)
            return (
                <div key={n.key} style={css.detailBarRow}>
                  <span style={css.detailBarLabel}>{n.label}</span>
                  <div style={css.detailBarBg}>
                    <div style={{ ...css.detailBarFill, width: `${pct}%`, background: n.color }} />
                  </div>
                  <span style={css.detailBarVal}>{val}{n.unit}</span>
                  <span style={css.detailBarPct}>{pct}%</span>
                </div>
            )
          })}
        </div>
      </div>
  )
}

// ── 영양정보 카드 (탭2) ─────────────────────
function NutritionCard({ item, index }) {
  const total = item.carb + item.protein + item.fat || 1
  const slices = [
    { key: 'carb',    value: item.carb,    color: NUTRIENT_COLORS.carb    },
    { key: 'protein', value: item.protein, color: NUTRIENT_COLORS.protein },
    { key: 'fat',     value: item.fat,     color: NUTRIENT_COLORS.fat     },
  ]

  return (
      <div
          style={{ ...css.nutrCard, animationDelay: `${index * 0.07}s` }}
          className="hub-card"
      >
        <div style={css.nutrHeader}>
          <span style={css.nutrEmoji}>{getFoodEmoji(item.name)}</span>
          <div>
            <div style={css.nutrName}>{item.name}</div>
            <div style={css.nutrServing}>{item.serving} 기준</div>
          </div>
          <div style={{ ...css.nutrKcal }}>{item.kcal} <span style={{ fontSize: 11, opacity: 0.6 }}>kcal</span></div>
        </div>

        <DonutChart slices={slices} total={total} />

        <div style={css.nutrLegend}>
          {slices.map(s => (
              <div key={s.key} style={css.nutrLegRow}>
                <div style={{ ...css.nutrLegDot, background: s.color }} />
                <span style={css.nutrLegLabel}>
              {{ carb: '탄수화물', protein: '단백질', fat: '지방' }[s.key]}
            </span>
                <span style={css.nutrLegVal}>{fmt1(s.value)}g</span>
                <span style={css.nutrLegPct}>{Math.round(s.value / total * 100)}%</span>
              </div>
          ))}
        </div>
      </div>
  )
}

// ── SVG 도넛 차트 ────────────────────────────
function DonutChart({ slices, total }) {
  const r = 40, cx = 55, cy = 55, stroke = 12
  const circ = 2 * Math.PI * r
  let offset = 0

  const paths = slices.map(s => {
    const frac = s.value / total
    const dash = frac * circ
    const gap  = circ - dash
    const path = {
      key:       s.key,
      color:     s.color,
      dasharray: `${dash} ${gap}`,
      offset:    circ - offset,
    }
    offset += dash
    return path
  })

  return (
      <svg width="110" height="110" style={{ display: 'block', margin: '12px auto' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a2a22" strokeWidth={stroke} />
        {paths.map(p => (
            <circle
                key={p.key}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={p.color}
                strokeWidth={stroke}
                strokeDasharray={p.dasharray}
                strokeDashoffset={p.offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
        ))}
      </svg>
  )
}

// ── 총합 분석 패널 ─────────────────────────
function SummaryPanel({ totals, data }) {
  const rda = { kcal: 2000, carb: 324, protein: 55, fat: 54, sugar: 100, sodium: 2000 }
  const items = [
    { key: 'kcal',    label: '열량',    unit: 'kcal', color: '#FF6B6B', emoji: '🔥' },
    { key: 'carb',    label: '탄수화물', unit: 'g',   color: NUTRIENT_COLORS.carb,    emoji: '🍞' },
    { key: 'protein', label: '단백질',   unit: 'g',   color: NUTRIENT_COLORS.protein, emoji: '🥩' },
    { key: 'fat',     label: '지방',     unit: 'g',   color: NUTRIENT_COLORS.fat,     emoji: '🧈' },
    { key: 'sugar',   label: '당류',     unit: 'g',   color: NUTRIENT_COLORS.sugar,   emoji: '🍯' },
    { key: 'sodium',  label: '나트륨',   unit: 'mg',  color: NUTRIENT_COLORS.sodium,  emoji: '🧂' },
  ]

  return (
      <div style={css.summaryWrap}>
        <div style={css.summaryTitle}>냉장고 전체 영양 총합</div>
        <div style={css.summarySubtitle}>보유 식재료 {data.length}종 · 1인분(100g) 기준</div>

        <div style={css.summaryCards}>
          {items.map(it => {
            const val = totals[it.key]
            const pct = Math.min(Math.round((val / rda[it.key]) * 100), 999)
            const warn = pct > 100
            return (
                <div key={it.key} style={{ ...css.summaryCard, borderColor: warn ? it.color + '66' : '#1e3a2a' }}>
                  <div style={css.summaryCardEmoji}>{it.emoji}</div>
                  <div style={css.summaryCardLabel}>{it.label}</div>
                  <div style={{ ...css.summaryCardVal, color: it.color }}>
                    {fmt1(val)}<span style={css.summaryCardUnit}>{it.unit}</span>
                  </div>
                  <div style={css.summaryRdaBar}>
                    <div style={{
                      ...css.summaryRdaFill,
                      width: `${Math.min(pct, 100)}%`,
                      background: it.color,
                    }} />
                  </div>
                  <div style={{ ...css.summaryRdaPct, color: warn ? it.color : '#4a7c5e' }}>
                    1일 권장량의 {pct}%{warn ? ' ⚠️' : ''}
                  </div>
                </div>
            )
          })}
        </div>

        {/* 식재료 랭킹 */}
        <div style={css.rankTitle}>칼로리 순위</div>
        <div style={css.rankList}>
          {[...data].sort((a, b) => b.kcal - a.kcal).map((item, i) => {
            const barW = Math.round((item.kcal / (data[0] ? Math.max(...data.map(d => d.kcal)) : 1)) * 100)
            return (
                <div key={item.name} style={css.rankRow}>
                  <span style={css.rankNum}>{i + 1}</span>
                  <span style={css.rankEmoji}>{getFoodEmoji(item.name)}</span>
                  <span style={css.rankName}>{item.name}</span>
                  <div style={css.rankBarBg}>
                    <div style={{ ...css.rankBarFill, width: `${barW}%` }} />
                  </div>
                  <span style={css.rankKcal}>{item.kcal} kcal</span>
                </div>
            )
          })}
        </div>
      </div>
  )
}

// ── 아이콘 ───────────────────────────────────
function FreshIcon() {
  return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: 6 }}>
        <circle cx="8" cy="8" r="7" stroke="#2ECC71" strokeWidth="1.5" />
        <path d="M5 8l2 2 4-4" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
  )
}

// ── 헬퍼 ─────────────────────────────────────
const fmt1 = (n) => Number(Number(n).toFixed(1))

function getFoodEmoji(name) {
  const map = {
    당근: '🥕', 계란: '🥚', 브로콜리: '🥦', 우유: '🥛', 닭가슴살: '🍗',
    토마토: '🍅', 사과: '🍎', 바나나: '🍌', 시금치: '🥬', 두부: '🍱',
    돼지고기: '🥩', 소고기: '🥩', 연어: '🐟', 고구마: '🍠', 감자: '🥔',
    양파: '🧅', 마늘: '🧄', 버섯: '🍄', 파: '🌿', 오이: '🥒',
    치즈: '🧀', 요거트: '🫙', 버터: '🧈', 새우: '🦐', 오렌지: '🍊',
  }
  return map[name] || '🧊'
}

// ════════════════════════════════════════════
//  스타일 정의
// ════════════════════════════════════════════
const css = {
  root: {
    minHeight: '100vh',
    background: '#0a1a10',
    color: '#c8e6c9',
    fontFamily: "'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },

  // 상태바
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 28px',
    background: '#061210',
    borderBottom: '1px solid #1e3a2a',
    fontSize: 12,
    letterSpacing: '0.05em',
  },
  statusLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  statusRight: { display: 'flex', alignItems: 'center', gap: 4 },
  statusDot: {
    width: 7, height: 7, borderRadius: '50%',
    background: '#2ECC71', boxShadow: '0 0 6px #2ECC71',
  },
  statusText: { color: '#4a7c5e', fontSize: 12 },
  clock: {
    fontSize: 26,
    fontWeight: 300,
    color: '#e8f5e9',
    letterSpacing: '0.15em',
    fontVariantNumeric: 'tabular-nums',
  },

  // 탭 내비
  nav: {
    display: 'flex',
    gap: 0,
    background: '#061210',
    borderBottom: '1px solid #1e3a2a',
    padding: '0 20px',
  },
  navBtn: {
    padding: '14px 24px',
    background: 'none',
    border: 'none',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    color: '#4a7c5e',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    letterSpacing: '0.03em',
  },
  navBtnActive: {
    color: '#2ECC71',
    borderBottomColor: '#2ECC71',
  },

  main: {
    padding: '24px 28px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  fadeIn: { animation: 'hubFadeIn 0.35s ease' },

  // 추가 바
  addBar: {
    display: 'flex',
    gap: 10,
    marginBottom: 24,
    background: '#0e2018',
    border: '1px solid #1e3a2a',
    borderRadius: 12,
    padding: '12px 16px',
  },
  addInput: {
    flex: 1,
    background: '#061210',
    border: '1px solid #1e3a2a',
    borderRadius: 8,
    padding: '10px 16px',
    color: '#c8e6c9',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },
  addBtn: {
    padding: '10px 22px',
    background: '#1a4030',
    border: '1px solid #2ECC71',
    borderRadius: 8,
    color: '#2ECC71',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
    letterSpacing: '0.05em',
  },

  // 냉장고 그리드
  fridgeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 16,
  },
  empty: {
    gridColumn: '1/-1',
    textAlign: 'center',
    padding: '60px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // 식재료 카드
  ingCard: {
    background: 'linear-gradient(160deg, #0e2018 0%, #081510 100%)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#1e3a2a',
    borderRadius: 14,
    padding: '16px 14px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
    animation: 'hubCardIn 0.4s ease both',
  },
  ingCardSelected: {
    borderColor: '#2ECC71',
    boxShadow: '0 0 20px #2ECC7130',
    transform: 'translateY(-2px)',
  },
  removeBtn: {
    position: 'absolute',
    top: 8, right: 8,
    background: 'none',
    border: 'none',
    color: '#1e3a2a',
    fontSize: 12,
    cursor: 'pointer',
    lineHeight: 1,
    padding: 4,
    transition: 'color 0.15s',
  },
  ingEmoji: { fontSize: 32, textAlign: 'center', marginBottom: 6 },
  ingName: { fontSize: 16, fontWeight: 600, textAlign: 'center', color: '#e8f5e9', marginBottom: 2 },
  ingGroup: { fontSize: 10, color: '#4a7c5e', textAlign: 'center', marginBottom: 10, letterSpacing: '0.05em' },
  kcalRow: { display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'center', marginBottom: 6 },
  kcalNum: { fontSize: 22, fontWeight: 700, color: '#2ECC71' },
  kcalUnit: { fontSize: 11, color: '#4a7c5e' },
  kcalBarBg: { height: 4, background: '#1a2a22', borderRadius: 2, marginBottom: 10, overflow: 'hidden' },
  kcalBarFill: { height: '100%', background: 'linear-gradient(90deg, #1a5c35, #2ECC71)', borderRadius: 2, transition: 'width 0.8s ease' },
  ingMacros: { display: 'flex', justifyContent: 'space-between' },
  macroDot: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  macroDotCircle: { width: 6, height: 6, borderRadius: '50%' },
  macroDotLabel: { fontSize: 9, color: '#4a7c5e' },
  macroDotVal: { fontSize: 10, color: '#a5d6a7' },

  // 상세 패널
  detailPanel: {
    marginTop: 24,
    background: 'linear-gradient(160deg, #0e2018, #081510)',
    border: '1px solid #2ECC7140',
    borderRadius: 16,
    padding: '20px 24px',
    animation: 'hubSlideUp 0.3s ease',
    position: 'relative',
  },
  detailClose: {
    position: 'absolute', top: 16, right: 16,
    background: 'none', border: '1px solid #1e3a2a', borderRadius: 6,
    color: '#4a7c5e', fontSize: 12, cursor: 'pointer',
    padding: '4px 10px', fontFamily: 'inherit',
  },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 },
  detailEmoji: { fontSize: 40 },
  detailName: { fontSize: 20, fontWeight: 700, color: '#e8f5e9' },
  detailDbName: { fontSize: 12, color: '#4a7c5e', marginTop: 2 },
  detailKcal: { marginLeft: 'auto', textAlign: 'right' },
  detailKcalNum: { fontSize: 36, fontWeight: 300, color: '#2ECC71' },
  detailKcalUnit: { fontSize: 13, color: '#4a7c5e', marginLeft: 4 },
  detailBars: { display: 'flex', flexDirection: 'column', gap: 12 },
  detailBarRow: { display: 'flex', alignItems: 'center', gap: 12 },
  detailBarLabel: { width: 56, fontSize: 12, color: '#a5d6a7', flexShrink: 0 },
  detailBarBg: { flex: 1, height: 6, background: '#1a2a22', borderRadius: 3, overflow: 'hidden' },
  detailBarFill: { height: '100%', borderRadius: 3, transition: 'width 0.8s ease' },
  detailBarVal: { width: 52, textAlign: 'right', fontSize: 12, color: '#e8f5e9', flexShrink: 0 },
  detailBarPct: { width: 38, textAlign: 'right', fontSize: 11, color: '#4a7c5e', flexShrink: 0 },

  // 영양정보 탭
  nutritionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 16,
  },
  nutrCard: {
    background: 'linear-gradient(160deg, #0e2018, #081510)',
    border: '1px solid #1e3a2a',
    borderRadius: 14,
    padding: '18px 16px',
    animation: 'hubCardIn 0.4s ease both',
  },
  nutrHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  nutrEmoji: { fontSize: 24 },
  nutrName: { fontSize: 15, fontWeight: 600, color: '#e8f5e9' },
  nutrServing: { fontSize: 11, color: '#4a7c5e', marginTop: 1 },
  nutrKcal: { marginLeft: 'auto', fontSize: 18, fontWeight: 700, color: '#2ECC71' },
  nutrLegend: { display: 'flex', flexDirection: 'column', gap: 6 },
  nutrLegRow: { display: 'flex', alignItems: 'center', gap: 8 },
  nutrLegDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  nutrLegLabel: { fontSize: 12, color: '#a5d6a7', flex: 1 },
  nutrLegVal: { fontSize: 12, color: '#e8f5e9' },
  nutrLegPct: { fontSize: 11, color: '#4a7c5e', width: 36, textAlign: 'right' },

  // 총합 분석
  summaryWrap: { maxWidth: 800, margin: '0 auto' },
  summaryTitle: { fontSize: 22, fontWeight: 700, color: '#e8f5e9', marginBottom: 6 },
  summarySubtitle: { fontSize: 13, color: '#4a7c5e', marginBottom: 24 },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 14,
    marginBottom: 36,
  },
  summaryCard: {
    background: '#0e2018',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#1e3a2a',
    borderRadius: 12,
    padding: '16px 14px',
    textAlign: 'center',
  },
  summaryCardEmoji: { fontSize: 24, marginBottom: 6 },
  summaryCardLabel: { fontSize: 12, color: '#4a7c5e', marginBottom: 8, letterSpacing: '0.05em' },
  summaryCardVal: { fontSize: 26, fontWeight: 700, lineHeight: 1 },
  summaryCardUnit: { fontSize: 11, color: '#4a7c5e', marginLeft: 3 },
  summaryRdaBar: { height: 4, background: '#1a2a22', borderRadius: 2, margin: '10px 0 6px', overflow: 'hidden' },
  summaryRdaFill: { height: '100%', borderRadius: 2, transition: 'width 0.8s ease' },
  summaryRdaPct: { fontSize: 10, letterSpacing: '0.03em' },
  rankTitle: { fontSize: 16, fontWeight: 600, color: '#e8f5e9', marginBottom: 12 },
  rankList: { display: 'flex', flexDirection: 'column', gap: 10 },
  rankRow: { display: 'flex', alignItems: 'center', gap: 12 },
  rankNum: { width: 20, fontSize: 13, color: '#4a7c5e', textAlign: 'right', flexShrink: 0 },
  rankEmoji: { fontSize: 18, flexShrink: 0 },
  rankName: { width: 70, fontSize: 14, color: '#a5d6a7', flexShrink: 0 },
  rankBarBg: { flex: 1, height: 6, background: '#1a2a22', borderRadius: 3, overflow: 'hidden' },
  rankBarFill: { height: '100%', background: 'linear-gradient(90deg, #1a5c35, #2ECC71)', borderRadius: 3, transition: 'width 0.8s ease' },
  rankKcal: { width: 72, textAlign: 'right', fontSize: 13, color: '#2ECC71', flexShrink: 0 },

  // 로딩
  loadingOverlay: {
    position: 'fixed', inset: 0,
    background: '#0a1a10cc',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 999,
  },
  loadingSpinner: {
    width: 40, height: 40,
    border: '3px solid #1e3a2a',
    borderTop: '3px solid #2ECC71',
    borderRadius: '50%',
    animation: 'hubSpin 0.8s linear infinite',
  },

  // 에러
  errorBanner: {
    position: 'fixed', bottom: 24, left: '50%',
    transform: 'translateX(-50%)',
    background: '#1a0f0a',
    border: '1px solid #ef5350',
    color: '#ef9a9a',
    borderRadius: 8,
    padding: '12px 20px',
    fontSize: 13,
    zIndex: 1000,
    display: 'flex', alignItems: 'center', gap: 12,
  },
  errorClose: {
    background: 'none', border: 'none',
    color: '#ef9a9a', cursor: 'pointer',
    fontSize: 14, padding: 0,
  },
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  @keyframes hubFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hubCardIn {
    from { opacity: 0; transform: scale(0.94) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes hubSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes hubSpin {
    to { transform: rotate(360deg); }
  }

  .hub-card:hover {
    transform: translateY(-3px);
    border-color: #2a5a3a !important;
    box-shadow: 0 8px 24px #00000060;
  }
  .hub-card button:hover { color: #ef5350 !important; }
  button[style*="addBtn"]:hover { background: #1e4a38 !important; }

  input::placeholder { color: #2a5a3a; }
  input:focus { border-color: #2ECC71 !important; box-shadow: 0 0 0 2px #2ECC7120; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #061210; }
  ::-webkit-scrollbar-thumb { background: #1e3a2a; border-radius: 3px; }
`