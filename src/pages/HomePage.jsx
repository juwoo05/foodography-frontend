import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ArrowRight, Sparkles, ChefHat } from 'lucide-react'
import styles from './HomePage.module.css'

const RECENT_SCANS = [
  { id: 1, emoji: '🥦', label: '브로콜리, 계란, 당근 외 2개', date: '2시간 전', count: 5, color: '#2ECC71' },
  { id: 2, emoji: '🥩', label: '소고기, 양파, 대파 외 3개',   date: '어제',    count: 6, color: '#E67E22' },
  { id: 3, emoji: '🍗', label: '닭가슴살, 브로콜리 외 1개',   date: '3일 전',  count: 3, color: '#3498DB' },
]

const FEATURES = [
  {
    icon: '📸',
    title: '사진 한 장으로',
    desc: '냉장고 문 열고 사진 찍으면 끝. AI가 1.8초 만에 뭐가 들었는지 파악합니다.',
    accent: '#2ECC71',
  },
  {
    icon: '🍳',
    title: '오늘 뭐 먹지?',
    desc: '있는 재료로 만들 수 있는 요리 340가지 중 딱 맞는 걸 골라드립니다.',
    accent: '#F39C12',
  },
  {
    icon: '🛒',
    title: '부족한 건 바로 구매',
    desc: '재료가 조금 부족하면 근처 마트 최저가로 연결해 드립니다.',
    accent: '#9B59B6',
  },
]

const STEPS = [
  { num: '01', label: '사진 업로드', sub: '냉장고 사진을 찍거나 갤러리에서 선택' },
  { num: '02', label: 'AI 식재료 인식', sub: '무엇이 있는지, 얼마나 남았는지 파악' },
  { num: '03', label: '요리 추천', sub: '지금 바로 만들 수 있는 메뉴를 제안' },
]

// ── 마그네틱 호버 훅 ──────────────────────────────────────────────────
function useMagnetic(strength = 0.3) {
  const ref = useRef(null)
  const handleMouseMove = useCallback((e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top  + rect.height / 2
    const dx = (e.clientX - cx) * strength
    const dy = (e.clientY - cy) * strength
    el.style.transform = `translate(${dx}px, ${dy}px)`
  }, [strength])
  const handleMouseLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = 'translate(0,0)'
  }, [])
  return { ref, onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave }
}

export default function HomePage() {
  const navigate  = useNavigate()
  const [mounted, setMounted] = useState(false)
  const ctaBtn = useMagnetic(0.25)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const goUpload = () => navigate('/upload')

  return (
    <div className={`${styles.page} ${mounted ? styles.pageIn : ''}`}>

      {/* ── 그레인 오버레이 ── */}
      <div className={styles.grain} aria-hidden />

      {/* ── HERO: 비대칭 Split Layout ── */}
      <section className={styles.hero}>
        {/* 왼쪽: 텍스트 */}
        <div className={styles.heroLeft}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            AI 분석 · 1,204건 완료
          </div>

          <h1 className={styles.heroTitle}>
            <span className={styles.heroLine1}>냉장고 안</span>
            <span className={styles.heroLine2}>식사 전에</span>
            <span className={styles.heroAccent}>찍어두세요</span>
          </h1>

          <p className={styles.heroDesc}>
            사진 한 장이면 충분합니다.<br />
            오늘 뭘 만들지, 뭐가 부족한지<br />
            1.8초 만에 알려드립니다.
          </p>

          {/* CTA 버튼 그룹 */}
          <div className={styles.heroCtas}>
            <button
              {...ctaBtn}
              className={styles.ctaPrimary}
              onClick={goUpload}
              style={{ transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)' }}
            >
              <Upload size={17} />
              사진 올리기
              <ArrowRight size={15} className={styles.ctaArrow} />
            </button>
          </div>

          {/* 미니 스탯 */}
          <div className={styles.heroStats}>
            {[
              { v: '1,204', l: '분석 완료' },
              { v: '340+',  l: '레시피' },
              { v: '1.8초', l: '평균 속도' },
            ].map((s, i) => (
              <div key={i} className={styles.heroStat} style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <span className={styles.heroStatVal}>{s.v}</span>
                <span className={styles.heroStatLabel}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 클릭 유도 카드 (드롭존 대신) */}
        <div className={styles.heroRight}>
          <div
            className={styles.dropZone}
            onClick={goUpload}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && goUpload()}
          >
            {/* Spotlight border effect */}
            <div className={styles.spotlightBorder} aria-hidden />

            <div className={styles.dropContent}>
              <div className={styles.dropIconWrap}>
                <div className={styles.dropIconBg} />
                <Upload size={30} className={styles.dropIcon} />
              </div>
              <p className={styles.dropTitle}>냉장고 사진 올리기</p>
              <p className={styles.dropSub}>클릭하면 업로드 페이지로 이동해요</p>
              <div className={styles.dropFormats}>
                <span>JPG</span><span>PNG</span><span>WebP</span><span>최대 20MB</span>
              </div>
            </div>
          </div>

          {/* 플로팅 데코 카드 — 겹침 효과 */}
          <div className={styles.floatCard1}>
            <span>🥦</span>
            <div>
              <p className={styles.floatCardTitle}>브로콜리 인식됨</p>
              <p className={styles.floatCardSub}>신뢰도 97%</p>
            </div>
            <div className={styles.floatCardDot} />
          </div>

          <div className={styles.floatCard2}>
            <ChefHat size={14} style={{ color: '#F39C12' }} />
            <span className={styles.floatCard2Text}>요리 3개 추천 가능</span>
          </div>
        </div>
      </section>

      {/* ── 기능 카드 ── */}
      <section className={styles.features}>
        <div className={styles.featuresHeader}>
          <span className={styles.featuresBadge}>어떻게 작동하나요</span>
          <h2 className={styles.featuresTitle}>세 단계, 그게 전부입니다</h2>
        </div>

        <div className={styles.featureCards}>
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ── 프로세스 스텝 ── */}
      <section className={styles.steps}>
        <div className={styles.stepsInner}>
          {STEPS.map((s, i) => (
            <div key={i} className={styles.stepItem} style={{ animationDelay: `${i * 0.12}s` }}>
              <span className={styles.stepNum}>{s.num}</span>
              <div className={styles.stepBody}>
                <p className={styles.stepLabel}>{s.label}</p>
                <p className={styles.stepSub}>{s.sub}</p>
              </div>
              {i < STEPS.length - 1 && <div className={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── 최근 스캔 ── */}
      <section className={styles.recentSection}>
        <div className={styles.recentHeader}>
          <h2 className={styles.recentTitle}>최근 스캔</h2>
          <span className={styles.recentMore} onClick={() => navigate('/analyze')}>전체 보기 →</span>
        </div>

        <div className={styles.recentGrid}>
          {RECENT_SCANS.map((scan, i) => (
            <RecentCard key={scan.id} scan={scan} index={i} />
          ))}
        </div>
      </section>

      {/* ── 하단 CTA 배너 ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerGlow} aria-hidden />
        <div className={styles.ctaBannerContent}>
          <div className={styles.ctaBannerLeft}>
            <Sparkles size={18} className={styles.ctaBannerIcon} />
            <div>
              <p className={styles.ctaBannerTitle}>지금 바로 시작해보세요</p>
              <p className={styles.ctaBannerSub}>사진 한 장, 무료, 회원가입 없이</p>
            </div>
          </div>
          <button className={styles.ctaBannerBtn} onClick={goUpload}>
            시작하기 <ArrowRight size={15} />
          </button>
        </div>
      </section>

    </div>
  )
}

// ── Feature Card ─────────────────────────────────────────────────────
function FeatureCard({ feature, index }) {
  const [hovered, setHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const ref = useRef(null)

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      ref={ref}
      className={styles.featureCard}
      style={{
        '--accent': feature.accent,
        animationDelay: `${0.1 + index * 0.1}s`,
        '--mouse-x': `${mousePos.x}px`,
        '--mouse-y': `${mousePos.y}px`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {hovered && <div className={styles.featureSpotlight} />}

      <div className={styles.featureIconWrap} style={{ background: `${feature.accent}18` }}>
        <span className={styles.featureIcon}>{feature.icon}</span>
      </div>
      <h3 className={styles.featureCardTitle}>{feature.title}</h3>
      <p className={styles.featureCardDesc}>{feature.desc}</p>

      <div className={styles.featureCardAccentLine} style={{ background: feature.accent }} />
    </div>
  )
}

// ── Recent Card ──────────────────────────────────────────────────────
function RecentCard({ scan, index }) {
  return (
    <div
      className={styles.recentCard}
      style={{ animationDelay: `${index * 0.08}s`, '--card-accent': scan.color }}
    >
      <div className={styles.recentEmoji}>{scan.emoji}</div>
      <div className={styles.recentInfo}>
        <p className={styles.recentLabel}>{scan.label}</p>
        <p className={styles.recentMeta}>{scan.date} · {scan.count}가지</p>
      </div>
      <div className={styles.recentChevron}>›</div>
    </div>
  )
}
