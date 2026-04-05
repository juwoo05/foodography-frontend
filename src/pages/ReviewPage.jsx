import React, { useState } from 'react';
import styles from './ReviewPage.module.css';
import { Star, MessageCircle, Send, User, Utensils, CalendarDays, PlusCircle, X } from 'lucide-react';

// --- 초기 모크 데이터 (Structure 확장) ---
const INITIAL_REVIEWS = [
    {
        id: 1,
        user: { name: '요리초보', avatar: null },
        recipeName: '스테이크 샐러드',
        rating: 5,
        comment: '냉장고에 남은 야채와 소고기로 근사한 한 끼 했어요! 소스 레시피가 정말 꿀팁이네요. 손님 초대 요리로도 손색없을 것 같아요.',
        date: '2026.03.26',
        replies: [
            { id: 101, user: '집밥선생', text: '와, 정말 맛있어 보이네요! 사진도 잘 찍으셨어요.', date: '1시간 전' },
            { id: 102, user: '알뜰살뜰', text: '저도 오늘 저녁에 도전해봐야겠어요.', date: '30분 전' }
        ]
    },
    {
        id: 2,
        user: { name: '자취왕', avatar: null },
        recipeName: '백종원표 두부 조림',
        rating: 4,
        comment: '간단하고 맛있네요. 양념이 딱 맞아서 밥 두 공기 뚝딱했습니다. 다만 두부를 너무 얇게 썰어서 부서졌어요ㅠㅠ',
        date: '2026.03.25',
        replies: []
    },
];

export default function ReviewPage() {
    const [reviews, setReviews] = useState(INITIAL_REVIEWS);

    // 후기 작성 폼 상태
    const [showForm, setShowForm] = useState(false);
    const [newRecipeName, setNewRecipeName] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [newComment, setNewComment] = useState('');

    // 댓글(답글) 입력 상태 (key: reviewId, value: inputText)
    const [replyInputs, setReplyInputs] = useState({});

    // --- 기능 함수들 ---

    // [기능 1] 평점 선택 logic
    const handleStarClick = (rating) => {
        setNewRating(rating);
    };

    // [기능 2] 새로운 후기 등록
    const handleSubmitReview = (e) => {
        e.preventDefault();
        if (!newRecipeName || newRating === 0 || !newComment) {
            alert('요리 이름, 평점, 후기 내용을 모두 입력해주세요.');
            return;
        }

        const newReviewEntry = {
            id: Date.now(),
            user: { name: '나 (User)', avatar: null }, // 임시 로그인 유저
            recipeName: newRecipeName,
            rating: newRating,
            comment: newComment,
            date: new Date().toLocaleDateString('ko-KR').slice(0, -1), // 오늘 날짜
            replies: []
        };

        setReviews([newReviewEntry, ...reviews]); // 최신순 등록

        // 폼 초기화 및 닫기
        setNewRecipeName('');
        setNewRating(0);
        setNewComment('');
        setShowForm(false);
    };

    // [기능 3] 댓글 달기 input 핸들러
    const handleReplyChange = (reviewId, text) => {
        setReplyInputs(prev => ({ ...prev, [reviewId]: text }));
    };

    // [기능 3] 댓글 등록 handleSubmit
    const handleSubmitReply = (reviewId) => {
        const replyText = replyInputs[reviewId];
        if (!replyText || !replyText.trim()) return;

        const newReply = {
            id: Date.now(),
            user: '나 (User)',
            text: replyText.trim(),
            date: '방금 전'
        };

        setReviews(prevReviews =>
            prevReviews.map(review =>
                review.id === reviewId
                    ? { ...review, replies: [...review.replies, newReply] }
                    : review
            )
        );

        // 해당 input 초기화
        setReplyInputs(prev => ({ ...prev, [reviewId]: '' }));
    };


    // --- UI 렌더링 Helper 함수 ---
    const renderStars = (rating, interactive = false) => {
        return [...Array(5)].map((_, i) => {
            const starValue = i + 1;
            const isFilled = interactive
                ? (hoverRating || newRating) >= starValue
                : rating >= starValue;

            return (
                <Star
                    key={i}
                    size={interactive ? 24 : 16}
                    className={interactive ? styles.interactiveStar : styles.staticStar}
                    fill={isFilled ? "var(--primary-color, #2ECC71)" : "none"}
                    color={isFilled ? "var(--primary-color, #2ECC71)" : "#555"}
                    onClick={interactive ? () => handleStarClick(starValue) : undefined}
                    onMouseEnter={interactive ? () => setHoverRating(starValue) : undefined}
                    onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
                />
            );
        });
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>오늘의 레시피 후기</h1>
                    <p className={styles.subTitle}>REFRIGER-AI 레시피로 만든 맛있는 이야기들을 만나보세요.</p>
                </div>
                {!showForm ? (
                    <button className={styles.writeBtn} onClick={() => setShowForm(true)}>
                        <PlusCircle size={18} />
                        후기 작성하기
                    </button>
                ) : (
                    <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                        <X size={18} />
                        작성 취소
                    </button>
                )}
            </header>

            {/* --- [기능 2] 후기 작성 폼 (Toggle) --- */}
            {showForm && (
                <form className={styles.submissionForm} onSubmit={handleSubmitReview}>
                    <div className={styles.formGroup}>
                        <label><Utensils size={16} /> 어떤 요리를 만드셨나요?</label>
                        <input
                            type="text"
                            placeholder="예: 스테이크 샐러드"
                            value={newRecipeName}
                            onChange={(e) => setNewRecipeName(e.target.value)}
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label><Star size={16} /> 평점을 선택해주세요 (클릭)</label>
                        <div className={styles.starInputAction}>
                            {renderStars(0, true)}
                            <span className={styles.ratingText}>{newRating > 0 ? `${newRating}점` : '선택 안 함'}</span>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label><MessageCircle size={16} /> 솔직한 맛 후기를 남겨주세요.</label>
                        <textarea
                            placeholder="레시피의 좋았던 점이나 나만의 팁을 공유해보세요."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className={styles.textarea}
                            rows={4}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        <Send size={18} />
                        후기 등록하기
                    </button>
                </form>
            )}

            {/* --- 후기 리스트 영역 --- */}
            <div className={styles.list}>
                {reviews.map(review => (
                    <div key={review.id} className={styles.card}>
                        {/* 후기 메인 컨텐츠 */}
                        <div className={styles.reviewMain}>
                            <div className={styles.cardHeader}>
                                <div className={styles.userInfo}>
                                    <div className={styles.avatar}>
                                        <User size={18} color="#aaa" />
                                    </div>
                                    <span className={styles.userName}>{review.user.name}</span>
                                </div>
                                <div className={styles.dateInfo}>
                                    <CalendarDays size={14} />
                                    <span>{review.date}</span>
                                </div>
                            </div>

                            <div className={styles.recipeLine}>
                                <Utensils size={16} className={styles.icon} />
                                <h3 className={styles.recipeName}>{review.recipeName}</h3>
                                <div className={styles.ratingStars}>
                                    {renderStars(review.rating)}
                                </div>
                            </div>

                            <p className={styles.commentBody}>{review.comment}</p>
                        </div>

                        {/* --- [기능 3] 댓글(답글) 섹션 --- */}
                        <div className={styles.commentSection}>
                            <div className={styles.commentCount}>
                                <MessageCircle size={15} />
                                댓글 {review.replies.length}개
                            </div>

                            {review.replies.length > 0 && (
                                <div className={styles.replyList}>
                                    {review.replies.map(reply => (
                                        <div key={reply.id} className={styles.replyItem}>
                                            <span className={styles.replyUser}>{reply.user}</span>
                                            <p className={styles.replyText}>{reply.text}</p>
                                            <span className={styles.replyDate}>{reply.date}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 댓글 입력창 */}
                            <div className={styles.replyInputRow}>
                                <input
                                    type="text"
                                    placeholder="따뜻한 댓글을 남겨주세요..."
                                    value={replyInputs[review.id] || ''}
                                    onChange={(e) => handleReplyChange(review.id, e.target.value)}
                                    className={styles.replyInput}
                                    onKeyPress={(e) => {
                                        if(e.key === 'Enter') handleSubmitReply(review.id);
                                    }}
                                />
                                <button
                                    className={styles.replySubmitBtn}
                                    onClick={() => handleSubmitReply(review.id)}
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}