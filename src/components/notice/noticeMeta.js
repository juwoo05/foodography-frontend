// 공지 카테고리 — 서버 NoticeService.CATEGORIES 와 같은 값
export const NOTICE_CATEGORIES = [
  { value: '',            label: '전체' },
  { value: 'GENERAL',     label: '공지' },
  { value: 'UPDATE',      label: '업데이트' },
  { value: 'EVENT',       label: '이벤트' },
  { value: 'MAINTENANCE', label: '점검' },
]

export const categoryLabel = (value) =>
  NOTICE_CATEGORIES.find(c => c.value === value)?.label ?? '공지'

const NEW_DAYS = 3

// "yyyy-MM-dd HH:mm" → Date (Safari 호환을 위해 T 구분자 사용)
const parseDt = (regDt) => (regDt ? new Date(regDt.replace(' ', 'T')) : null)

// 작성 후 3일 이내면 NEW
export function isNew(regDt) {
  const d = parseDt(regDt)
  return !!d && Date.now() - d.getTime() < NEW_DAYS * 24 * 60 * 60 * 1000
}

// "2026-10-07 14:30" → "2026.10.07"
export const formatDate = (regDt) => (regDt ? regDt.slice(0, 10).replaceAll('-', '.') : '')
