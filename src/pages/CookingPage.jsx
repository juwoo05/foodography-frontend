import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, Clock, Users, Flame,
  CheckCircle, Circle, AlertCircle, Youtube, Search,
  ExternalLink, Play, RefreshCw, ImageOff,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { fetchRecipeDetail, MOCK_RECIPE_DETAIL } from '../utils/api'
import Timer from '../components/ui/Timer'
import styles from './CookingPage.module.css'

const USE_MOCK = true

// ── YouTube API ─────────────────────────────────────────────────────
const YT_API_KEY = (import.meta.env.VITE_YOUTUBE_API_KEY ?? '').trim()

async function searchYouTube(query) {
  // API 키가 없거나 플레이스홀더면 mock 반환
  if (!YT_API_KEY || YT_API_KEY === 'YOUR_KEY_HERE') {
    console.info('[YT] API 키 없음 → Mock 데이터 사용')
    return MOCK_YT(query)
  }

  const url = new URL('https://www.googleapis.com/youtube/v3/search')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('q', `${query} 레시피 만들기`)
  url.searchParams.set('type', 'video')
  url.searchParams.set('maxResults', '6')
  url.searchParams.set('relevanceLanguage', 'ko')
  url.searchParams.set('regionCode', 'KR')
  url.searchParams.set('key', YT_API_KEY)

  const res = await fetch(url.toString())

  // HTTP 에러
  if (!res.ok) {
    const text = await res.text()
    console.error('[YT] HTTP 오류', res.status, text)
    throw new Error(`YouTube API 오류 (${res.status})`)
  }

  const data = await res.json()

  // API 레벨 에러 (quota 초과, 키 오류 등)
  if (data.error) {
    console.error('[YT] API 에러:', data.error)
    throw new Error(data.error.message ?? 'YouTube API 오류')
  }

  // videoId 없는 항목 필터링 (라이브 스트림 등)
  return (data.items ?? [])
    .filter(item => item.id?.videoId)
    .map(item => ({
      videoId: item.id.videoId,
      title:   item.snippet.title,
      channel: item.snippet.channelTitle,
      thumb:   item.snippet.thumbnails?.medium?.url
               ?? item.snippet.thumbnails?.default?.url
               ?? `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
    }))
}

const MOCK_YT = (q) => [
  { videoId: 'dQw4w9WgXcQ', title: `${q} 황금 레시피 (백종원 추천)`,       channel: '백종원의 요리비책',   thumb: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
  { videoId: 'kJQP7kiw5Fk', title: `초간단 ${q} 만들기 | 10분 완성`,        channel: '1분요리 뚝딱이형',   thumb: 'https://img.youtube.com/vi/kJQP7kiw5Fk/mqdefault.jpg' },
  { videoId: 'JGwWNGJdvx8', title: `${q} 맛있게 만드는 방법 | 집밥 레시피`, channel: '쿠킹하루',          thumb: 'https://img.youtube.com/vi/JGwWNGJdvx8/mqdefault.jpg' },
  { videoId: 'CevxZvSJLk8', title: `프로급 ${q} 비법 공개!`,                channel: '요리왕 비룡',        thumb: 'https://img.youtube.com/vi/CevxZvSJLk8/mqdefault.jpg' },
  { videoId: '9bZkp7q19f0', title: `누구나 쉽게 ${q} 레시피`,               channel: '오늘 뭐먹지',        thumb: 'https://img.youtube.com/vi/9bZkp7q19f0/mqdefault.jpg' },
  { videoId: 'M7lc1UVf-VE', title: `${q} 전문점 비법 그대로!`,              channel: '집밥 마스터',        thumb: 'https://img.youtube.com/vi/M7lc1UVf-VE/mqdefault.jpg' },
]

// ── 메인 ────────────────────────────────────────────────────────────
export default function CookingPage() {
  const navigate       = useNavigate()
  const selectedRecipe = useAppStore(s => s.selectedRecipe)

  const [detail,         setDetail]        = useState(null)
  const [loading,        setLoading]        = useState(true)
  const [currentStep,    setCurrentStep]    = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [timerKey,       setTimerKey]       = useState(0)
  const [imgLoaded,      setImgLoaded]      = useState(false)

  // YouTube
  const [ytResults,     setYtResults]     = useState([])
  const [ytLoading,     setYtLoading]     = useState(false)
  const [ytQuery,       setYtQuery]       = useState('')
  const [activeVideoId, setActiveVideoId] = useState(null)
  const [ytError,       setYtError]       = useState(null)

  const stepRefs = useRef([])

  // 레시피 로드
  useEffect(() => {
    const load = async () => {
      try {
        const data = USE_MOCK
          ? await new Promise(r => setTimeout(() => r(MOCK_RECIPE_DETAIL), 600))
          : await fetchRecipeDetail(selectedRecipe?.id)
        setDetail(data)
        const title = data?.title ?? selectedRecipe?.title ?? '요리'
        setYtQuery(title)
        fetchVideos(title)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedRecipe])

  // 단계 변경 시 사진 로딩 리셋 + 스크롤
  useEffect(() => {
    setImgLoaded(false)
    stepRefs.current[currentStep]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentStep])

  const fetchVideos = async (query) => {
    if (!query.trim()) return
    setYtLoading(true)
    setActiveVideoId(null)
    setYtError(null)
    try {
      const results = await searchYouTube(query.trim())
      setYtResults(results)
    } catch (e) {
      console.error('[YT] fetchVideos 실패:', e)
      setYtError(e.message)
      setYtResults([])
    } finally {
      setYtLoading(false)
    }
  }

  const handleYtSearch = (e) => { e.preventDefault(); fetchVideos(ytQuery) }
  const handleStepClick = (idx) => { setCurrentStep(idx); setTimerKey(k => k + 1) }
  const markComplete = (idx) => setCompletedSteps(prev => new Set([...prev, idx]))
  const goNext = () => {
    markComplete(currentStep)
    if (currentStep < (detail?.steps?.length ?? 0) - 1) setCurrentStep(s => s + 1)
  }
  const goPrev = () => { if (currentStep > 0) setCurrentStep(s => s - 1) }

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

      {/* ── 본문: 사이드바 | 메인 | 유튜브 ── */}
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
          {/* 스텝 헤더 */}
          <div className={styles.stepHeader}>
            <span className={styles.stepBadge}>STEP {currentStep + 1} / {totalSteps}</span>
            <h2 className={styles.stepTitle}>{step.title}</h2>
          </div>

          {/* 설명 */}
          <p className={styles.stepDesc}>{step.description}</p>

          {/* 타이머 */}
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

          {/* ── 단계별 완성 사진 (크게) ── */}
          {step.stepImage && (
            <div className={styles.stepImgWrap}>
              {/* 스켈레톤 */}
              {!imgLoaded && <div className={styles.stepImgSkeleton} />}
              <img
                src={step.stepImage}
                alt={step.title}
                className={`${styles.stepImg} ${imgLoaded ? styles.stepImgVisible : ''}`}
                onLoad={() => setImgLoaded(true)}
              />
              <div className={styles.stepImgOverlay}>
                <span className={styles.stepImgLabel}>
                  <span className={styles.stepImgDot} />
                  {step.title} 완성 사진
                </span>
              </div>
            </div>
          )}

          {/* 완료 배너 */}
          {allDone && (
            <div className={styles.completeBanner}>
              <span className={styles.completeEmoji}>🎉</span>
              <div>
                <strong className={styles.completeTitle}>{detail.title} 완성!</strong>
                <p className={styles.completeSub}>맛있게 드세요 😊</p>
              </div>
            </div>
          )}

          {/* 네비게이션 */}
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

        {/* ── 오른쪽 유튜브 패널 ── */}
        <aside className={styles.ytPanel}>
          {/* 패널 헤더 */}
          <div className={styles.ytPanelHeader}>
            <span className={styles.ytPanelTitle}>
              <Youtube size={17} className={styles.ytRedIcon} />
              요리 영상
            </span>
            <span className={styles.ytRedBadge}>YouTube</span>
          </div>

          {/* 검색 */}
          <form className={styles.ytSearchForm} onSubmit={handleYtSearch}>
            <div className={styles.ytSearchBox}>
              <Search size={14} style={{ color: '#484F58', flexShrink: 0 }} />
              <input
                className={styles.ytSearchInput}
                value={ytQuery}
                onChange={e => setYtQuery(e.target.value)}
                placeholder="요리명으로 검색..."
              />
              <button type="submit" className={styles.ytSearchBtn}>
                <RefreshCw size={14} />
              </button>
            </div>
          </form>

          {/* 인라인 플레이어 */}
          {activeVideoId && (
            <div className={styles.ytPlayerWrap}>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                title="YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.ytIframe}
              />
            </div>
          )}

          {/* 영상 목록 */}
          <div className={styles.ytList}>
            {ytLoading ? (
              <div className={styles.ytStateCenter}>
                <div className={styles.ytSpinner} />
                <span>검색 중...</span>
              </div>
            ) : ytError ? (
              <div className={styles.ytStateCenter}>
                <Youtube size={32} style={{ opacity: 0.2 }} />
                <span style={{ color: '#F85149', fontSize: 12, textAlign: 'center', padding: '0 8px' }}>
                  {ytError}
                </span>
                <button
                  onClick={() => fetchVideos(ytQuery)}
                  style={{ fontSize: 11, color: '#2ECC71', background: 'none', border: '1px solid rgba(46,204,113,0.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', marginTop: 4 }}
                >
                  다시 시도
                </button>
              </div>
            ) : ytResults.length === 0 ? (
              <div className={styles.ytStateCenter}>
                <Youtube size={32} style={{ opacity: 0.2 }} />
                <span>검색 결과 없음</span>
              </div>
            ) : (
              ytResults.map(video => (
                <YtCard
                  key={video.videoId}
                  video={video}
                  isActive={activeVideoId === video.videoId}
                  onPlay={() => setActiveVideoId(v => v === video.videoId ? null : video.videoId)}
                />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ── YouTube 카드 ──────────────────────────────────────────────────────
function YtCard({ video, isActive, onPlay }) {
  return (
    <div className={`${styles.ytCard} ${isActive ? styles.ytCardActive : ''}`} onClick={onPlay}>
      {/* 썸네일 — 세로로 크게 */}
      <div className={styles.ytCardThumb}>
        <img src={video.thumb} alt={video.title} className={styles.ytCardThumbImg} />
        <div className={styles.ytCardOverlay}>
          <div className={styles.ytPlayBtn}>
            <Play size={22} fill="white" />
          </div>
        </div>
        {isActive && <div className={styles.ytNowPlaying}>▶ 재생 중</div>}
      </div>
      {/* 제목 + 채널 + 링크 */}
      <div className={styles.ytCardMeta}>
        <p className={styles.ytCardTitle}>{video.title}</p>
        <div className={styles.ytCardBottom}>
          <span className={styles.ytCardChannel}>{video.channel}</span>
          <a
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ytExtBtn}
            onClick={e => e.stopPropagation()}
            title="YouTube에서 열기"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}
