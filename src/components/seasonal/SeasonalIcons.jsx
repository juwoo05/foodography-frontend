import React from 'react'

// 제철 식재료 페이지 전용 SVG 아이콘
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

// ── 날씨 ─────────────────────────────────────────────
export const SunIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <g data-rays="">
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2" />
      <path d="M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </g>
  </Svg>
)

export const CloudIcon = (p) => (
  <Svg {...p}>
    <path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.1 9.6 4.5 4.5 0 0 0 7 18.5z" />
  </Svg>
)

export const RainIcon = (p) => (
  <Svg {...p}>
    <path d="M7 14.5h10a3.6 3.6 0 0 0 .5-7.15A5 5 0 0 0 7.9 6.5 4 4 0 0 0 7 14.5z" />
    <g data-drops="">
      <path d="M8.5 17.5l-.8 2.2" />
      <path d="M12.5 17.5l-.8 2.2" />
      <path d="M16.5 17.5l-.8 2.2" />
    </g>
  </Svg>
)

export const SnowIcon = (p) => (
  <Svg {...p}>
    <path d="M7 13.5h10a3.6 3.6 0 0 0 .5-7.15A5 5 0 0 0 7.9 5.5 4 4 0 0 0 7 13.5z" />
    <g data-flakes="">
      <path d="M8.5 17v3M7 18.5h3" />
      <path d="M15.5 17v3M14 18.5h3" />
    </g>
  </Svg>
)

export const ThermometerIcon = (p) => (
  <Svg {...p}>
    <path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z" />
    <path d="M12 9v7" />
  </Svg>
)

export const DropletIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3.2s-6 6.6-6 10.8a6 6 0 0 0 12 0c0-4.2-6-10.8-6-10.8z" />
    <path d="M9.2 14.6a2.8 2.8 0 0 0 2.4 2.6" />
  </Svg>
)

export const WindIcon = (p) => (
  <Svg {...p}>
    <path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5" />
    <path d="M3 13h15a2.5 2.5 0 1 1-2.5 2.5" />
    <path d="M3 17h7" />
  </Svg>
)

export const PinIcon = (p) => (
  <Svg {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Svg>
)

// ── 식재료 분류 ───────────────────────────────────────
export const FruitIcon = (p) => (
  <Svg {...p}>
    <path d="M12 7.5c-1.6-1.2-5.5-1.4-6.6 2.2-1.2 3.9 1.3 9.8 4.4 10.6 1 .3 1.6-.3 2.2-.3s1.2.6 2.2.3c3.1-.8 5.6-6.7 4.4-10.6-1.1-3.6-5-3.4-6.6-2.2z" />
    <path d="M12 7.5c0-1.8.6-3.3 1.8-4.3" />
    <path d="M12.6 5.2c1.4-1.3 3.4-1.4 4.4-.8-.6 1.3-2.4 2-4.4.8z" />
  </Svg>
)

export const VegetableIcon = (p) => (
  <Svg {...p}>
    <path d="M14.5 9.5L4 20" />
    <path d="M14.5 9.5c2.2 2.2 2.4 5 .4 7L9 21.5" />
    <path d="M14.5 9.5c-2.2-2.2-5-2.4-7-.4L3 14" />
    <path d="M15 9l2.5-5M15 9l5-2.5M15 9l4 1" />
  </Svg>
)

export const SeafoodIcon = (p) => (
  <Svg {...p}>
    <path d="M3 12c2.5-4 6-5.5 9.5-5.5S19 9 21 12c-2 3-5 5.5-8.5 5.5S5.5 16 3 12z" />
    <path d="M3 12l-1.2-3M3 12l-1.2 3" />
    <circle cx="16.5" cy="11" r=".9" fill="currentColor" stroke="none" />
    <path d="M10 9.5c.8 1.6.8 3.4 0 5" />
  </Svg>
)

export const GrainIcon = (p) => (
  <Svg {...p}>
    <path d="M12 21V8" />
    <path d="M12 8c-1.6-.4-2.6-1.8-2.6-3.6 1.6.4 2.6 1.8 2.6 3.6z" />
    <path d="M12 8c1.6-.4 2.6-1.8 2.6-3.6-1.6.4-2.6 1.8-2.6 3.6z" />
    <path d="M12 12.5c-1.8-.3-3-1.8-3-3.8 1.8.3 3 1.8 3 3.8zM12 12.5c1.8-.3 3-1.8 3-3.8-1.8.3-3 1.8-3 3.8z" />
    <path d="M12 17c-1.8-.3-3-1.8-3-3.8 1.8.3 3 1.8 3 3.8zM12 17c1.8-.3 3-1.8 3-3.8-1.8.3-3 1.8-3 3.8z" />
  </Svg>
)

export const MushroomIcon = (p) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 0 1 17 0z" />
    <path d="M9.5 12v6.5a2.5 2.5 0 0 0 5 0V12" />
    <circle cx="9" cy="8.5" r=".9" fill="currentColor" stroke="none" />
    <circle cx="14.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
  </Svg>
)

// 축산·가공 — 김이 나는 그릇
export const BowlIcon = (p) => (
  <Svg {...p}>
    <path d="M3 11.5h18a9 9 0 0 1-18 0z" />
    <path d="M8 20h8" />
    <path d="M9 8c-.8-1 .8-2-.1-3.2M12.5 8c-.8-1 .8-2-.1-3.2M16 8c-.8-1 .8-2-.1-3.2" />
  </Svg>
)

// ── 정보 섹션 ─────────────────────────────────────────
export const CartIcon = (p) => (
  <Svg {...p}>
    <path d="M3 4h2.2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.9a1.5 1.5 0 0 0 1.4-1.1L20 8H6.2" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </Svg>
)

export const FridgeIcon = (p) => (
  <Svg {...p}>
    <rect x="5.5" y="2.5" width="13" height="19" rx="2.2" />
    <path d="M5.5 10h13" />
    <path d="M8.5 5.5v2M8.5 12.5v3.5" />
  </Svg>
)

export const KnifeIcon = (p) => (
  <Svg {...p}>
    <path d="M20 4L9.5 14.5l-2.8-.9L17.5 3a1.8 1.8 0 0 1 2.5 1z" />
    <path d="M9.5 14.5l-5.3 5.3a1.4 1.4 0 0 1-2-2l4.5-4.5" />
  </Svg>
)

export const HeartIcon = (p) => (
  <Svg {...p}>
    <path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" />
    <path d="M8 11.5h2l1.2-2 1.6 4 1.2-2h2" />
  </Svg>
)

export const LeafIcon = (p) => (
  <Svg {...p}>
    <path d="M5 19c0-8 5-13.5 15-14-.4 10-6 15-14 15" />
    <path d="M5 19c3-4 6.5-7 10-9" />
  </Svg>
)

export const FlipIcon = (p) => (
  <Svg {...p}>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" />
    <path d="M20 4v4.5h-4.5" />
    <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" />
    <path d="M4 20v-4.5h4.5" />
  </Svg>
)

export const ChevronIcon = ({ dir = 'right', ...p }) => (
  <Svg {...p} strokeWidth={2.2}>
    {dir === 'right' ? <path d="M9 5l7 7-7 7" /> : <path d="M15 5l-7 7 7 7" />}
  </Svg>
)
