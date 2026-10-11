// 냉장고 달력 — 분류·신선도 메타와 날짜 헬퍼 (컴포넌트 파일과 분리: react-refresh 규칙)

// 서버 FoodCategoryUtil 코드와 동일 — 표시 순서 (양념은 항상 마지막)
export const CATEGORY_ORDER = ['VEGETABLE', 'FRUIT', 'MEAT', 'SEAFOOD', 'DAIRY_EGG', 'PROCESSED', 'ETC', 'SEASONING']

export const CATEGORY_META = {
  VEGETABLE: { label: '채소',        color: '#2ECC71' },
  FRUIT:     { label: '과일',        color: '#FF8A5B' },
  MEAT:      { label: '육류',        color: '#E8606A' },
  SEAFOOD:   { label: '수산',        color: '#5DADE2' },
  DAIRY_EGG: { label: '유제품·계란', color: '#F4D58D' },
  PROCESSED: { label: '가공식품',    color: '#B39DDB' },
  SEASONING: { label: '양념',        color: '#C8935A' },
  ETC:       { label: '기타',        color: '#8FA39A' },
}

export const categoryMeta = (code) => CATEGORY_META[code] ?? CATEGORY_META.ETC

// level: 신선도 막대 수 (0 = 알 수 없음)
export const FRESHNESS_META = {
  '좋음':      { level: 3, tone: 'good' },
  '보통':      { level: 2, tone: 'normal' },
  '나쁨':      { level: 1, tone: 'bad' },
  '알 수 없음': { level: 0, tone: 'unknown' },
}

export const freshnessMeta = (value) => FRESHNESS_META[value] ?? FRESHNESS_META['알 수 없음']

/** 양념·부재료 (분석 화면에서 체크로 추가한 항목) */
export const isSeasoningNote = (note) => !!note && note.includes('양념')

// ── 날짜 ────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')

/** Date → yyyy-MM-dd (로컬 기준) */
export const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Date → yyyy-MM (로컬 기준) */
export const toYm = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** yyyy-MM-dd → "10월 9일 (목)" */
export function formatDayLabel(ymd) {
  const [y, m, d] = ymd.split('-').map(Number)
  const day = new Date(y, m - 1, d).getDay()
  return `${m}월 ${d}일 (${WEEKDAYS[day]})`
}

/** "yyyy-MM-dd HH:mm" → "HH:mm" */
export const timeOf = (scanDt) => scanDt?.slice(11, 16) ?? ''

/** 수량 표시 — 숫자 1 은 생략, 숫자는 ×N, 그 외(많음/적음 등)는 그대로 */
export function formatQuantity(q) {
  if (q == null || q === '') return ''
  const n = Number(q)
  if (Number.isFinite(n)) return n > 1 ? `×${n}` : ''
  return q
}

/** 식료품 목록 → 분류별 묶음 [{ category, items }] (CATEGORY_ORDER 순) */
export function groupByCategory(items) {
  const map = new Map()
  for (const it of items) {
    const c = CATEGORY_META[it.category] ? it.category : 'ETC'
    if (!map.has(c)) map.set(c, [])
    map.get(c).push(it)
  }
  return CATEGORY_ORDER.filter(c => map.has(c)).map(c => ({ category: c, items: map.get(c) }))
}

// ── 특일 (한국천문연구원) ────────────────────────────
// grid: 달력 칸에 라벨 표시 여부 (기념일은 많아서 상세 패널에만)
export const SPECIAL_KIND_META = {
  HOLIDAY:     { label: '공휴일', color: '#FF6B6B', grid: true },
  SUNDRY:      { label: '명절·절식', color: '#F39C12', grid: true },
  DIVISION:    { label: '절기',   color: '#2ECC71', grid: true },
  ANNIVERSARY: { label: '기념일', color: '#8FA39A', grid: false },
}

export const specialKindMeta = (kind) => SPECIAL_KIND_META[kind] ?? SPECIAL_KIND_META.ANNIVERSARY

/** 특일 목록 → 날짜별 Map (서버 정렬 순서 유지: 공휴일 > 잡절 > 절기 > 기념일) */
export function groupSpecialDays(days) {
  const map = new Map()
  for (const d of days) {
    if (!map.has(d.date)) map.set(d.date, [])
    map.get(d.date).push(d)
  }
  return map
}
