import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Eye, Inbox, Pencil, Pin, RotateCw } from 'lucide-react'
import NoticeLayout from '../components/notice/NoticeLayout'
import { NOTICE_CATEGORIES, categoryLabel, formatDate, isNew } from '../components/notice/noticeMeta'
import { fetchNotices } from '../utils/api'
import { useAuthStore, isAdmin } from '../store/authStore'
import styles from './NoticePage.module.css'

const PAGE_SIZE   = 10
const PAGE_WINDOW = 5   // 페이지 번호 최대 표시 개수

export default function NoticePage() {
  // 탭·페이지는 URL 쿼리와 동기화 — 새로고침·뒤로가기 시 유지 (page 는 1부터)
  const [searchParams, setSearchParams] = useSearchParams()
  const admin    = useAuthStore(s => isAdmin(s.user))   // 관리자만 글쓰기 버튼 노출
  const category = searchParams.get('category') ?? ''
  const page     = Math.max(parseInt(searchParams.get('page') ?? '1', 10) || 1, 1)

  // 응답을 요청 키와 함께 저장 → 키가 다르면 로딩 중 (늦게 온 이전 응답도 자동 무시)
  const [retry, setRetry]   = useState(0)
  const queryKey            = `${category}|${page}|${retry}`
  const [result, setResult] = useState({ key: null, data: null, error: false })

  useEffect(() => {
    let alive = true
    fetchNotices({ page: page - 1, size: PAGE_SIZE, category })
      .then(data => { if (alive) setResult({ key: queryKey, data, error: false }) })
      .catch(err => {
        console.error('[NoticePage] 공지 목록 조회 실패', err)
        if (alive) setResult({ key: queryKey, data: null, error: true })
      })
    return () => { alive = false }
  }, [queryKey, page, category])

  const loading = result.key !== queryKey
  const error   = !loading && result.error
  const data    = loading ? null : result.data

  const updateQuery = (next) => {
    const params = new URLSearchParams()
    const c = next.category ?? category
    const p = next.page ?? page
    if (c) params.set('category', c)
    if (p > 1) params.set('page', String(p))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const notices    = data?.notices ?? []
  const totalPages = data?.totalPages ?? 0
  const listSearch = searchParams.toString()   // 상세 → "목록으로" 시 복원

  return (
    <NoticeLayout>
      {/* ── 카테고리 탭 ── */}
      <div className={styles.tabs} role="tablist" aria-label="공지 분류">
        {NOTICE_CATEGORIES.map(c => (
          <button
            key={c.value || 'all'}
            role="tab"
            aria-selected={c.value === category}
            className={`${styles.tab} ${c.value === category ? styles.tabActive : ''}`}
            onClick={() => updateQuery({ category: c.value, page: 1 })}
          >
            {c.label}
          </button>
        ))}
        <div className={styles.tabsRight}>
          {data && <span className={styles.total}>총 <strong>{data.totalCount}</strong>건</span>}
          {admin && (
            <Link to="/notice/write" className={styles.writeBtn}><Pencil size={14} /> 글쓰기</Link>
          )}
        </div>
      </div>

      {/* ── 목록 ── */}
      <div className={styles.board}>
        <div className={styles.boardHead} aria-hidden="true">
          <span>분류</span><span>제목</span><span>작성일</span><span>조회</span>
        </div>

        {loading ? (
          <ul className={styles.list}>
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className={styles.skeletonRow}><span /><span /><span /></li>
            ))}
          </ul>
        ) : error ? (
          <div className={styles.state}>
            <p>공지사항을 불러오지 못했어요.</p>
            <button className={styles.retryBtn} onClick={() => setRetry(r => r + 1)}><RotateCw size={14} /> 다시 시도</button>
          </div>
        ) : notices.length === 0 ? (
          <div className={styles.state}>
            <Inbox size={36} />
            <p>등록된 공지사항이 없습니다.</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {notices.map(n => {
              const pinned = n.pinnedYn === 'Y'
              return (
                <li key={n.noticeId}>
                  <Link
                    to={`/notice/${n.noticeId}`}
                    state={{ listSearch }}
                    className={`${styles.row} ${pinned ? styles.rowPinned : ''}`}
                  >
                    <span className={`${styles.chip} ${styles[`chip_${n.category}`] ?? ''}`}>
                      {pinned && <Pin size={11} />} {categoryLabel(n.category)}
                    </span>
                    <span className={styles.rowTitle}>
                      <span className={styles.titleText}>{n.title}</span>
                      {isNew(n.regDt) && <span className={styles.newBadge}>NEW</span>}
                    </span>
                    <span className={styles.rowDate}>{formatDate(n.regDt)}</span>
                    <span className={styles.rowViews}><Eye size={13} /> {n.viewCnt}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── 페이지네이션 ── */}
      {!loading && !error && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={p => updateQuery({ page: p })} />
      )}
    </NoticeLayout>
  )
}

function Pagination({ page, totalPages, onChange }) {
  const start = Math.floor((page - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1
  const end   = Math.min(start + PAGE_WINDOW - 1, totalPages)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  return (
    <nav className={styles.pagination} aria-label="페이지">
      <button className={styles.pageBtn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="이전 페이지">
        <ChevronLeft size={16} />
      </button>
      {pages.map(p => (
        <button
          key={p}
          className={`${styles.pageBtn} ${p === page ? styles.pageActive : ''}`}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button className={styles.pageBtn} disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="다음 페이지">
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
