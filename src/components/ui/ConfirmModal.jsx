import React, { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import styles from './LogoutModal.module.css'   // 같은 경고형 모달 디자인 재사용

/**
 * ConfirmModal — 되돌리기 어려운 동작(삭제 등) 확인용
 * Props:
 *   open         {boolean}   - 모달 표시 여부
 *   title        {string}    - 제목
 *   desc         {ReactNode} - 설명
 *   confirmLabel {string}    - 확인 버튼 문구
 *   icon         {Component} - lucide 아이콘 (기본 AlertTriangle)
 *   busy         {boolean}   - 처리 중 — 버튼 비활성화, 닫기 막음
 *   onConfirm    {function}  - 확인 콜백
 *   onClose      {function}  - 취소 / 닫기 콜백
 */
export default function ConfirmModal({
  open, title, desc, confirmLabel = '확인', icon = AlertTriangle, busy = false, onConfirm, onClose,
}) {
  const Icon  = icon
  const close = busy ? () => {} : onClose

  // ESC 키로 닫기
  useEffect(() => {
    if (!open || busy) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, busy, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={close}>
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <button className={styles.closeBtn} onClick={close} aria-label="닫기" disabled={busy}>
          <X size={16} />
        </button>

        <div className={styles.iconWrap}>
          <div className={styles.iconBg} />
          <Icon size={26} className={styles.icon} />
        </div>

        <h2 className={styles.title} id="confirm-title">{title}</h2>
        <p className={styles.desc}>{desc}</p>

        <div className={styles.btnRow}>
          <button className={styles.cancelBtn} onClick={close} disabled={busy}>
            취소
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={busy}>
            <Icon size={15} />
            {busy ? '처리 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
