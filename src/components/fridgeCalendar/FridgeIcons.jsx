import React from 'react'

// 냉장고 달력 전용 SVG 아이콘
// 모두 24x24 viewBox, stroke="currentColor" — 부모의 color 로 색 지정

function Svg({ size = 24, className, children, strokeWidth = 1.8 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// ── 분류 ─────────────────────────────────────────────
// 채소 — 잎맥 있는 잎사귀
const VegetableIcon = (p) => (
  <Svg {...p}>
    <path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z" />
    <path d="M5 19l8-8M10 14.2h3.6M13 11V7.6" />
  </Svg>
)

// 과일 — 꼭지 달린 사과
const FruitIcon = (p) => (
  <Svg {...p}>
    <path d="M12 7.6c-1.4-.9-2.9-1.2-4.4-.9C5.1 7.2 4 9.6 4 12.2c0 4 2.6 8.3 5.4 8.3 1 0 1.6-.5 2.6-.5s1.6.5 2.6.5c2.8 0 5.4-4.3 5.4-8.3 0-2.6-1.1-5-3.6-5.5-1.5-.3-3 0-4.4.9z" />
    <path d="M12 7.6c0-2 .7-3.6 2.4-4.6" />
    <path d="M12.6 5.4c1.2-.2 2.4.1 3.2.9" />
  </Svg>
)

// 육류 — 뼈 단면이 보이는 스테이크
const MeatIcon = (p) => (
  <Svg {...p}>
    <path d="M4 12.5C4 8.4 7.5 5 12.2 5 16.8 5 20 7.6 20 11c0 2.4-1.6 3.5-3.8 4.8-2 1.2-3.2 4.2-6.7 4.2C6.4 20 4 16.6 4 12.5z" />
    <circle cx="10" cy="11.5" r="2" />
  </Svg>
)

// 수산 — 물고기
const SeafoodIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12c2.4-3.3 5.3-5 8.3-5s5.4 1.7 6.7 5c-1.3 3.3-3.7 5-6.7 5S7.4 15.3 5 12z" />
    <path d="M5 12 2 8.8v6.4L5 12z" />
    <circle cx="16" cy="11.2" r="0.9" fill="currentColor" stroke="none" />
    <path d="M11 9.6c.8.7 1.2 1.5 1.2 2.4s-.4 1.7-1.2 2.4" />
  </Svg>
)

// 유제품·계란 — 우유팩
const DairyEggIcon = (p) => (
  <Svg {...p}>
    <path d="M8 3h8v3l2 3.2V21H6V9.2L8 6z" />
    <path d="M8 6h8M6 9.2h12" />
    <path d="M10 14.5a2 2 0 1 0 4 0 2 2 0 1 0-4 0" />
  </Svg>
)

// 가공식품 — 통조림 캔
const ProcessedIcon = (p) => (
  <Svg {...p}>
    <ellipse cx="12" cy="5.5" rx="6" ry="2.5" />
    <path d="M6 5.5v13c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-13" />
    <path d="M6 10.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
  </Svg>
)

// 양념 — 소스병
const SeasoningIcon = (p) => (
  <Svg {...p}>
    <path d="M10 2.5h4v3l1.5 2.5V20a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 8.5 20V8L10 5.5z" />
    <path d="M10 5.5h4M8.5 12h7M8.5 16.5h7" />
  </Svg>
)

// 기타 — 상자
const EtcIcon = (p) => (
  <Svg {...p}>
    <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
    <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
  </Svg>
)

const CATEGORY_ICONS = {
  VEGETABLE: VegetableIcon,
  FRUIT:     FruitIcon,
  MEAT:      MeatIcon,
  SEAFOOD:   SeafoodIcon,
  DAIRY_EGG: DairyEggIcon,
  PROCESSED: ProcessedIcon,
  SEASONING: SeasoningIcon,
  ETC:       EtcIcon,
}

/** 분류 코드 → 아이콘 */
export function CategoryIcon({ category, ...p }) {
  const Icon = CATEGORY_ICONS[category] ?? EtcIcon
  return <Icon {...p} />
}

// ── 특일 ─────────────────────────────────────────────
// 공휴일 — 깃발
const FlagIcon = (p) => (
  <Svg {...p}>
    <path d="M5.5 21V3.5" />
    <path d="M5.5 4.5c2.5-1.4 4.6-1.4 6.8 0s4.3 1.4 6.7 0v8.8c-2.4 1.4-4.5 1.4-6.7 0s-4.3-1.4-6.8 0" />
  </Svg>
)

// 명절·잡절 — 김이 오르는 그릇 (복날 삼계탕, 정월대보름 오곡밥 등)
const SteamBowlIcon = (p) => (
  <Svg {...p}>
    <path d="M3.5 12h17a8.5 8.5 0 0 1-17 0z" />
    <path d="M8.5 21h7" />
    <path d="M8.5 8.5c-.8-1 .8-2 0-3M12 8.5c-.8-1 .8-2 0-3M15.5 8.5c-.8-1 .8-2 0-3" />
  </Svg>
)

// 24절기 — 지평선 위 해
const SunHorizonIcon = (p) => (
  <Svg {...p}>
    <path d="M7 16a5 5 0 0 1 10 0" />
    <path d="M2.5 16h19M5 19.5h14" />
    <path d="M12 4.5v2.5M4.8 8.8l1.7 1.7M19.2 8.8l-1.7 1.7" />
  </Svg>
)

// 기념일 — 별
const StarIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.5l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" />
  </Svg>
)

const SPECIAL_ICONS = {
  HOLIDAY:     FlagIcon,
  SUNDRY:      SteamBowlIcon,
  DIVISION:    SunHorizonIcon,
  ANNIVERSARY: StarIcon,
}

/** 특일 분류 → 아이콘 */
export function SpecialDayIcon({ kind, ...p }) {
  const Icon = SPECIAL_ICONS[kind] ?? StarIcon
  return <Icon {...p} />
}

// ── 화면 공용 ────────────────────────────────────────
// 냉장고 (페이지 제목·빈 상태)
export const FridgeIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
    <path d="M5 10h14M8.5 6v1.6M8.5 13v3" />
  </Svg>
)

// 스캔 (뷰파인더 + 렌즈)
export const ScanIcon = (p) => (
  <Svg {...p}>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <circle cx="12" cy="12" r="3.2" />
  </Svg>
)

// 장바구니 수 (식료품 개수)
export const BasketIcon = (p) => (
  <Svg {...p}>
    <path d="M3 9.5h18l-1.6 9.1a2 2 0 0 1-2 1.7H6.6a2 2 0 0 1-2-1.7z" />
    <path d="M8 9.5 11 4M16 9.5 13 4M9 13.5v3M12 13.5v3M15 13.5v3" />
  </Svg>
)

// 신선도 — 막대 3칸 중 level 만큼 채움 (0 = 알 수 없음 → 빈 막대)
export function FreshnessIcon({ level = 0, size = 14, className }) {
  const bars = [
    { x: 4,  y: 14, h: 6 },
    { x: 10, y: 10, h: 10 },
    { x: 16, y: 6,  h: 14 },
  ]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      {bars.map((b, i) => (
        <rect
          key={b.x}
          x={b.x} y={b.y} width="4" height={b.h} rx="1.2"
          fill={i < level ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          opacity={i < level ? 1 : 0.35}
        />
      ))}
    </svg>
  )
}
