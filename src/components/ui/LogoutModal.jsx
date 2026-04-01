import React, { useEffect } from 'react'
import { LogOut, X } from 'lucide-react'
import styles from './LogoutModal.module.css'

/**
 * LogoutModal
 * Props:
 *   open      {boolean}   - 모달 표시 여부
 *   onConfirm {function}  - 로그아웃 확인 콜백
 *   onClose   {function}  - 취소 / 닫기 콜백
 */
export default function LogoutModal({ open, onConfirm, onClose }) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
      >
        {/* 닫기 버튼 */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="닫기">
          <X size={16} />
        </button>

        {/* 아이콘 */}
        <div className={styles.iconWrap}>
          <div className={styles.iconBg} />
          <LogOut size={26} className={styles.icon} />
        </div>

        {/* 텍스트 */}
        <h2 className={styles.title} id="logout-title">로그아웃</h2>
        <p className={styles.desc}>
          정말 로그아웃 하시겠어요?<br />
          언제든 다시 로그인할 수 있습니다.
        </p>

        {/* 버튼 */}
        <div className={styles.btnRow}>
          <button className={styles.cancelBtn} onClick={onClose}>
            취소
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            <LogOut size={15} />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
