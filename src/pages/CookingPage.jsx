import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Clock, Users, Flame,
  CheckCircle, Circle, AlertCircle, Youtube,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { fetchRecipeDetail, MOCK_RECIPE_DETAIL } from '../utils/api'
import Timer from '../components/ui/Timer'
import styles from './CookingPage.module.css'

const USE_MOCK = true

/** youtube_url에서 videoId 추출 */
function extractVideoId(url) {
  if (!url) return null
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]+)/)
  return m?.[1] ?? null
}

// ── 메인 ────────────────────────────────────────────────────────────
export default function CookingPage() {
  const navigate       = useNavigate()
  const selectedRecipe = useAppStore(s => s.selectedRecipe)

  const [detail,         setDetail]        = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [currentStep,    setCurrentStep]    = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [timerKey,       setTimerKey]       = useState(0)

  // YouTube 시간 탐색 — timeline 클릭 시 iframe 재생성
  const [seekSeconds, setSeekSeconds] = useState(0)
  const [seekKey,     setSeekKey]     = useState(0)

  const stepRefs = useRef([])

  const videoId      = extractVideoId(selectedRecipe?.youtube_url)
  // recipe_video_summary: List<VideoSummaryDTO> | null
  const videoSummary = selectedRecipe?.recipe_video_summary ?? []

  // 레시피 로드 (mock 유지)
  useEffect(() => {
    const load = async () => {
      try {
        const data = USE_MOCK
          ? await new Promise(r => setTimeout(() => r(MOCK_RECIPE_DETAIL), 600))
          : await fetchRecipeDetail(selectedRecipe?.id)
        setDetail(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedRecipe])

  // 단계 변경 시 스크롤
  useEffect(() => {
    stepRefs.current[currentStep]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentStep])

  const handleStepClick = (idx) => { setCurrentStep(idx); setTimerKey(k => k + 1) }
  const markComplete    = (idx) => setCompletedSteps(prev => new Set([...prev, idx]))
  const goNext = () => {
    markComplete(currentStep)
    if (currentStep < (detail?.steps?.length ?? 0) - 1) setCurrentStep(s => s + 1)
  }
  const goPrev = () => { if (currentStep > 0) setCurrentStep(s => s - 1) }

  /** 타임라인 클릭 → YouTube 해당 구간으로 이동 */
  const handleTimelineSeek = (startSeconds) => {
    setSeekSeconds(startSeconds)
    setSeekKey(k => k + 1)
  }

  if (!selectedRecipe && !loading) return (
    <div className={styles.fullCenter}>
      <AlertCircle size={40} style={{ color: '#484F58', marginBottom: 16 }} />
      <p style={{ color: '#8B949E', marginBottom: 16 }}>선택된 레시피가 없습니다.</p>
      <button className={styles.goBtn} onClick={() => navigate('/recipes')}>레시피 선택하러 가기 →</button>
    </div>
  )

  if (loading) return (
    <div className={styles.fullCenter}>
      <div className={styles.loadingRing} />
      <p style={{ color: '#8B949E', marginTop: 16 }}>레시피를 불러오는 중...</p>
    </div>
  )

  const totalSteps = detail.steps.length
  const step       = detail.steps[currentStep]
  const isLast     = currentStep === totalSteps - 1
  const allDone    = completedSteps.size === totalSteps

  const iframeSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?start=${seekSeconds}&autoplay=${seekKey > 0 ? 1 : 0}&rel=0`
    : null

  return (
    <div className={styles.page}>

      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/recipes')}>
            <ChevronLeft size={15} /> 레시피 목록
          </button>
          <div className={styles.recipeMeta}>
            <span><Clock size={12} />{detail.cookTime}분</span>
            <span><Users size={12} />{detail.servings}인분</span>
            <span><Flame size={12} />{detail.calories}kcal</span>
          </div>
        </div>
        <h1 className={styles.recipeTitle}>{detail.title}</h1>

        {/* 스텝 진행 바 */}
        <div className={styles.stepsIndicator}>
          {detail.steps.map((s, idx) => (
            <button
              key={idx}
              className={`${styles.stepDot} ${idx === currentStep ? styles.stepDotActive : ''} ${completedSteps.has(idx) ? styles.stepDotDone : ''}`}
              onClick={() => handleStepClick(idx)}
              title={s.title}
            >
              {completedSteps.has(idx) ? '✓' : idx + 1}
            </button>
          ))}
          <div className={styles.stepDotTrack}>
            <div className={styles.stepDotFill} style={{ width: `${((currentStep) / (totalSteps - 1)) * 100}%` }} />
          </div>
        </div>
      </header>

      {/* ── 본문: 사이드바 | 메인 | 유튜브+타임라인 ── */}
      <div className={styles.workspace}>

        {/* ── 왼쪽 사이드바 ── */}
        <aside className={styles.sidebar}>
          <p className={styles.sidebarLabel}>단계</p>
          <nav className={styles.stepList}>
            {detail.steps.map((s, idx) => (
              <button
                key={idx}
                ref={el => (stepRefs.current[idx] = el)}
                className={`${styles.stepItem} ${idx === currentStep ? styles.stepItemActive : ''} ${completedSteps.has(idx) ? styles.stepItemDone : ''}`}
                onClick={() => handleStepClick(idx)}
              >
                <span className={styles.stepItemIcon}>
                  {completedSteps.has(idx) ? <CheckCircle size={14} /> : <Circle size={14} />}
                </span>
                <span className={styles.stepItemLabel}>{s.title}</span>
                {s.timerSeconds && (
                  <span className={styles.stepTimerChip}>
                    <Clock size={9} />{Math.floor(s.timerSeconds / 60)}분
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className={styles.ingBox}>
            <p className={styles.sidebarLabel}>재료</p>
            {detail.ingredients.map(ing => (
              <div key={ing.name} className={styles.ingRow}>
                <span className={styles.ingName}>{ing.name}</span>
                <span className={styles.ingAmt}>{ing.amount}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── 가운데 메인 ── */}
        <main className={styles.mainPanel}>
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>STEP {currentStep + 1} / {totalSteps}</span>
            <h2 className={styles.stepTitle}>{step.title}</h2>
          </div>

          <p className={styles.stepDesc}>{step.description}</p>

          {step.timerSeconds && (
            <div className={styles.timerRow}>
              <div className={styles.timerLabel}><Clock size={14} />타이머</div>
              <Timer
                key={`${currentStep}-${timerKey}`}
                initialSeconds={step.timerSeconds}
                onComplete={() => markComplete(currentStep)}
              />
            </div>
          )}

          {allDone && (
            <div className={styles.completeBanner}>
              <span className={styles.completeEmoji}>🎉</span>
              <div>
                <strong className={styles.completeTitle}>{detail.title} 완성!</strong>
                <p className={styles.completeSub}>맛있게 드세요 😊</p>
              </div>
            </div>
          )}

          <div className={styles.navBtns}>
            <button className={styles.navBtn} onClick={goPrev} disabled={currentStep === 0}>
              <ChevronLeft size={16} />이전
            </button>
            <button
              className={`${styles.navBtn} ${styles.navBtnPrimary}`}
              onClick={isLast ? () => markComplete(currentStep) : goNext}
            >
              {isLast ? '완료 ✓' : <>다음 단계<ChevronRight size={16} /></>}
            </button>
          </div>
        </main>

        {/* ── 오른쪽: YouTube 플레이어 + 타임라인 ── */}
        <aside className={styles.ytPanel}>

          {/* 패널 헤더 */}
          <div className={styles.ytPanelHeader}>
            <span className={styles.ytPanelTitle}>
              <Youtube size={17} className={styles.ytRedIcon} />
              요리 영상
            </span>
            <span className={styles.ytRedBadge}>YouTube</span>
          </div>

          {/* YouTube 플레이어 — DB에 저장된 URL만 표시 */}
          {iframeSrc ? (
            <div className={styles.ytPlayerWrap}>
              <iframe
                key={seekKey}
                src={iframeSrc}
                title={selectedRecipe?.title ?? 'YouTube'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.ytIframe}
              />
            </div>
          ) : (
            <div className={styles.ytNoVideo}>
              <Youtube size={32} style={{ opacity: 0.15 }} />
              <span>등록된 영상이 없습니다</span>
            </div>
          )}

          {/* 조리 타임라인 섹션 */}
          <div className={styles.timelineSection}>
            <div className={styles.timelineHeader}>
              <span className={styles.timelineTitle}>조리 타임라인</span>
              {videoSummary.length > 0 && (
                <span className={styles.timelineCount}>{videoSummary.length}단계</span>
              )}
            </div>

            <div className={styles.timelineBody}>
              {videoSummary.length === 0 ? (
                <div className={styles.timelineEmpty}>
                  <span>타임라인 데이터가 없습니다</span>
                </div>
              ) : (
                <VideoTimeline
                  steps={videoSummary}
                  seekSeconds={seekSeconds}
                  onSeek={handleTimelineSeek}
                />
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── antd Timeline 스타일 커스텀 컴포넌트 ──────────────────────────────
function VideoTimeline({ steps, seekSeconds, onSeek }) {
  return (
    <div className={styles.timeline}>
      {steps.map((step, idx) => {
        const isLast   = idx === steps.length - 1
        const isActive = seekSeconds >= step.startSeconds && seekSeconds < step.endSeconds

        return (
          <div
            key={idx}
            className={`${styles.tlItem} ${isActive ? styles.tlItemActive : ''}`}
            onClick={() => onSeek(step.startSeconds)}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onSeek(step.startSeconds)}
          >
            {/* 왼쪽: 도트 + 연결선 */}
            <div className={styles.tlLeft}>
              <div className={`${styles.tlDot} ${isActive ? styles.tlDotActive : ''}`} />
              {!isLast && <div className={`${styles.tlLine} ${isActive ? styles.tlLineActive : ''}`} />}
            </div>

            {/* 오른쪽: 내용 */}
            <div className={styles.tlContent}>
              <div className={styles.tlTitleRow}>
                <span className={styles.tlStepName}>{step.stepName}</span>
                <span className={styles.tlTime}>{step.displayTime}</span>
              </div>
              <p className={styles.tlDesc}>{step.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
