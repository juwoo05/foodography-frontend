import React from 'react'
import { Link } from 'react-router-dom'
import { RotateCw } from 'lucide-react'
import { BasketIcon, FridgeIcon, ScanIcon } from './FridgeIcons'
import { CategoryTag, FreshnessTag, SpecialDayTag } from './Tags'
import { formatDayLabel, formatQuantity, groupByCategory, isSeasoningNote, timeOf } from './fridgeMeta'
import styles from './ScanDetailPanel.module.css'

/**
 * 선택한 날짜의 스캔 상세 (조회 전용)
 * 스캔 1회 = 카드 1장, 카드 안은 분류별로 묶고 양념·부재료는 접어서 마지막에 표시
 */
export default function ScanDetailPanel({ date, scans, specialDays = [], loading, error, onRetry }) {
  const totalItems = scans.reduce((n, s) => n + (s.itemCount ?? 0), 0)

  return (
    <section className={styles.panel} aria-live="polite">
      <header className={styles.head}>
        <h2 className={styles.date}>{formatDayLabel(date)}</h2>
        {!loading && !error && scans.length > 0 && (
          <span className={styles.headMeta}>스캔 {scans.length}회 · {totalItems}개</span>
        )}
      </header>

      {specialDays.length > 0 && (
        <div className={styles.specialDays} aria-label="이 날의 특일">
          {specialDays.map(d => <SpecialDayTag key={`${d.kind}-${d.name}`} day={d} />)}
        </div>
      )}

      {loading ? (
        <div className={styles.skeleton}><span /><span /><span /></div>
      ) : error ? (
        <div className={styles.state}>
          <p>스캔 기록을 불러오지 못했어요.</p>
          <button className={styles.retryBtn} onClick={onRetry}><RotateCw size={14} /> 다시 시도</button>
        </div>
      ) : scans.length === 0 ? (
        <div className={styles.state}>
          <FridgeIcon size={40} strokeWidth={1.4} />
          <p>이 날은 스캔 기록이 없어요.</p>
          <Link to="/" className={styles.scanLink}><ScanIcon size={15} /> 냉장고 스캔하러 가기</Link>
        </div>
      ) : (
        <ol className={styles.scanList}>
          {scans.map(scan => <ScanCard key={scan.scanId} scan={scan} />)}
        </ol>
      )}
    </section>
  )
}

function ScanCard({ scan }) {
  const groups    = groupByCategory(scan.items ?? [])
  const main      = groups.filter(g => g.category !== 'SEASONING')
  const seasoning = groups.find(g => g.category === 'SEASONING')

  return (
    <li className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.time}><ScanIcon size={15} /> {timeOf(scan.scanDt)} 스캔</span>
        <span className={styles.itemCount}><BasketIcon size={14} /> {scan.itemCount}개</span>
      </div>

      {main.map(g => <Group key={g.category} group={g} />)}

      {seasoning && (
        <details className={styles.seasoning} open={main.length === 0}>
          <summary>
            <CategoryTag category="SEASONING" count={seasoning.items.length} size="sm" />
            <span className={styles.summaryHint}>양념·부재료 펼치기</span>
          </summary>
          <p className={styles.seasoningNames}>{seasoning.items.map(i => i.name).join(', ')}</p>
        </details>
      )}
    </li>
  )
}

function Group({ group }) {
  return (
    <div className={styles.group}>
      <CategoryTag category={group.category} count={group.items.length} size="sm" />
      <ul className={styles.items}>
        {group.items.map((it, i) => {
          const qty  = formatQuantity(it.quantity)
          const note = isSeasoningNote(it.note) ? null : it.note
          return (
            <li key={`${it.name}-${i}`} className={styles.item}>
              <span className={styles.itemName}>
                {it.name}
                {qty && <span className={styles.qty}>{qty}</span>}
              </span>
              <FreshnessTag value={it.freshness} />
              {note && <span className={styles.note}>{note}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
