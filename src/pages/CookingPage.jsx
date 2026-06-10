import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Clock, Flame,
  CheckCircle, Circle, AlertCircle, Youtube, X,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import Timer from '../components/ui/Timer'
import styles from './CookingPage.module.css'

/** youtube_url 에서 videoId 추출 */
function extractVideoId(url) {
  if (!url) return null
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/\s]+)/)
  return m?.[1] ?? null
}

// ── 메인 ────────────────────────────────────────────────────────────
export default function CookingPage() {
  const navigate       = useNavigate()
  const selectedRecipe = useAppStore(s => s.selectedRecipe)

  const [currentStep,    setCurrentStep]    = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [timerKey,       setTimerKey]       = useState(0)
  const [seekSeconds,    setSeekSeconds]    = useState(0)
  const [seekKey,        setSeekKey]        = useState(0)
  const [showModal,      setShowModal]      = useState(false)

  const stepRefs = useRef([])

  const videoSummary = selectedRecipe?.recipe_video_summary ?? []
  const videoId      = extractVideoId(selectedRecipe?.youtube_url)

  // 단계 변경 시 해당 항목으로 스크롤
  useEffect(() => {
    stepRefs.current[currentStep]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentStep])

  // ── 영상 탐색 헬퍼 ──
  const seekTo = (seconds) => {
    setSeekSeconds(seconds)
    setSeekKey(k => k + 1)
  }

  // 왼쪽 사이드바 / 헤더 닷 클릭 → 단계 이동 + 영상 탐색
  const handleStepClick = (idx) => {
    setCurrentStep(idx)
    setTimerKey(k => k + 1)
    seekTo(videoSummary[idx].startSeconds)
  }

  const markComplete = (idx) => setCompletedSteps(prev => new Set([...prev, idx]))

  // 다음 단계 버튼 → 현재 단계 완료 처리 + 다음 단계 이동 + 영상 탐색
  const goNext = () => {
    markComplete(currentStep)
    if (currentStep < videoSummary.length - 1) {
      const nextIdx = currentStep + 1
      setCurrentStep(nextIdx)
      seekTo(videoSummary[nextIdx].startSeconds)
    }
  }

  // 이전 단계 버튼 → 이전 단계 이동 + 영상 탐색
  const goPrev = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1
      setCurrentStep(prevIdx)
      seekTo(videoSummary[prevIdx].startSeconds)
    }
  }

  // 오른쪽 타임라인 클릭 → 영상 탐색
  const handleTimelineSeek = (startSec) => seekTo(startSec)

  // 완료 버튼 → 모달 표시
  const handleComplete = () => {
    markComplete(currentStep)
    setShowModal(true)
  }

  // ── 에러 상태 ──
  if (!selectedRecipe) return (
    <div className={styles.fullCenter}>
      <AlertCircle size={40} style={{ color: '#484F58', marginBottom: 16 }} />
      <p style={{ color: '#8B949E', marginBottom: 16 }}>선택된 레시피가 없습니다.</p>
      <button className={styles.goBtn} onClick={() => navigate('/recipes')}>레시피 선택하러 가기 →</button>
    </div>
  )

  if (videoSummary.length === 0) return (
    <div className={styles.fullCenter}>
      <AlertCircle size={40} style={{ color: '#484F58', marginBottom: 16 }} />
      <p style={{ color: '#8B949E', marginBottom: 16 }}>조리 타임라인 데이터가 없습니다.</p>
      <button className={styles.goBtn} onClick={() => navigate('/recipes')}>레시피 목록으로 돌아가기 →</button>
    </div>
  )

  const totalSteps   = videoSummary.length
  const step         = videoSummary[currentStep]
  const isLast       = currentStep === totalSteps - 1
  const stepDuration = step.endSeconds - step.startSeconds
  const showTimer    = stepDuration >= 60

  const iframeSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?start=${seekSeconds}&autoplay=${seekKey > 0 ? 1 : 0}&rel=0`
    : null

  return (
    <div className={styles.page}>

      {/* ── 완료 모달 ── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setShowModal(false)}>
              <X size={16} />
            </button>
            <div className={styles.modalEmoji}>🎉</div>
            <h2 className={styles.modalTitle}>요리 완성!</h2>
            <p className={styles.modalRecipe}>{selectedRecipe.title}</p>
            <p className={styles.modalSub}>맛있게 드세요 😊<br />요리 기록이 저장되었습니다.</p>
            <div className={styles.modalBtns}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => setShowModal(false)}
              >
                계속 보기
              </button>
              <button
                className={styles.modalBtnPrimary}
                onClick={() => navigate('/recipes')}
              >
                레시피 목록으로
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/recipes')}>
            <ChevronLeft size={15} /> 레시피 목록
          </button>
          <div className={styles.recipeMeta}>
            {selectedRecipe.cookTime > 0 && (
              <span><Clock size={12} />{selectedRecipe.cookTime}분</span>
            )}
            {selectedRecipe.calories > 0 && (
              <span><Flame size={12} />{selectedRecipe.calories}kcal</span>
            )}
            {selectedRecipe.difficulty && (
              <span>{selectedRecipe.difficulty}</span>
            )}
          </div>
        </div>
        <h1 className={styles.recipeTitle}>{selectedRecipe.title}</h1>

        {/* 스텝 진행 바 */}
        <div className={styles.stepsIndicator}>
          {videoSummary.map((s, idx) => (
            <button
              key={idx}
              className={`${styles.stepDot} ${idx === currentStep ? styles.stepDotActive : ''} ${completedSteps.has(idx) ? styles.stepDotDone : ''}`}
              onClick={() => handleStepClick(idx)}
              title={s.stepName}
            >
              {completedSteps.has(idx) ? '✓' : idx + 1}
            </button>
          ))}
          <div className={styles.stepDotTrack}>
            <div
              className={styles.stepDotFill}
              style={{ width: totalSteps > 1 ? `${(currentStep / (totalSteps - 1)) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </header>

      {/* ── 본문: 사이드바 | 가운데(YouTube+스텝) | 타임라인 ── */}
      <div className={styles.workspace}>

        {/* ── 왼쪽: 단계 목록 + 재료 ── */}
        <aside className={styles.sidebar}>
          <p className={styles.sidebarLabel}>단계</p>
          <nav className={styles.stepList}>
            {videoSummary.map((s, idx) => (
              <button
                key={idx}
                ref={el => (stepRefs.current[idx] = el)}
                className={`${styles.stepItem} ${idx === currentStep ? styles.stepItemActive : ''} ${completedSteps.has(idx) ? styles.stepItemDone : ''}`}
                onClick={() => handleStepClick(idx)}
              >
                <span className={styles.stepItemIcon}>
                  {completedSteps.has(idx) ? <CheckCircle size={14} /> : <Circle size={14} />}
                </span>
                <span className={styles.stepItemLabel}>{s.stepName}</span>
                <span className={styles.stepTimerChip}>
                  <Clock size={9} />{s.displayTime}
                </span>
              </button>
            ))}
          </nav>

          {/* 재료 목록 — ingredients: List<String> */}
          {selectedRecipe.ingredients?.length > 0 && (
            <div className={styles.ingBox}>
              <p className={styles.sidebarLabel}>재료</p>
              {selectedRecipe.ingredients.map((name, i) => (
                <div key={i} className={styles.ingRow}>
                  <span className={styles.ingName}>{name}</span>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── 가운데: YouTube 플레이어 + 스텝 내용 ── */}
        <div className={styles.centerPanel}>

          {/* YouTube 플레이어 */}
          <div className={styles.ytPlayerArea}>
            {iframeSrc ? (
              <iframe
                key={seekKey}
                src={iframeSrc}
                title={selectedRecipe.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.ytIframe}
              />
            ) : (
              <div className={styles.ytNoVideo}>
                <Youtube size={32} style={{ opacity: 0.15 }} />
                <span>등록된 영상이 없습니다</span>
              </div>
            )}
          </div>

          {/* 스텝 내용 — 스크롤 영역 */}
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadge}>STEP {currentStep + 1} / {totalSteps}</span>
              <h2 className={styles.stepTitle}>{step.stepName}</h2>
            </div>

            <p className={styles.stepDesc}>{step.description}</p>

            {showTimer && (
              <div className={styles.timerRow}>
                <div className={styles.timerLabel}><Clock size={14} />타이머</div>
                <Timer
                  key={`${currentStep}-${timerKey}`}
                  initialSeconds={stepDuration}
                  onComplete={() => markComplete(currentStep)}
                />
              </div>
            )}
          </div>

          {/* 이전 / 다음 버튼 — 항상 하단에 고정 */}
          <div className={styles.navBtns}>
            <button className={styles.navBtn} onClick={goPrev} disabled={currentStep === 0}>
              <ChevronLeft size={16} />이전
            </button>
            <button
              className={`${styles.navBtn} ${styles.navBtnPrimary}`}
              onClick={isLast ? handleComplete : goNext}
            >
              {isLast ? '완료 ✓' : <>다음 단계<ChevronRight size={16} /></>}
            </button>
          </div>
        </div>

        {/* ── 오른쪽: 조리 타임라인 ── */}
        <aside className={styles.timelinePanel}>
          <div className={styles.timelineHeader}>
            <span className={styles.timelineTitle}>
              <Youtube size={13} className={styles.ytRedIcon} style={{ marginRight: 6 }} />
              조리 타임라인
            </span>
            <span className={styles.timelineCount}>{videoSummary.length}단계</span>
          </div>

          <div className={styles.timelineBody}>
            <VideoTimeline
              steps={videoSummary}
              seekSeconds={seekSeconds}
              onSeek={handleTimelineSeek}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── 타임라인 컴포넌트 ──────────────────────────────────────────────────
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
            <div className={styles.tlLeft}>
              <div className={`${styles.tlDot} ${isActive ? styles.tlDotActive : ''}`} />
              {!isLast && <div className={`${styles.tlLine} ${isActive ? styles.tlLineActive : ''}`} />}
            </div>

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
