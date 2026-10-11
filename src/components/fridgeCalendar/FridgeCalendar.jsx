import React, { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import { CategoryIcon } from './FridgeIcons'
import { CATEGORY_ORDER, categoryMeta, groupSpecialDays, specialKindMeta, toYm, toYmd } from './fridgeMeta'
import styles from './FridgeCalendar.module.css'

const MAX_ICONS = 3

/**
 * 냉장고 달력 (FullCalendar 월간)
 *
 * - 날짜 1칸 = 이벤트 1개 (그날 스캔 모두 합산) — 칸이 넘치지 않도록
 * - 이벤트 내용: 그날 분류 아이콘(양념 제외 우선, 최대 3개) + 식료품 수
 * - 특일: 공휴일은 빨간 날짜, 공휴일·잡절·절기는 날짜 옆 라벨 (기념일은 상세 패널에만)
 * - 날짜·이벤트 클릭 → onSelectDate, 화면 이동 → onRangeChange
 */
export default function FridgeCalendar({ scans, specialDays = [], selectedDate, onSelectDate, onRangeChange }) {
  const specialByDate = useMemo(() => groupSpecialDays(specialDays), [specialDays])

  const events = useMemo(() => {
    const byDate = new Map()
    for (const s of scans) {
      if (!byDate.has(s.date)) byDate.set(s.date, [])
      byDate.get(s.date).push(s)
    }
    return [...byDate.entries()].map(([date, list]) => {
      const items = list.flatMap(s => s.items ?? [])
      const cats  = new Set(items.map(i => i.category))
      const order = CATEGORY_ORDER.filter(c => cats.has(c))
      const main  = order.filter(c => c !== 'SEASONING')
      return {
        id: date,
        start: date,
        allDay: true,
        extendedProps: {
          scanCount: list.length,
          itemCount: items.length,
          icons: (main.length ? main : order).slice(0, MAX_ICONS),
          extra: Math.max((main.length ? main : order).length - MAX_ICONS, 0),
        },
      }
    })
  }, [scans])

  return (
    <div className={styles.wrap}>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={koLocale}
        height="auto"
        fixedWeekCount={false}
        headerToolbar={{ left: 'title', center: '', right: 'today prev,next' }}
        events={events}
        eventContent={renderEvent}
        dayCellClassNames={(arg) => {
          const ymd = toYmd(arg.date)
          const cls = []
          if (ymd === selectedDate) cls.push(styles.selected)
          if (specialByDate.get(ymd)?.some(d => d.holiday)) cls.push(styles.holiday)
          return cls
        }}
        dayCellContent={(arg) => renderDayTop(arg, specialByDate.get(toYmd(arg.date)))}
        dateClick={(arg) => onSelectDate(arg.dateStr)}
        eventClick={(arg) => onSelectDate(arg.event.startStr)}
        datesSet={(arg) => onRangeChange({
          start: toYmd(arg.start),
          end:   toYmd(arg.end),
          month: toYm(arg.view.currentStart),
        })}
      />
    </div>
  )
}

/** 날짜 칸 상단 (.fc-daygrid-day-number 안) — 특일 라벨 + 날짜 숫자 */
function renderDayTop(arg, days) {
  const label = days?.find(d => specialKindMeta(d.kind).grid)
  return (
    <>
      {label && (
        <span
          className={styles.dayLabel}
          style={{ color: specialKindMeta(label.kind).color }}
          title={days.map(d => d.name).join(', ')}
        >
          {label.name}
        </span>
      )}
      <span className={styles.dayNum}>{arg.dayNumberText.replace('일', '')}</span>
    </>
  )
}

function renderEvent({ event }) {
  const { scanCount, itemCount, icons, extra } = event.extendedProps
  return (
    <div className={styles.event} title={`스캔 ${scanCount}회 · 식료품 ${itemCount}개`}>
      <span className={styles.icons}>
        {icons.map(c => (
          <span key={c} className={styles.icon} style={{ color: categoryMeta(c).color }}>
            <CategoryIcon category={c} size={14} strokeWidth={2} />
          </span>
        ))}
        {extra > 0 && <span className={styles.extra}>+{extra}</span>}
      </span>
      <span className={styles.count}>
        {itemCount}<small>개</small>
      </span>
      {scanCount > 1 && <span className={styles.scanBadge}>{scanCount}회</span>}
    </div>
  )
}
