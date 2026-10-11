import React from 'react'
import { Megaphone } from 'lucide-react'
import AdBanner from '../ad/AdBanner'
import styles from './NoticeLayout.module.css'

/**
 * 공지사항 목록·상세 공통 레이아웃
 *
 *   헤더
 *   [상단 가로 배너 notice-top]
 *   본문(children) | [사이드 배너 notice-side] (900px 이하에서는 본문 아래로)
 *   [하단 가로 배너 notice-bottom]
 */
export default function NoticeLayout({ children }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Megaphone size={28} /> 공지사항
        </h1>
        <p className={styles.subTitle}>찍고먹어요의 새로운 소식과 업데이트, 점검 일정을 알려드려요.</p>
      </header>

      <AdBanner slot="notice-top" className={styles.adTop} />

      <div className={styles.grid}>
        <section className={styles.main}>{children}</section>
        <div className={styles.side}>
          <AdBanner slot="notice-side" />
        </div>
      </div>

      <AdBanner slot="notice-bottom" className={styles.adBottom} />
    </div>
  )
}
