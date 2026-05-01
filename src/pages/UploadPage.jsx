import React, { useCallback, useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Camera } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { getPresignedUrl, uploadToS3, analyzeImage } from '../utils/api'
import styles from './UploadPage.module.css'

const USE_MOCK = true

// ── Wizard Steps (AnalyzePage와 동일 구조) ─────────────────────────────
const STEPS = [
  { label: '사진 업로드', s: 'active' },
  { label: 'AI 인식',    s: ''      },
  { label: '결과 교정',  s: ''      },
  { label: '요리 추천',  s: ''      },
  { label: '쇼핑 가이드', s: ''     },
]

const TIPS = [
  { emoji: '💡', text: '냉장고 문을 열고 정면에서 찍으면 인식률이 높아요' },
  { emoji: '🔦', text: '밝은 조명에서 촬영하면 더 정확한 분석이 가능해요' },
  { emoji: '📐', text: '재료가 겹치지 않게 정리 후 촬영하면 좋아요' },
]

export default function UploadPage() {
  const navigate   = useNavigate()
  const fileRef    = useRef(null)
  const [dragging,  setDragging]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState(null)
  const [mounted,   setMounted]   = useState(false)
  const [preview,   setPreview]   = useState(null)

  const setUploadedImage  = useAppStore(s => s.setUploadedImage)
  const setAnalysisResult = useAppStore(s => s.setAnalysisResult)
  const setIsAnalyzing    = useAppStore(s => s.setIsAnalyzing)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  const processFile = useCallback(async (file) => {
    if (!file?.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있어요.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('파일 크기는 20MB 이하여야 해요.')
      return
    }
    setError(null)
    setUploading(true)

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setUploadedImage(objectUrl, file)

    try {
      setIsAnalyzing(true)

      // ── ① Spring에 Presigned URL 요청 ──
      const { url: uploadUrl, filename: s3Key } = await getPresignedUrl(file.name)

      // ── ② S3에 이미지 직접 업로드 ──
      await uploadToS3(uploadUrl, file)

      // ── ③ Spring에 분석 요청 (s3Key 전달 → Spring → FastAPI 파이프라인 실행) ──
      const result = await analyzeImage(s3Key)

      if (!result.success) {
        throw new Error(result.errorMessage || '분석에 실패했습니다.')
      }

      setAnalysisResult(result)
      navigate('/analyze')

    } catch (e) {
      setError(`업로드 중 오류가 발생했어요: ${e.message}`)
      setUploading(false)
      setIsAnalyzing(false)
      setPreview(null)
    }
  }, [navigate, setUploadedImage, setAnalysisResult, setIsAnalyzing])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    processFile(e.dataTransfer.files[0])
  }, [processFile])

  return (
    <div className={`${styles.pageWrap} ${mounted ? styles.pageIn : ''}`}>

      {/* ── Wizard 스텝 바 (AnalyzePage와 동일 구조) ── */}
      <div className={styles.statusBar}>
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={`${styles.statusStep} ${step.s === 'done' ? styles.stepDone : ''} ${step.s === 'active' ? styles.stepActive : ''}`}
          >
            <div className={styles.stepNum}>
              {step.s === 'done' ? '✓' : i + 1}
            </div>
            {step.label}
          </div>
        ))}
      </div>

      {/* ── 본문 ── */}
      <div className={styles.body}>

        {/* 왼쪽: 안내 패널 */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarIcon}>📸</span>
            <div>
              <h2 className={styles.sidebarTitle}>냉장고 사진 업로드</h2>
              <p className={styles.sidebarSub}>AI가 식재료를 자동으로 인식합니다</p>
            </div>
          </div>

          <div className={styles.tipList}>
            <p className={styles.tipHeading}>촬영 팁</p>
            {TIPS.map((tip, i) => (
              <div key={i} className={styles.tipItem} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                <span className={styles.tipEmoji}>{tip.emoji}</span>
                <span className={styles.tipText}>{tip.text}</span>
              </div>
            ))}
          </div>

          <div className={styles.sidebarStats}>
            {[
              { v: '97%',   l: '평균 인식률' },
              { v: '1.8초', l: '분석 속도' },
              { v: '340+',  l: '레시피 DB' },
            ].map((s, i) => (
              <div key={i} className={styles.statItem}>
                <span className={styles.statVal}>{s.v}</span>
                <span className={styles.statLabel}>{s.l}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* 오른쪽: 업로드 존 */}
        <main className={styles.uploadArea}>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => processFile(e.target.files[0])}
          />

          {!uploading ? (
            <>
              {/* 드롭 존 */}
              <div
                className={`${styles.dropZone} ${dragging ? styles.dropZoneDrag : ''}`}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <div className={styles.spotlightBorder} aria-hidden />

                <div className={styles.dropIconWrap}>
                  <div className={styles.dropIconBg} />
                  <Upload size={36} className={styles.dropIcon} />
                </div>

                <p className={styles.dropTitle}>
                  {dragging ? '여기에 놓으세요 ↓' : '사진을 끌어다 놓거나 클릭하세요'}
                </p>
                <p className={styles.dropSub}>JPG · PNG · WebP · 최대 20MB</p>

                <div className={styles.dropFormats}>
                  <span>JPG</span><span>PNG</span><span>WebP</span><span>최대 20MB</span>
                </div>
              </div>

              {/* 구분선 */}
              <div className={styles.divider}>
                <span className={styles.dividerLine} />
                <span className={styles.dividerText}>또는</span>
                <span className={styles.dividerLine} />
              </div>

              {/* 보조 버튼 */}
              <div className={styles.altBtns}>
                <button
                  className={styles.btnUpload}
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={16} />
                  갤러리에서 선택
                </button>
                <button
                  className={styles.btnCamera}
                  onClick={() => alert('카메라 기능 준비 중입니다')}
                >
                  <Camera size={16} />
                  카메라 촬영
                </button>
              </div>

              {error && <p className={styles.errorMsg}>⚠ {error}</p>}

              {/* 뒤로가기 */}
              <button className={styles.backBtn} onClick={() => navigate('/')}>
                ← 홈으로 돌아가기
              </button>
            </>
          ) : (
            /* ── 로딩 중 상태 ── */
            <div className={styles.loadingState}>
              <div className={styles.loadingSpinner} />
              <p className={styles.loadingTitle}>AI 분석 중...</p>
              <p className={styles.loadingSub}>식재료를 인식하고 있어요</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
