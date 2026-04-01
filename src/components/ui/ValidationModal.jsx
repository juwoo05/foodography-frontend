import React, { useEffect, useRef } from 'react'
import { AlertTriangle, X, ChevronRight } from 'lucide-react'
import styles from './ValidationModal.module.css'

/**
 * ValidationModal
 *
 * Props:
 *   open      {boolean}           - 모달 표시 여부
 *   errors    {string[]}          - 오류 메시지 배열
 *   onClose   {() => void}        - 닫기 콜백
 *   title     {string}            - (선택) 모달 제목 (기본값: '입력 오류')
 */
export default function ValidationModal({ open, errors = [], onClose, title = '입력 오류' }) {
  const overlayRef = useRef(null)

  /* ESC 키로 닫기 */
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  /* 스크롤 잠금 */
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vm-title"
    >
      <div className={styles.modal}>
        {/* 헤더 */}
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <AlertTriangle size={18} />
          </div>
          <h2 className={styles.title} id="vm-title">{title}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">
            <X size={16} />
          </button>
        </div>

        {/* 오류 목록 */}
        <ul className={styles.list}>
          {errors.map((msg, i) => (
            <li key={i} className={styles.item}>
              <ChevronRight size={13} className={styles.bullet} />
              <span>{msg}</span>
            </li>
          ))}
        </ul>

        {/* 확인 버튼 */}
        <button className={styles.confirmBtn} onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  )
}
