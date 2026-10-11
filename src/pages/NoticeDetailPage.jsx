import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Eye, FileQuestion, List, Pencil, Pin, CalendarDays, Trash2 } from 'lucide-react'
import NoticeLayout from '../components/notice/NoticeLayout'
import ConfirmModal from '../components/ui/ConfirmModal'
import { categoryLabel } from '../components/notice/noticeMeta'
import { deleteNotice, fetchNotice } from '../utils/api'
import { useAuthStore, isAdmin } from '../store/authStore'
import styles from './NoticePage.module.css'

export default function NoticeDetailPage() {
  const { noticeId } = useParams()
  const location     = useLocation()
  const navigate     = useNavigate()
  const listSearch   = location.state?.listSearch ?? ''   // 목록의 탭·페이지 복원용
  const listPath     = listSearch ? `/notice?${listSearch}` : '/notice'
  const admin        = useAuthStore(s => isAdmin(s.user))   // 관리자만 수정·삭제 버튼 노출

  // 삭제 확인 모달
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteNotice(noticeId)
      navigate(listPath, { replace: true })
    } catch (err) {
      const code = err.response?.status
      if (code !== 404) console.error('[NoticeDetailPage] 공지 삭제 실패', err)
      setDeleteError(
        code === 403 ? '공지 관리 권한이 없습니다.'
          : err.response?.data?.message ?? '공지사항을 삭제하지 못했어요. 잠시 후 다시 시도해주세요.'
      )
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  // 응답을 noticeId 와 함께 저장 → id 가 다르면 로딩 중 (이전·다음 글 이동 시 자동 전환)
  const [result, setResult] = useState({ key: null, notice: null, status: null })

  useEffect(() => {
    let alive = true
    fetchNotice(noticeId)
      .then(notice => { if (alive) setResult({ key: noticeId, notice, status: 'ok' }) })
      .catch(err => {
        if (!alive) return
        // 404 없는 글·숨김 글, 400 숫자가 아닌 id
        const code = err.response?.status
        if (code !== 404 && code !== 400) console.error('[NoticeDetailPage] 공지 상세 조회 실패', err)
        setResult({ key: noticeId, notice: null, status: code === 404 || code === 400 ? 'notFound' : 'error' })
      })
    window.scrollTo({ top: 0 })
    return () => { alive = false }
  }, [noticeId])

  const loading  = result.key !== noticeId
  const notice   = loading ? null : result.notice
  const notFound = !loading && result.status === 'notFound'
  const error    = !loading && result.status === 'error'

  let body
  if (loading) {
    body = (
      <div className={styles.article}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonText} />
        <div className={styles.skeletonText} />
        <div className={styles.skeletonTextShort} />
      </div>
    )
  } else if (notFound || error) {
    body = (
      <div className={styles.state}>
        <FileQuestion size={40} />
        <p>{notFound ? '없는 공지이거나 삭제된 공지입니다.' : '공지사항을 불러오지 못했어요.'}</p>
      </div>
    )
  } else {
    const pinned = notice.pinnedYn === 'Y'
    body = (
      <article className={styles.article}>
        <header className={styles.articleHead}>
          <span className={`${styles.chip} ${styles[`chip_${notice.category}`] ?? ''}`}>
            {pinned && <Pin size={11} />} {categoryLabel(notice.category)}
          </span>
          <h2 className={styles.articleTitle}>{notice.title}</h2>
          <div className={styles.articleMeta}>
            <span><CalendarDays size={14} /> {notice.regDt}</span>
            <span><Eye size={14} /> {notice.viewCnt}</span>
          </div>
        </header>

        {/* 일반 텍스트 + pre-line — HTML 을 렌더링하지 않음 (XSS 방지) */}
        <div className={styles.articleBody}>{notice.content}</div>
      </article>
    )
  }

  return (
    <NoticeLayout>
      {body}

      {/* ── 이전·다음 글 ── */}
      {!loading && notice && !notFound && !error && (
        <nav className={styles.siblings} aria-label="이전·다음 공지">
          <SiblingLink dir="next" id={notice.nextId} title={notice.nextTitle} listSearch={listSearch} />
          <SiblingLink dir="prev" id={notice.prevId} title={notice.prevTitle} listSearch={listSearch} />
        </nav>
      )}

      {deleteError && <p className={styles.actionError} role="alert">{deleteError}</p>}

      <div className={styles.detailActions}>
        <Link to={listPath} className={styles.listBtn}><List size={16} /> 목록으로</Link>
        {admin && notice && (
          <div className={styles.adminActions}>
            <Link
              to={`/notice/${notice.noticeId}/edit`}
              state={{ notice, listSearch }}
              className={styles.listBtn}
            >
              <Pencil size={16} /> 수정
            </Link>
            <button
              type="button"
              className={`${styles.listBtn} ${styles.deleteBtn}`}
              onClick={() => { setDeleteError(''); setConfirmOpen(true) }}
            >
              <Trash2 size={16} /> 삭제
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="공지 삭제"
        desc={<>이 공지를 삭제하시겠어요?<br />삭제된 공지는 목록과 상세에서 더 이상 보이지 않습니다.</>}
        confirmLabel="삭제"
        icon={Trash2}
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </NoticeLayout>
  )
}

function SiblingLink({ dir, id, title, listSearch }) {
  const Icon  = dir === 'next' ? ChevronUp : ChevronDown
  const label = dir === 'next' ? '다음 글' : '이전 글'

  if (!id) {
    return (
      <div className={`${styles.sibling} ${styles.siblingEmpty}`}>
        <span className={styles.siblingLabel}><Icon size={14} /> {label}</span>
        <span className={styles.siblingTitle}>{dir === 'next' ? '다음 글이 없습니다.' : '이전 글이 없습니다.'}</span>
      </div>
    )
  }
  return (
    <Link to={`/notice/${id}`} state={{ listSearch }} className={styles.sibling}>
      <span className={styles.siblingLabel}><Icon size={14} /> {label}</span>
      <span className={styles.siblingTitle}>{title}</span>
    </Link>
  )
}
