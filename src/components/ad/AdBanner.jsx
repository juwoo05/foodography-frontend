import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AD_SLOTS, AD_MOBILE_QUERY } from './adSlots'
import styles from './AdBanner.module.css'

/**
 * 광고 배너 자리
 *
 * - 슬롯 크기를 미리 고정 → 광고가 늦게 로드돼도 레이아웃이 밀리지 않음 (CLS 방지)
 * - 표시 우선순위: adUnit(광고 네트워크) → image(이미지 배너) → promo(자체 홍보) → 빈 플레이스홀더
 * - 이미지 로드 실패 시 promo/플레이스홀더로 자동 대체
 * - 광고 네트워크 연동 시 아래 "광고 코드 자리" 만 교체
 */
export default function AdBanner({ slot, className = '' }) {
  const conf = AD_SLOTS[slot]
  // 실패한 이미지 src 기억 — 설정에서 src 를 바꾸면 자동으로 다시 시도
  const [brokenSrc, setBrokenSrc] = useState(null)
  if (!conf) return null

  const mobile = conf.mobile ?? { width: conf.width, height: conf.height }
  const sizeVars = {
    '--ad-w':  `${conf.width}px`,
    '--ad-ar': `${conf.width} / ${conf.height}`,
    '--ad-mw': `${mobile.width}px`,
    '--ad-mar': `${mobile.width} / ${mobile.height}`,
  }

  const image = conf.image?.src && conf.image.src !== brokenSrc ? conf.image : null

  let content
  if (conf.adUnit) {
    // ── 광고 코드 자리 — 예) AdSense <ins className="adsbygoogle" data-ad-slot={conf.adUnit} ... />
    content = <div className={styles.placeholder} />
  } else if (image) {
    content = (
      <BannerLink href={image.href} newTab={image.newTab} label={image.alt}>
        <picture>
          {image.mobileSrc && <source media={AD_MOBILE_QUERY} srcSet={image.mobileSrc} />}
          <img
            className={styles.image}
            src={image.src}
            alt={image.alt ?? ''}
            width={conf.width}
            height={conf.height}
            loading={image.eager ? 'eager' : 'lazy'}
            decoding="async"
            onError={() => setBrokenSrc(image.src)}
          />
        </picture>
      </BannerLink>
    )
  } else if (conf.promo) {
    content = (
      <Link to={conf.promo.to} className={styles.promo}>
        <span className={styles.promoEyebrow}>{conf.promo.eyebrow}</span>
        <strong className={styles.promoTitle}>{conf.promo.title}</strong>
        <span className={styles.promoCta}>
          {conf.promo.cta} <ArrowRight size={14} />
        </span>
      </Link>
    )
  } else {
    content = (
      <div className={styles.placeholder}>
        <span>광고 영역</span>
        <span className={styles.size}>
          {conf.width}×{conf.height}
          {conf.mobile && ` · 모바일 ${mobile.width}×${mobile.height}`}
        </span>
      </div>
    )
  }

  return (
    <aside
      className={`${styles.slot} ${className}`}
      style={sizeVars}
      aria-label="광고"
      data-ad-slot={slot}
    >
      <span className={`${styles.adLabel} ${image?.labelSide === 'right' ? styles.adLabelRight : ''}`}>AD</span>
      {content}
    </aside>
  )
}

/** 내부 경로('/…')는 SPA 이동, http(s) 외부 URL 은 <a>, 그 외(빈 값·javascript: 등)는 링크 없음 */
function BannerLink({ href, newTab, label, children }) {
  if (href?.startsWith('/') && !href.startsWith('//')) {
    return <Link to={href} className={styles.imageLink} aria-label={label}>{children}</Link>
  }
  if (/^https?:\/\//i.test(href ?? '')) {
    return (
      <a
        href={href}
        className={styles.imageLink}
        aria-label={label}
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer sponsored' } : { rel: 'sponsored' })}
      >
        {children}
      </a>
    )
  }
  return <div className={styles.imageLink}>{children}</div>
}
