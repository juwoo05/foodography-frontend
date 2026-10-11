import React, { useEffect, useMemo, useState } from 'react'
import FridgeCalendar from '../components/fridgeCalendar/FridgeCalendar'
import ScanDetailPanel from '../components/fridgeCalendar/ScanDetailPanel'
import { BasketIcon, FridgeIcon, ScanIcon } from '../components/fridgeCalendar/FridgeIcons'
import { CategoryTag } from '../components/fridgeCalendar/Tags'
import { CATEGORY_ORDER, toYmd } from '../components/fridgeCalendar/fridgeMeta'
import { fetchFridgeCalendar, fetchSpecialDays } from '../utils/api'
import styles from './FridgeCalendarPage.module.css'

export default function FridgeCalendarPage() {
  const [selectedDate, setSelectedDate] = useState(() => toYmd(new Date()))

  // FullCalendar 표시 범위 { start, end, month } — datesSet 콜백에서만 갱신
  const [range, setRange] = useState(null)
  const [retry, setRetry] = useState(0)

  // 응답을 요청 키와 함께 저장 → 키가 다르면 로딩 중 (늦게 온 이전 응답도 자동 무시)
  const queryKey = range ? `${range.start}|${range.end}|${retry}` : null
  const [result, setResult] = useState({ key: null, scans: [], error: false })

  useEffect(() => {
    if (!range) return
    let alive = true
    fetchFridgeCalendar({ start: range.start, end: range.end })
      .then(scans => { if (alive) setResult({ key: queryKey, scans, error: false }) })
      .catch(err => {
        console.error('[FridgeCalendarPage] 냉장고 달력 조회 실패', err)
        if (alive) setResult({ key: queryKey, scans: [], error: true })
      })
    return () => { alive = false }
  }, [queryKey, range])

  // 특일 (공휴일·잡절·절기·기념일) — 표시 범위가 걸친 연도별 (12월 화면은 다음 해 1월 포함)
  // 실패해도 달력 본 기능엔 영향 없도록 빈 목록으로 조용히 처리
  const yearsKey = range ? [...new Set([range.start.slice(0, 4), range.end.slice(0, 4)])].join(',') : null
  const [special, setSpecial] = useState({ key: null, days: [] })

  useEffect(() => {
    if (!yearsKey) return
    let alive = true
    Promise.all(yearsKey.split(',').map(y => fetchSpecialDays(Number(y)).catch(() => [])))
      .then(lists => { if (alive) setSpecial({ key: yearsKey, days: lists.flat() }) })
    return () => { alive = false }
  }, [yearsKey])

  const specialDays = special.days

  const loading = !range || result.key !== queryKey
  const error   = !loading && result.error
  // 로딩 중에도 직전 결과를 달력에 유지 — 월 이동 시 깜빡임 방지 (겹치는 주는 같은 데이터)
  const scans   = result.scans

  const handleRangeChange = (next) => {
    setRange(prev => (prev && prev.start === next.start && prev.end === next.end ? prev : next))
    // 선택 날짜가 새 화면 밖이면 → 그 달 1일 (이번 달이면 오늘)
    setSelectedDate(prev => {
      if (prev >= next.start && prev < next.end) return prev
      const today = toYmd(new Date())
      return today.startsWith(next.month) ? today : `${next.month}-01`
    })
  }

  const dayScans = useMemo(
    () => (loading ? [] : scans.filter(s => s.date === selectedDate)),
    [loading, scans, selectedDate],
  )

  const daySpecials = useMemo(
    () => specialDays.filter(d => d.date === selectedDate),
    [specialDays, selectedDate],
  )

  const summary = useMemo(() => summarize(loading ? [] : scans, range?.month), [loading, scans, range])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <FridgeIcon size={30} strokeWidth={1.8} /> 냉장고 달력
        </h1>
        <p className={styles.subTitle}>
          냉장고를 스캔하고 확정한 식료품을 날짜별로 모아 봤어요. 날짜를 누르면 그날 스캔한 식료품을 볼 수 있어요.
        </p>
      </header>

      {/* ── 이번 달 요약 ── */}
      <section className={styles.summary} aria-label="이번 달 요약">
        <div className={styles.stat}>
          <ScanIcon size={18} />
          <span className={styles.statLabel}>{summary.monthLabel} 스캔</span>
          <strong>{loading ? '–' : summary.scanCount}<small>회</small></strong>
        </div>
        <div className={styles.stat}>
          <BasketIcon size={18} />
          <span className={styles.statLabel}>확인한 식료품</span>
          <strong>{loading ? '–' : summary.distinctCount}<small>종</small></strong>
        </div>
        <div className={styles.cats}>
          {!loading && summary.categories.length === 0 && (
            <span className={styles.catsEmpty}>이 달에는 스캔 기록이 없어요.</span>
          )}
          {summary.categories.map(c => (
            <CategoryTag key={c.category} category={c.category} count={c.count} />
          ))}
        </div>
      </section>

      <div className={styles.grid}>
        <div className={styles.main}>
          <FridgeCalendar
            scans={scans}
            specialDays={specialDays}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onRangeChange={handleRangeChange}
          />
          {loading && range && <p className={styles.loadingHint}>불러오는 중…</p>}
        </div>
        <aside className={styles.side}>
          <ScanDetailPanel
            date={selectedDate}
            scans={dayScans}
            specialDays={daySpecials}
            loading={loading}
            error={error}
            onRetry={() => setRetry(r => r + 1)}
          />
        </aside>
      </div>
    </div>
  )
}

/** 표시 중인 달(앞뒤 달 칸 제외)의 스캔 요약 — 분류별 개수는 같은 이름 중복 제거 */
function summarize(scans, month) {
  const monthScans = month ? scans.filter(s => s.date.startsWith(month)) : []
  const names = new Map()   // name → category
  for (const s of monthScans) {
    for (const it of s.items ?? []) {
      if (!names.has(it.name)) names.set(it.name, it.category)
    }
  }
  const perCat = new Map()
  for (const c of names.values()) perCat.set(c, (perCat.get(c) ?? 0) + 1)

  return {
    monthLabel: month ? `${Number(month.slice(5))}월` : '이번 달',
    scanCount: monthScans.length,
    distinctCount: names.size,
    categories: CATEGORY_ORDER.filter(c => perCat.has(c)).map(c => ({ category: c, count: perCat.get(c) })),
  }
}
