import React from 'react'
import { CategoryIcon, FreshnessIcon, SpecialDayIcon } from './FridgeIcons'
import { categoryMeta, freshnessMeta, specialKindMeta } from './fridgeMeta'
import styles from './Tags.module.css'

/** 분류 태그 — 아이콘 + 이름 (+ 개수) */
export function CategoryTag({ category, count, size = 'md' }) {
  const meta = categoryMeta(category)
  return (
    <span
      className={`${styles.tag} ${styles.category} ${size === 'sm' ? styles.sm : ''}`}
      style={{ '--tag-c': meta.color }}
    >
      <CategoryIcon category={category} size={size === 'sm' ? 12 : 14} />
      {meta.label}
      {count != null && <b className={styles.count}>{count}</b>}
    </span>
  )
}

/** 신선도 태그 — 막대 아이콘 + 값 */
export function FreshnessTag({ value }) {
  const meta = freshnessMeta(value)
  return (
    <span className={`${styles.tag} ${styles.freshness} ${styles[`fresh_${meta.tone}`]}`} title="스캔 당시 신선도">
      <FreshnessIcon level={meta.level} size={12} />
      {value ?? '알 수 없음'}
    </span>
  )
}

/** 특일 태그 — 분류 아이콘 + 명칭 (공휴일 외 분류인데 쉬는 날이면 '휴일' 배지) */
export function SpecialDayTag({ day }) {
  const meta = specialKindMeta(day.kind)
  return (
    <span
      className={`${styles.tag} ${styles.category} ${styles.sm}`}
      style={{ '--tag-c': meta.color }}
      title={meta.label}
    >
      <SpecialDayIcon kind={day.kind} size={12} />
      {day.name}
      {day.holiday && day.kind !== 'HOLIDAY' && <span className={styles.offDay}>휴일</span>}
    </span>
  )
}
