import React, { useState, useEffect, useRef } from 'react'
import styles from './ReviewPage.module.css'
import {
  Star, MessageCircle, Send, User,
  Utensils, CalendarDays, PlusCircle, X, ChevronDown, Loader, ImagePlus,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { fetchMyRecipes, fetchReviews, submitReview, getReviewImageUploadUrl, uploadToS3 } from '../utils/api'

export default function ReviewPage() {
  const reviews      = useAppStore(s => s.reviews)
  const setReviews   = useAppStore(s => s.setReviews)
  const myRecipes    = useAppStore(s => s.myRecipes)
  const setMyRecipes = useAppStore(s => s.setMyRecipes)

  // ── 로딩 상태 ──
  const [listLoading, setListLoading]   = useState(false)
  const [recipesLoading, setRecipesLoading] = useState(false)
  const [submitting, setSubmitting]     = useState(false)

  // ── 폼 상태 ──
  const [showForm,      setShowForm]      = useState(false)
  const [selectedId,    setSelectedId]    = useState(null)   // recipeId (number)
  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const [newRating,     setNewRating]     = useState(0)
  const [hoverRating,   setHoverRating]   = useState(0)
  const [newComment,    setNewComment]    = useState('')
  const [formError,     setFormError]     = useState('')

  // ── 이미지 업로드 상태 ──
  const [imageFile,     setImageFile]     = useState(null)   // File 객체
  const [imagePreview,  setImagePreview]  = useState(null)   // ObjectURL
  const [imageUploading, setImageUploading] = useState(false)
  const imageInputRef = useRef(null)

  const dropdownRef = useRef(null)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── 마운트 시 데이터 로드 ──
  useEffect(() => {
    loadReviews()
    loadMyRecipes()
  }, [])

  const loadReviews = async () => {
    setListLoading(true)
    try {
      const data = await fetchReviews()
      setReviews(data ?? [])
    } catch (err) {
      console.error('[ReviewPage] 리뷰 목록 조회 실패:', err)
    } finally {
      setListLoading(false)
    }
  }

  const loadMyRecipes = async () => {
    setRecipesLoading(true)
    try {
      const data = await fetchMyRecipes()
      setMyRecipes(data ?? [])
    } catch (err) {
      console.error('[ReviewPage] 내 레시피 조회 실패:', err)
    } finally {
      setRecipesLoading(false)
    }
  }

  // ── 폼 열기 / 닫기 ──
  const openForm = () => {
    setShowForm(true)
    setFormError('')
  }
  const closeForm = () => {
    setShowForm(false)
    setSelectedId(null)
    setDropdownOpen(false)
    setNewRating(0)
    setHoverRating(0)
    setNewComment('')
    setFormError('')
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
  }

  // ── 이미지 파일 선택 ──
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  // ── 리뷰 제출 ──
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!selectedId)        return setFormError('레시피를 선택해주세요.')
    if (newRating === 0)    return setFormError('평점을 선택해주세요.')
    if (!newComment.trim()) return setFormError('리뷰 내용을 입력해주세요.')

    setSubmitting(true)
    try {
      // 이미지가 있으면 S3에 먼저 업로드
      let publicUrl = undefined
      if (imageFile) {
        setImageUploading(true)
        const { uploadUrl, publicUrl: url } = await getReviewImageUploadUrl(imageFile.name)
        await uploadToS3(uploadUrl, imageFile)
        publicUrl = url
        setImageUploading(false)
      }

      await submitReview(selectedId, newRating, newComment.trim(), publicUrl)
      closeForm()
      await loadReviews()
    } catch (err) {
      console.error('[ReviewPage] 리뷰 등록 실패:', err)
      setImageUploading(false)
      setFormError('등록 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── 별점 렌더러 ──
  const renderStars = (rating, interactive = false) =>
    [...Array(5)].map((_, i) => {
      const val = i + 1
      const filled = interactive ? (hoverRating || newRating) >= val : rating >= val
      return (
        <Star
          key={i}
          size={interactive ? 26 : 15}
          className={interactive ? styles.interactiveStar : styles.staticStar}
          fill={filled ? '#2ECC71' : 'none'}
          color={filled ? '#2ECC71' : '#555'}
          onClick={interactive ? () => setNewRating(val) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(val) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      )
    })

  return (
    <div className={styles.container}>
      {/* ── 헤더 ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>오늘의 레시피 후기</h1>
          <p className={styles.subTitle}>직접 만들어본 레시피의 솔직한 후기를 남겨보세요.</p>
        </div>
        {!showForm ? (
          <button className={styles.writeBtn} onClick={openForm}>
            <PlusCircle size={18} />후기 작성하기
          </button>
        ) : (
          <button className={styles.cancelBtn} onClick={closeForm}>
            <X size={18} />작성 취소
          </button>
        )}
      </header>

      {/* ── 후기 작성 폼 ── */}
      {showForm && (
        <form className={styles.submissionForm} onSubmit={handleSubmitReview}>

          {/* 레시피 선택 드롭다운 */}
          <div className={styles.formGroup}>
            <label><Utensils size={16} /> 어떤 레시피로 요리하셨나요?</label>
            <div className={styles.customSelect} ref={dropdownRef}>
              <button
                type="button"
                className={styles.customSelectTrigger}
                onClick={() => !recipesLoading && setDropdownOpen(o => !o)}
                disabled={recipesLoading}
              >
                {recipesLoading ? (
                  <span className={styles.placeholder}>레시피 불러오는 중...</span>
                ) : selectedId ? (() => {
                  const r = myRecipes.find(r => r.recipeId === selectedId)
                  return r ? (
                    <div className={styles.dropdownItemInner}>
                      {r.youtube_url_thumbnail
                        ? <img src={r.youtube_url_thumbnail} alt={r.title} className={styles.thumbImg} />
                        : <div className={styles.thumbPlaceholder}><Utensils size={14} /></div>}
                      <span>{r.title}</span>
                    </div>
                  ) : null
                })() : (
                  <span className={styles.placeholder}>레시피를 선택하세요</span>
                )}
                <ChevronDown size={16} className={`${styles.selectIcon} ${dropdownOpen ? styles.selectIconOpen : ''}`} />
              </button>

              {dropdownOpen && (
                <div className={styles.dropdownList}>
                  {myRecipes.map(r => (
                    <div
                      key={r.recipeId}
                      className={`${styles.dropdownItem} ${selectedId === r.recipeId ? styles.dropdownItemSelected : ''}`}
                      onClick={() => { setSelectedId(r.recipeId); setDropdownOpen(false) }}
                    >
                      {r.youtube_url_thumbnail
                        ? <img src={r.youtube_url_thumbnail} alt={r.title} className={styles.thumbImg} />
                        : <div className={styles.thumbPlaceholder}><Utensils size={14} /></div>}
                      <span>{r.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!recipesLoading && myRecipes.length === 0 && (
              <p className={styles.emptyHint}>
                아직 선택한 레시피가 없습니다. 레시피 페이지에서 요리를 시작해보세요!
              </p>
            )}
          </div>

          {/* 평점 */}
          <div className={styles.formGroup}>
            <label><Star size={16} /> 평점을 선택해주세요</label>
            <div className={styles.starInputAction}>
              {renderStars(0, true)}
              <span className={styles.ratingText}>
                {newRating > 0 ? `${newRating}점` : '선택 안 함'}
              </span>
            </div>
          </div>

          {/* 내용 */}
          <div className={styles.formGroup}>
            <label><MessageCircle size={16} /> 솔직한 후기를 남겨주세요</label>
            <textarea
              placeholder="레시피의 좋았던 점이나 나만의 팁을 공유해보세요."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              className={styles.textarea}
              rows={4}
            />
          </div>

          {/* 요리 사진 업로드 */}
          <div className={styles.formGroup}>
            <label><ImagePlus size={16} /> 요리 사진을 올려주세요 (선택)</label>
            {imagePreview ? (
              <div className={styles.imagePreviewWrapper}>
                <img src={imagePreview} alt="미리보기" className={styles.imagePreview} />
                <button type="button" className={styles.imageRemoveBtn} onClick={removeImage}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.imageUploadBtn}
                onClick={() => imageInputRef.current?.click()}
              >
                <ImagePlus size={20} />
                <span>사진 선택하기</span>
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
          </div>

          {/* 에러 메시지 */}
          {formError && <p className={styles.formError}>{formError}</p>}

          <button type="submit" className={styles.submitBtn} disabled={submitting || imageUploading}>
            {imageUploading
              ? <><Loader size={18} className={styles.spinner} />사진 업로드 중...</>
              : submitting
              ? <><Loader size={18} className={styles.spinner} />등록 중...</>
              : <><Send size={18} />후기 등록하기</>
            }
          </button>
        </form>
      )}

      {/* ── 리뷰 목록 ── */}
      {listLoading ? (
        <div className={styles.loadingCenter}>
          <div className={styles.loadingRing} />
          <span>리뷰를 불러오는 중...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className={styles.emptyState}>
          <MessageCircle size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
          <p>아직 등록된 후기가 없습니다.</p>
          <p style={{ fontSize: '0.85rem', color: '#666' }}>첫 번째 후기를 남겨보세요!</p>
        </div>
      ) : (
        <div className={styles.list}>
          {reviews.map(review => (
            <div key={review.reviewId} className={styles.card}>
              <div className={styles.reviewMain}>
                {/* 카드 헤더 */}
                <div className={styles.cardHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.avatar}><User size={18} color="#aaa" /></div>
                    <span className={styles.userName}>{review.userName}</span>
                  </div>
                  <div className={styles.dateInfo}>
                    <CalendarDays size={14} />
                    <span>{review.regDt}</span>
                  </div>
                </div>

                {/* 레시피명 + 썸네일 + 별점 */}
                <div className={styles.recipeLine}>
                  {review.youtubeUrlThumbnail ? (
                    <img
                      src={review.youtubeUrlThumbnail}
                      alt={review.recipeTitle}
                      className={styles.recipeThumb}
                    />
                  ) : (
                    <Utensils size={16} className={styles.icon} />
                  )}
                  <h3 className={styles.recipeName}>{review.recipeTitle}</h3>
                  <div className={styles.ratingStars}>
                    {renderStars(review.rating)}
                  </div>
                </div>

                {/* 후기 내용 */}
                <p className={styles.commentBody}>{review.comment}</p>

                {/* 요리 사진 */}
                {review.imageUrl && (
                  <img
                    src={review.imageUrl}
                    alt="요리 사진"
                    className={styles.reviewImage}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
