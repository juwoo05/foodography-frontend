import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { FileQuestion, Pin, Send, X } from 'lucide-react'
import NoticeLayout from '../components/notice/NoticeLayout'
import { NOTICE_CATEGORIES } from '../components/notice/noticeMeta'
import { createNotice, fetchNotice, updateNotice } from '../utils/api'
import styles from './NoticeWritePage.module.css'
import listStyles from './NoticePage.module.css'

const TITLE_MAX = 200   // NOTICE.TITLE VARCHAR(200)
const WRITE_CATEGORIES = NOTICE_CATEGORIES.filter(c => c.value)   // '전체' 제외

const EMPTY_FORM = { category: 'GENERAL', title: '', content: '', pinned: false }

const toForm = (notice) => ({
  category: notice.category,
  title:    notice.title ?? '',
  content:  notice.content ?? '',
  pinned:   notice.pinnedYn === 'Y',
})

/**
 * 공지 작성·수정 페이지 — 관리자 전용 (App.jsx AdminRoute)
 *
 *   /notice/write             → 새 공지 작성
 *   /notice/:noticeId/edit    → 기존 공지 수정
 *     상세 화면에서 넘어오면 location.state.notice 를 그대로 사용
 *     (주소 직접 입력·새로고침 시에만 서버 조회 — 이때 조회수 +1)
 *
 * 저장 성공 시 해당 공지 상세로 이동
 */
export default function NoticeWritePage() {
  const { noticeId } = useParams()
  const location     = useLocation()

  if (!noticeId) return <NoticeForm initial={EMPTY_FORM} />

  const passed = location.state?.notice
  if (passed && String(passed.noticeId) === noticeId) {
    return <NoticeForm key={noticeId} noticeId={noticeId} initial={toForm(passed)} listSearch={location.state?.listSearch} />
  }
  return <NoticeEditLoader noticeId={noticeId} />
}

// 수정 대상 공지 조회 후 폼 렌더링
function NoticeEditLoader({ noticeId }) {
  const [result, setResult] = useState({ key: null, notice: null, status: null })

  useEffect(() => {
    let alive = true
    fetchNotice(noticeId)
      .then(notice => { if (alive) setResult({ key: noticeId, notice, status: 'ok' }) })
      .catch(err => {
        if (!alive) return
        const code = err.response?.status
        if (code !== 404 && code !== 400) console.error('[NoticeWritePage] 수정할 공지 조회 실패', err)
        setResult({ key: noticeId, notice: null, status: code === 404 || code === 400 ? 'notFound' : 'error' })
      })
    return () => { alive = false }
  }, [noticeId])

  if (result.key !== noticeId) {
    return (
      <NoticeLayout>
        <div className={listStyles.article}>
          <div className={listStyles.skeletonTitle} />
          <div className={listStyles.skeletonText} />
          <div className={listStyles.skeletonTextShort} />
        </div>
      </NoticeLayout>
    )
  }

  if (result.status !== 'ok') {
    return (
      <NoticeLayout>
        <div className={listStyles.state}>
          <FileQuestion size={40} />
          <p>{result.status === 'notFound' ? '없는 공지이거나 삭제된 공지입니다.' : '공지사항을 불러오지 못했어요.'}</p>
          <Link to="/notice" className={listStyles.retryBtn}>목록으로</Link>
        </div>
      </NoticeLayout>
    )
  }

  return <NoticeForm key={noticeId} noticeId={noticeId} initial={toForm(result.notice)} />
}

function NoticeForm({ noticeId, initial, listSearch }) {
  const navigate = useNavigate()
  const isEdit   = !!noticeId

  const [form, setForm]         = useState(initial)
  const [submitting, setSubmit] = useState(false)
  const [error, setError]       = useState('')

  // 취소 → 수정이면 상세로, 작성이면 목록으로
  const cancelPath = isEdit ? `/notice/${noticeId}` : '/notice'

  const update = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [key]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return

    const title   = form.title.trim()
    const content = form.content.trim()
    if (!title)   return setError('제목을 입력해주세요.')
    if (!content) return setError('내용을 입력해주세요.')

    const payload = {
      category: form.category,
      title,
      content,
      pinnedYn: form.pinned ? 'Y' : 'N',
    }

    setSubmit(true)
    try {
      const res = isEdit ? await updateNotice(noticeId, payload) : await createNotice(payload)
      navigate(`/notice/${res.data}`, { replace: true, state: { listSearch } })
    } catch (err) {
      const code = err.response?.status
      if (code !== 400 && code !== 404) console.error('[NoticeWritePage] 공지 저장 실패', err)
      setError(
        code === 403 ? '공지 관리 권한이 없습니다.'
          : err.response?.data?.message ?? '공지사항을 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
      )
      setSubmit(false)
    }
  }

  return (
    <NoticeLayout>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <h2 className={styles.formTitle}>{isEdit ? '공지 수정' : '공지 작성'}</h2>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>분류</span>
            <select className={styles.select} value={form.category} onChange={update('category')}>
              {WRITE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>

          <label className={styles.pinCheck}>
            <input type="checkbox" checked={form.pinned} onChange={update('pinned')} />
            <Pin size={14} /> 상단 고정
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>
            제목 <span className={styles.counter}>{form.title.length}/{TITLE_MAX}</span>
          </span>
          <input
            className={styles.input}
            type="text"
            value={form.title}
            onChange={update('title')}
            maxLength={TITLE_MAX}
            placeholder="공지 제목을 입력하세요"
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>내용</span>
          {/* 일반 텍스트로 저장 — 상세 화면에서 줄바꿈 그대로 표시 */}
          <textarea
            className={styles.textarea}
            value={form.content}
            onChange={update('content')}
            placeholder="공지 내용을 입력하세요"
            rows={14}
          />
        </label>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          <Link to={cancelPath} state={{ listSearch }} className={styles.cancelBtn}><X size={16} /> 취소</Link>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            <Send size={16} /> {submitting ? '저장 중…' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </NoticeLayout>
  )
}
