import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { fetchRecipes, saveAfterResult } from '../utils/api'
import styles from './AnalyzePage.module.css'

// ── 이모지 매핑 ────────────────────────────────────────────────────────
// keywords 중 하나라도 식품명에 포함되면 매칭 (순서 = 우선순위)
const EMOJI_TABLE = [
    { emoji: '🥚', keywords: ['계란', '달걀', '에그'] },
    { emoji: '🥛', keywords: ['우유', '밀크', '두유', '귀리유'] },
    { emoji: '🧀', keywords: ['치즈'] },
    { emoji: '🧈', keywords: ['버터', '마가린'] },
    { emoji: '🥕', keywords: ['당근'] },
    { emoji: '🧅', keywords: ['양파'] },
    { emoji: '🧄', keywords: ['마늘'] },
    { emoji: '🥔', keywords: ['감자'] },
    { emoji: '🍠', keywords: ['고구마'] },
    { emoji: '🍅', keywords: ['토마토'] },
    { emoji: '🥦', keywords: ['브로콜리'] },
    { emoji: '🥬', keywords: ['대파', '쪽파', '파', '상추', '깻잎', '시금치', '배추', '양배추'] },
    { emoji: '🥒', keywords: ['오이', '호박', '주키니'] },
    { emoji: '🍆', keywords: ['가지'] },
    { emoji: '🌽', keywords: ['옥수수', '콘'] },
    { emoji: '🍄', keywords: ['버섯', '표고', '느타리', '팽이'] },
    { emoji: '🫘', keywords: ['두부', '콩', '청국장', '된장'] },
    { emoji: '🌶️', keywords: ['고추', '파프리카', '피망'] },
    { emoji: '🥩', keywords: ['소고기', '돼지고기', '삼겹살', '목살', '갈비', '스테이크', '육'] },
    { emoji: '🍗', keywords: ['닭고기', '치킨', '닭', '가금'] },
    { emoji: '🥓', keywords: ['베이컨', '햄', '소시지', '핫도그'] },
    { emoji: '🐟', keywords: ['생선', '연어', '고등어', '참치', '광어', '조기', '갈치', '명태'] },
    { emoji: '🍤', keywords: ['새우', '오징어', '문어', '낙지', '조개', '굴', '홍합'] },
    { emoji: '🍎', keywords: ['사과'] },
    { emoji: '🍊', keywords: ['오렌지', '귤', '레몬', '라임'] },
    { emoji: '🍌', keywords: ['바나나'] },
    { emoji: '🍇', keywords: ['포도'] },
    { emoji: '🍓', keywords: ['딸기'] },
    { emoji: '🫐', keywords: ['블루베리'] },
    { emoji: '🍑', keywords: ['복숭아', '자두'] },
    { emoji: '🍋', keywords: ['레몬'] },
    { emoji: '🥜', keywords: ['땅콩', '견과', '아몬드', '호두', '잣'] },
    { emoji: '🍚', keywords: ['밥', '쌀', '현미'] },
    { emoji: '🍜', keywords: ['면', '국수', '라면', '파스타', '우동', '소면'] },
    { emoji: '🥫', keywords: ['통조림', '캔', '참치캔'] },
    { emoji: '🧃', keywords: ['주스', '음료'] },
    { emoji: '🥤', keywords: ['음료수', '콜라', '사이다'] },
    { emoji: '🧂', keywords: ['소금', '설탕', '후추', '양념'] },
    { emoji: '🛢️', keywords: ['기름', '올리브유', '식용유'] },
    { emoji: '🍶', keywords: ['식초', '간장', '소스', '케첩'] },
    { emoji: '🧊', keywords: ['얼음'] },
]

const getEmoji = (name) => {
    if (!name) return '🥬'
    const lower = name.toLowerCase()
    for (const { emoji, keywords } of EMOJI_TABLE) {
        if (keywords.some(k => lower.includes(k))) return emoji
    }
    return '🥬'
}

// ── 필수 양념 목록 ─────────────────────────────────────────────────────
const DEFAULT_SEASONINGS = [
    { id: 's1', name: '간장',      emoji: '🫙', desc: '진간장 · 국간장' },
    { id: 's2', name: '소금',      emoji: '🧂', desc: '꽃소금 · 천일염' },
    { id: 's3', name: '설탕',      emoji: '🍬', desc: '백설탕 · 비정제당' },
    { id: 's4', name: '고춧가루',  emoji: '🌶️', desc: '보통맛 · 매운맛' },
    { id: 's5', name: '다진 마늘', emoji: '🧄', desc: '생마늘 · 시판 제품' },
    { id: 's6', name: '참기름',    emoji: '🫗', desc: '들기름 대체 가능' },
    { id: 's7', name: '식초',      emoji: '🍶', desc: '사과식초 · 현미식초' },
    { id: 's8', name: '식용유',    emoji: '🛢️', desc: '포도씨유 · 카놀라유' },
]

// ── Canvas 유틸 ────────────────────────────────────────────────────────

/**
 * 폴리곤 좌표를 canvas 해상도에 맞게 스케일 변환
 * Roboflow 좌표는 원본 이미지 픽셀 기준 → canvas에 렌더링된 이미지 영역 기준으로 변환
 *
 * @param {Array<{x,y}>} polygon  원본 픽셀 좌표
 * @param {number} ox             canvas 내 이미지 시작 x (letterbox offset)
 * @param {number} oy             canvas 내 이미지 시작 y
 * @param {number} scale          이미지 렌더 스케일 (canvas/원본)
 * @returns {Array<{x,y}>}        canvas 픽셀 좌표
 */
function scalePolygon(polygon, ox, oy, scale) {
    return polygon.map(p => ({
        x: ox + p.x * scale,
        y: oy + p.y * scale,
    }))
}

/**
 * 폴리곤의 AABB(축 정렬 바운딩박스) 계산 — 레이블·번호 위치 산출용
 */
function polygonBounds(pts) {
    const xs = pts.map(p => p.x)
    const ys = pts.map(p => p.y)
    const x = Math.min(...xs), y = Math.min(...ys)
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }
}

/**
 * 점(px, py)이 폴리곤 내부인지 판정 (Ray casting)
 * getHit() 클릭/호버 판정에 사용
 */
function pointInPolygon(px, py, pts) {
    let inside = false
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x, yi = pts[i].y
        const xj = pts[j].x, yj = pts[j].y
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
            inside = !inside
        }
    }
    return inside
}

/**
 * 이미지 없을 때 배경 — 폴리곤 중심에 이모지 표시
 */
function drawFridgeBg(ctx, W, H, ingredients) {
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1a2436')
    grad.addColorStop(1, '#0f1821')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(20, H * i / 3)
        ctx.lineTo(W - 20, H * i / 3)
        ctx.stroke()
    }

    const BG_COLORS = ['#2d5a27','#7d3a1e','#6b5a2d','#3a3a20','#1e3a5a','#5a4a1e','#2a2a35','#3a1e1e']
    ingredients.forEach((ing, idx) => {
        const allPts = ing.polygons?.length ? ing.polygons : (ing.polygon?.length ? [ing.polygon] : [])
        if (!allPts.length) return
        allPts.forEach(pts => {
            ctx.fillStyle = BG_COLORS[idx % BG_COLORS.length] + '88'
            ctx.beginPath()
            ctx.moveTo(pts[0].x, pts[0].y)
            pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
            ctx.closePath()
            ctx.fill()

            const { x, y, w, h } = polygonBounds(pts)
            const size = Math.min(w, h) * 0.55
            ctx.font = `${size}px serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(getEmoji(ing.name), x + w / 2, y + h / 2)
        })
    })
}

// ── 세그멘테이션 팔레트 ──────────────────────────────────────────────────
// SAM2 demo(facebookresearch/sam2)의 per-object hue 전략을 참고:
// 객체 인덱스를 golden-angle(137.5°) 간격으로 hue 분산 → 인접 색상 충돌 최소화
const GOLDEN_ANGLE = 137.508
function objectHSL(idx, saturation = 70, lightness = 55) {
    const hue = (idx * GOLDEN_ANGLE) % 360
    return { h: hue, s: saturation, l: lightness }
}
function hslString({ h, s, l }, alpha = 1) {
    return `hsla(${h.toFixed(1)},${s}%,${l}%,${alpha})`
}

/**
 * SAM2 demo LayerCanvas 방식을 참고한 세그멘테이션 시각화
 *
 * 핵심 전략:
 *   1. OffscreenCanvas(마스크 전용) 에 각 폴리곤을 단색으로 채운다.
 *   2. 메인 ctx 에 globalAlpha + source-over 로 합성한다.
 *      → 겹치는 마스크가 있어도 각 레이어가 독립적으로 블렌딩된다.
 *   3. 외곽선(stroke)은 마스크 위에 별도 pass 로 그린다.
 *      → stroke 가 마스크 fill 의 alpha 에 영향받지 않는다.
 *   4. 레이블 + 번호 뱃지는 마지막 pass 로 그려 항상 최상위에 위치한다.
 *
 * 스케일링:
 *   호출 전 getMappedIngredients() 에서 scalePolygon() 이 적용된 상태이므로
 *   이 함수는 이미 canvas 픽셀 좌표로 변환된 pts 를 그대로 사용한다.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array}  ingredients  polygon 이 canvas 픽셀 좌표로 변환된 식재료 목록
 * @param {number|null} focusedId  현재 강조 중인 식재료 id
 */
function drawPolygons(ctx, ingredients, focusedId) {
    const W = ctx.canvas.width
    const H = ctx.canvas.height

    // ── Pass 1: OffscreenCanvas 마스크 합성 ───────────────────────────────
    // SAM2 demo 는 객체마다 독립 OffscreenCanvas 를 만들어 source-over 합성.
    // 동일 패턴을 적용하되, OffscreenCanvas 미지원 환경(구형 브라우저)은
    // createElement('canvas') 폴백으로 처리한다.
    ingredients.forEach((ing, i) => {
        const allPts  = ing.polygons?.length ? ing.polygons : (ing.polygon?.length ? [ing.polygon] : [])
        if (!allPts.length) return
        const isFocused = focusedId === ing.id
        const isOk      = (ing.confidence ?? 1) >= 0.75
        const color     = objectHSL(i)

        allPts.forEach(pts => {
            let offscreen
            try {
                offscreen = new OffscreenCanvas(W, H)
            } catch {
                offscreen = Object.assign(document.createElement('canvas'), { width: W, height: H })
            }
            const oCtx = offscreen.getContext('2d')

            const buildPath = (c) => {
                c.beginPath()
                c.moveTo(pts[0].x, pts[0].y)
                for (let k = 1; k < pts.length; k++) c.lineTo(pts[k].x, pts[k].y)
                c.closePath()
            }

            const fillAlpha = isFocused ? 0.38 : 0.18
            oCtx.fillStyle = hslString(color, fillAlpha)
            buildPath(oCtx)
            oCtx.fill()

            ctx.drawImage(offscreen, 0, 0)

            // ── Pass 2: 외곽선 ───────────────────────────────────────────
            if (isFocused) {
                ctx.shadowBlur  = 18
                ctx.shadowColor = hslString(color, 0.75)
            }
            ctx.lineWidth   = isFocused ? 2.5 : 1.5
            ctx.strokeStyle = isOk
                ? hslString(color, isFocused ? 1 : 0.85)
                : (isFocused ? '#F39C12' : 'rgba(243,156,18,0.85)')
            ctx.setLineDash(isOk ? [] : [5, 4])
            buildPath(ctx)
            ctx.stroke()
            ctx.shadowBlur = 0
            ctx.setLineDash([])
        })
    })

    // ── Pass 3: 레이블 + 번호 뱃지 (항상 최상위) ─────────────────────────
    ingredients.forEach((ing, i) => {
        const allPts = ing.polygons?.length ? ing.polygons : (ing.polygon?.length ? [ing.polygon] : [])
        if (!allPts.length) return
        const pts    = allPts[0]   // 레이블은 첫 번째 폴리곤 기준
        const isOk   = (ing.confidence ?? 1) >= 0.75
        const color  = objectHSL(i)
        const { x, y, w } = polygonBounds(pts)

        // 레이블 배경
        const labelH    = 18
        const labelText = ing.name
        ctx.font        = `bold 10px "Noto Sans KR", sans-serif`
        const labelW    = Math.min(ctx.measureText(labelText).width + 10, w + 10)
        const labelY    = y - labelH < 2 ? y + 1 : y - labelH

        ctx.fillStyle = isOk ? hslString(color) : '#F39C12'
        ctx.beginPath()
        ctx.roundRect(x, labelY, labelW, labelH, 3)
        ctx.fill()

        ctx.fillStyle    = '#0D1117'
        ctx.textAlign    = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(labelText, x + 5, labelY + labelH / 2)

        // 번호 뱃지
        ctx.fillStyle = isOk ? hslString(color) : '#F39C12'
        ctx.beginPath()
        ctx.arc(x + w - 10, y + 10, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle    = '#0D1117'
        ctx.font         = `bold 9px "Space Mono", monospace`
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(i + 1, x + w - 10, y + 10)
    })
}

// ─────────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
    const navigate = useNavigate()
    const uploadedImage    = useAppStore(s => s.uploadedImage)
    const analysisResult   = useAppStore(s => s.analysisResult)   // scanId 포함 원본 응답
    const ingredients      = useAppStore(s => s.correctedIngredients)
    const updateIngredient = useAppStore(s => s.updateIngredient)
    const removeIngredient = useAppStore(s => s.removeIngredient)
    const addIngredient    = useAppStore(s => s.addIngredient)
    const setRecipes       = useAppStore(s => s.setRecipes)
    const resetStore       = useAppStore(s => s.reset)

    const [activePanel,  setActivePanel]  = useState('ingredients')
    const [focusedId,    setFocusedId]    = useState(null)
    const [zoom,         setZoom]         = useState(1)
    const [searchText,   setSearchText]   = useState('')
    const [showModal,    setShowModal]    = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [notif,        setNotif]        = useState({ visible: false, icon: '', text: '' })
    const [aiDotColor,   setAiDotColor]   = useState('#2ECC71')
    const [scanActive,   setScanActive]   = useState(true)
    const [tooltip,      setTooltip]      = useState({ visible: false, x: 0, y: 0, name: '', conf: '' })
    const [editModal,    setEditModal]    = useState({ open: false, id: null, value: '' })

    const [seasoningChecks, setSeasoningChecks] = useState(
        () => Object.fromEntries(DEFAULT_SEASONINGS.map(s => [s.id, true]))
    )

    const canvasRef    = useRef(null)
    const containerRef = useRef(null)
    const imgRef       = useRef(null)
    const notifTimer   = useRef(null)

    useEffect(() => {
        const t = setTimeout(() => setScanActive(false), 3500)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        if (!uploadedImage) { imgRef.current = null; return }
        const img = new Image()
        img.onload = () => { imgRef.current = img; renderCanvas() }
        img.src = uploadedImage
    }, [uploadedImage])

    /**
     * 이미지가 있을 때: Roboflow 원본 픽셀 좌표 → canvas 렌더 좌표로 변환
     * Roboflow는 원본 이미지 픽셀 기준 좌표를 반환하므로
     * canvas에 letterbox(ox, oy)로 그려진 이미지의 scale을 곱해야 정확히 겹침
     */
    const getMappedIngredients = useCallback((W, H) => {
        if (!imgRef.current) return ingredients
        const img   = imgRef.current
        const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight)
        const ox    = (W - img.naturalWidth  * scale) / 2
        const oy    = (H - img.naturalHeight * scale) / 2

        const result = ingredients.map(ing => {
            if (!ing.polygon?.length && !ing.polygons?.length) return ing
            return {
                ...ing,
                polygon:  ing.polygon?.length  ? scalePolygon(ing.polygon, ox, oy, scale) : [],
                polygons: (ing.polygons ?? []).map(p => scalePolygon(p, ox, oy, scale)),
            }
        })

        // ★ 로그 3: 스케일 변환 후 canvas 좌표
        console.log(`[Canvas] W=${W} H=${H} scale=${scale.toFixed(3)} ox=${ox.toFixed(1)} oy=${oy.toFixed(1)}`)
        console.log('[Canvas] scaled polygons:', result.map(r => ({
            name: r.name,
            pts: r.polygon?.slice(0, 3),  // 첫 3점만 — 콘솔 오염 방지
        })))

        return result
    }, [ingredients])

    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current
        const ctr    = containerRef.current
        if (!canvas || !ctr) return

        const W = ctr.clientWidth, H = ctr.clientHeight
        canvas.width = W; canvas.height = H
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, W, H)

        ctx.save()
        ctx.translate(W / 2, H / 2)
        ctx.scale(zoom, zoom)
        ctx.translate(-W / 2, -H / 2)

        if (imgRef.current) {
            const img   = imgRef.current
            const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight)
            const dw    = img.naturalWidth  * scale
            const dh    = img.naturalHeight * scale
            const ox    = (W - dw) / 2
            const oy    = (H - dh) / 2

            ctx.drawImage(img, ox, oy, dw, dh)
            ctx.fillStyle = 'rgba(13,17,23,0.2)'
            ctx.fillRect(0, 0, W, H)

            // 폴리곤 좌표를 canvas 렌더 좌표로 변환 후 그리기
            const mapped = getMappedIngredients(W, H)
            drawPolygons(ctx, mapped, focusedId)
        } else {
            // 이미지 없을 때: 배경 + 폴리곤(원본 좌표 그대로)
            drawFridgeBg(ctx, W, H, ingredients)
            drawPolygons(ctx, ingredients, focusedId)
        }

        ctx.restore()
    }, [ingredients, focusedId, zoom, uploadedImage, getMappedIngredients])

    useEffect(() => { renderCanvas() }, [renderCanvas])

    useEffect(() => {
        const ro = new ResizeObserver(() => renderCanvas())
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [renderCanvas])

    /**
     * 클릭/호버 좌표가 어느 식재료 폴리곤 내부인지 판정
     * Ray casting 알고리즘 사용
     */
    const getHit = useCallback((clientX, clientY) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()

        // zoom 역변환으로 canvas 내 실제 좌표 계산
        const mx = clientX - rect.left
        const my = clientY - rect.top
        const cx = (mx - canvas.width  / 2) / zoom + canvas.width  / 2
        const cy = (my - canvas.height / 2) / zoom + canvas.height / 2

        const mapped = getMappedIngredients(canvas.width, canvas.height)
        let hit = null
        mapped.forEach(ing => {
            const allPts = ing.polygons?.length ? ing.polygons : (ing.polygon?.length ? [ing.polygon] : [])
            if (allPts.some(pts => pointInPolygon(cx, cy, pts))) hit = ing
        })
        return hit
    }, [zoom, getMappedIngredients])

    const handleMouseMove = (e) => {
        const hit  = getHit(e.clientX, e.clientY)
        const rect = canvasRef.current?.getBoundingClientRect()
        if (hit && rect) {
            setTooltip({
                visible: true,
                x: e.clientX - rect.left + 12,
                y: e.clientY - rect.top  - 40,
                name: `${getEmoji(hit.name)} ${hit.name}`,
                conf: `${Math.round((hit.confidence ?? 1) * 100)}%`,
            })
            canvasRef.current.style.cursor = 'pointer'
        } else {
            setTooltip(t => ({ ...t, visible: false }))
            if (canvasRef.current) canvasRef.current.style.cursor = 'crosshair'
        }
    }

    const handleCanvasClick = (e) => {
        const hit = getHit(e.clientX, e.clientY)
        if (hit) {
            toggleFocus(hit.id)
            document.getElementById(`ing-${hit.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
    }

    const toggleFocus = (id) => setFocusedId(prev => prev === id ? null : id)

    const showNotif = (icon, text) => {
        if (notifTimer.current) clearTimeout(notifTimer.current)
        setNotif({ visible: true, icon, text })
        notifTimer.current = setTimeout(() => setNotif(n => ({ ...n, visible: false })), 2500)
    }

    const handleNameChange = (id, val) => {
        const ing = ingredients.find(i => i.id === id)
        if (!ing) return
        const updates = { name: val }
        if ((ing.confidence ?? 1) < 0.6 && val.trim() && val !== '알 수 없음') {
            updates.confidence = 0.90
            showNotif('✓', `"${val}"으로 교정되었습니다`)
        }
        updateIngredient(id, updates)
    }

    const openEditModal = (ing) => {
        setEditModal({ open: true, id: ing.id, value: ing.name })
    }

    const handleEditSave = () => {
        const { id, value } = editModal
        if (value.trim()) handleNameChange(id, value.trim())
        setEditModal({ open: false, id: null, value: '' })
    }

    const handleEditCancel = () => {
        setEditModal({ open: false, id: null, value: '' })
    }

    const handleQty = (id, delta) => {
        const ing = ingredients.find(i => i.id === id)
        if (!ing) return
        const next = Math.max(0, (ing.quantity ?? 1) + delta)
        updateIngredient(id, { quantity: next })
        showNotif('✓', `수량 업데이트: ${ing.name} × ${next}`)
    }

    const handleQtyDirect = (id, val) => {
        updateIngredient(id, { quantity: Math.max(0, parseInt(val) || 0) })
    }

    const handleDelete = (id) => {
        const ing = ingredients.find(i => i.id === id)
        if (focusedId === id) setFocusedId(null)
        removeIngredient(id)
        showNotif('🗑', `"${ing?.name}" 삭제됨`)
    }

    /**
     * 직접 추가 항목은 polygon 없이 생성
     * canvas에서 폴리곤이 없으면 그리지 않고 리스트에만 표시됨
     */
    const handleAddNew = () => {
        const newId = Date.now()
        addIngredient({
            id:         newId,
            name:       '새 재료',
            quantity:   1,
            unit:       '개',
            confidence: 1.0,
            polygon:    [],   // 직접 추가 항목은 폴리곤 없음
        })
        setFocusedId(newId)
        setTimeout(() => {
            openEditModal({ id: newId, name: '새 재료' })
        }, 50)
    }

    const handleReset = () => {
        resetStore(); setFocusedId(null); setSearchText('')
        showNotif('↺', '초기 분석 결과로 되돌렸습니다')
    }

    const handleReanalyze = () => {
        showNotif('🔄', 'AI가 재분석 중입니다...')
        setAiDotColor('#F39C12')
        setTimeout(() => { setAiDotColor('#2ECC71'); showNotif('✓', '재분석이 완료되었습니다') }, 2200)
    }

    const handleConfirm = async () => {
        setShowModal(false); setIsSubmitting(true)
        try {
            // STEP 1: 수정된 식재료 결과 FOOD_AFTER 저장 (실패해도 레시피 추천 진행)
            try {
                await saveAfterResult(analysisResult, ingredients)
            } catch (e) {
                console.error('[API] FOOD_AFTER 저장 실패:', e.message)
            }

            // STEP 2: FOOD_AFTER 기반 레시피 추천 (scanId 전달)
            const scanId = analysisResult?.scanId
            if (!scanId) throw new Error('scanId가 없습니다. 이미지를 다시 분석해주세요.')

            const recipes = await fetchRecipes(scanId)
            setRecipes(recipes)
            navigate('/recipes')
        } catch (e) {
            showNotif('⚠', '레시피 로딩 실패: ' + e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleSeasoning = (id) => {
        setSeasoningChecks(prev => {
            const next = { ...prev, [id]: !prev[id] }
            const s = DEFAULT_SEASONINGS.find(s => s.id === id)
            showNotif(next[id] ? '✓' : '✕', `${s?.name} ${next[id] ? '있음' : '없음'}으로 변경`)
            return next
        })
    }

    const checkedCount   = Object.values(seasoningChecks).filter(Boolean).length
    const uncheckedCount = DEFAULT_SEASONINGS.length - checkedCount

    const okList       = ingredients.filter(i => (i.confidence ?? 1) >= 0.75)
    const warnList     = ingredients.filter(i => (i.confidence ?? 1) < 0.75)
    const total        = ingredients.length
    const pct          = total ? Math.round(okList.length / total * 100) : 0
    const filtered     = ingredients.filter(i => i.name?.includes(searchText))
    const filteredOk   = filtered.filter(i => (i.confidence ?? 1) >= 0.75)
    const filteredWarn = filtered.filter(i => (i.confidence ?? 1) < 0.75)

    if (!uploadedImage && ingredients.length === 0) {
        return (
            <div className={styles.emptyState}>
                <p>업로드된 이미지가 없습니다.</p>
                <button className={styles.btnPrimary} onClick={() => navigate('/')}>← 홈으로 돌아가기</button>
            </div>
        )
    }

    return (
        <div className={styles.pageWrap}>

            {/* ── 스텝 상태 바 ── */}
            <div className={styles.statusBar}>
                {[
                    { label: '사진 업로드', s: 'done'   },
                    { label: 'AI 인식',    s: 'done'   },
                    { label: '결과 교정',  s: 'active' },
                    { label: '요리 추천',  s: ''       },
                    { label: '쇼핑 가이드', s: ''      },
                ].map((step, i) => (
                    <div key={i} className={`${styles.statusStep} ${step.s === 'done' ? styles.stepDone : ''} ${step.s === 'active' ? styles.stepActive : ''}`}>
                        <div className={styles.stepNum}>{step.s === 'done' ? '✓' : i + 1}</div>
                        {step.label}
                    </div>
                ))}
            </div>

            {/* ── 메인 ── */}
            <div className={styles.main}>

                {/* ── LEFT: VISUALIZER ── */}
                <div className={styles.visualizer}>
                    <div className={styles.vizToolbar}>
                        <div className={styles.toolbarLeft}>
                            <button className={`${styles.toolBtn} ${styles.toolActive}`} title="선택 모드">⊹</button>
                            <button className={styles.toolBtn} onClick={() => setZoom(z => Math.min(z + 0.2, 3))} title="확대">⊕</button>
                            <button className={styles.toolBtn} onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} title="축소">⊖</button>
                            <button className={styles.toolBtn} onClick={handleAddNew} title="재료 추가">⊞</button>
                        </div>
                        <div className={styles.toolbarRight}>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendLine} ${styles.legendSolid}`} />
                                <span>인식 성공</span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendLine} ${styles.legendDashed}`} />
                                <span>확인 필요</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.canvasContainer} ref={containerRef}>
                        <div className={styles.aiBadge}>
                            <div className={styles.aiDot} style={{ background: aiDotColor }} />
                            <span className={styles.aiLabel}>AI</span>
                            <span className={styles.aiStatus}>분석 완료</span>
                        </div>

                        {scanActive && <div className={styles.scanLine} />}

                        <canvas
                            ref={canvasRef}
                            className={styles.canvas}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
                            onClick={handleCanvasClick}
                        />

                        <div
                            className={`${styles.canvasTooltip} ${tooltip.visible ? styles.tooltipVisible : ''}`}
                            style={{ left: tooltip.x, top: tooltip.y }}
                        >
                            <div className={styles.tooltipName}>{tooltip.name}</div>
                            <div className={styles.tooltipConf}>신뢰도 <span className={styles.tooltipConfVal}>{tooltip.conf}</span></div>
                        </div>

                        <div className={styles.zoomControls}>
                            <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>+</button>
                            <button className={styles.zoomBtn} onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>−</button>
                            <button className={styles.zoomBtn} onClick={() => setZoom(1)} style={{ fontSize: 10 }}>⊙</button>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: LIST EDITOR ── */}
                <div className={styles.listEditor}>

                    <div className={styles.panelTabs}>
                        <button
                            className={`${styles.panelTab} ${activePanel === 'ingredients' ? styles.panelTabActive : ''}`}
                            onClick={() => setActivePanel('ingredients')}
                        >
                            🥕 식재료
                            <span className={styles.panelTabBadge}>{total}</span>
                        </button>
                        <button
                            className={`${styles.panelTab} ${activePanel === 'seasonings' ? styles.panelTabActive : ''}`}
                            onClick={() => setActivePanel('seasonings')}
                        >
                            🫙 양념·부재료
                            {uncheckedCount > 0 && (
                                <span className={`${styles.panelTabBadge} ${styles.panelTabBadgeWarn}`}>{uncheckedCount}</span>
                            )}
                        </button>
                    </div>

                    {/* ══ 패널 A: 인식된 식재료 ══ */}
                    {activePanel === 'ingredients' && (
                        <>
                            <div className={styles.editorHeader}>
                                <div className={styles.editorTitleRow}>
                                    <span className={styles.editorTitle}>🥕 인식된 식재료</span>
                                    <span className={styles.totalCount}>({total}개)</span>
                                    <div className={styles.headerActions}>
                                        <button className={styles.btnGhost} onClick={handleReanalyze}>🔄 재분석</button>
                                        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>분석 완료 →</button>
                                    </div>
                                </div>
                                <div className={styles.statChips}>
                                    <div className={`${styles.statChip} ${styles.chipGreen}`}>
                                        <div className={styles.chipDot} />
                                        성공 <strong>{okList.length}</strong>개
                                    </div>
                                    <div className={`${styles.statChip} ${styles.chipOrange}`}>
                                        <div className={styles.chipDot} />
                                        확인 필요 <strong>{warnList.length}</strong>개
                                    </div>
                                </div>
                                <div className={styles.searchWrap}>
                                    <span className={styles.searchIcon}>🔍</span>
                                    <input
                                        type="text"
                                        placeholder="식재료 검색..."
                                        value={searchText}
                                        onChange={e => setSearchText(e.target.value)}
                                        className={styles.searchInput}
                                    />
                                </div>
                            </div>

                            <div className={styles.ingList}>
                                {filteredOk.length > 0 && (
                                    <>
                                        <div className={styles.sectionLabel}>✓ 인식 성공 ({filteredOk.length})</div>
                                        {filteredOk.map(ing => (
                                            <IngCard
                                                key={ing.id} ing={ing}
                                                isFocused={focusedId === ing.id} isWarn={false}
                                                onFocus={() => toggleFocus(ing.id)}
                                                onEditOpen={() => openEditModal(ing)}
                                                onQty={d => handleQty(ing.id, d)}
                                                onQtyDirect={v => handleQtyDirect(ing.id, v)}
                                                onDelete={() => handleDelete(ing.id)}
                                            />
                                        ))}
                                    </>
                                )}
                                {filteredWarn.length > 0 && (
                                    <>
                                        <div className={styles.sectionLabel}>⚠ 확인 필요 ({filteredWarn.length})</div>
                                        {filteredWarn.map(ing => (
                                            <IngCard
                                                key={ing.id} ing={ing}
                                                isFocused={focusedId === ing.id} isWarn={true}
                                                onFocus={() => toggleFocus(ing.id)}
                                                onEditOpen={() => openEditModal(ing)}
                                                onQty={d => handleQty(ing.id, d)}
                                                onQtyDirect={v => handleQtyDirect(ing.id, v)}
                                                onDelete={() => handleDelete(ing.id)}
                                            />
                                        ))}
                                    </>
                                )}
                                <button className={styles.addIngBtn} onClick={handleAddNew}>
                                    ＋ 식재료 직접 추가
                                </button>
                            </div>

                            <div className={styles.editorFooter}>
                                <div className={styles.footerInfo}>
                                    <span className={styles.footerLabel}>인식 정확도</span>
                                    <span className={styles.footerVal}>{pct}% ({okList.length}/{total} 항목)</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                                </div>
                                <div className={styles.footerBtns}>
                                    <button className={styles.btnGhost} onClick={handleReset}>초기화</button>
                                    <button className={styles.btnComplete} onClick={() => setShowModal(true)} disabled={isSubmitting}>
                                        {isSubmitting
                                            ? <><span className={styles.spinner} />처리 중...</>
                                            : '✓ 분석 완료 — 요리 추천 받기'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ══ 패널 B: 필수 양념·부재료 ══ */}
                    {activePanel === 'seasonings' && (
                        <>
                            <div className={styles.editorHeader}>
                                <div className={styles.editorTitleRow}>
                                    <span className={styles.editorTitle}>🫙 필수 양념·부재료</span>
                                    <span className={styles.totalCount}>({DEFAULT_SEASONINGS.length}개)</span>
                                </div>
                                <div className={styles.statChips}>
                                    <div className={`${styles.statChip} ${styles.chipGreen}`}>
                                        <div className={styles.chipDot} />
                                        있음 <strong>{checkedCount}</strong>개
                                    </div>
                                    <div className={`${styles.statChip} ${styles.chipOrange}`}>
                                        <div className={styles.chipDot} />
                                        없음 <strong>{uncheckedCount}</strong>개
                                    </div>
                                </div>
                                <p className={styles.seasoningDesc}>
                                    요리에 필요한 기본 양념이 있는지 확인하세요.<br />
                                    없는 항목은 쇼핑 가이드에 자동으로 추가됩니다.
                                </p>
                            </div>

                            <div className={styles.ingList}>
                                <div className={styles.sectionLabel}>기본 양념 체크리스트</div>

                                {DEFAULT_SEASONINGS.map(s => {
                                    const checked = seasoningChecks[s.id]
                                    return (
                                        <div
                                            key={s.id}
                                            className={`${styles.seasoningCard} ${checked ? styles.seasoningCardChecked : styles.seasoningCardUnchecked}`}
                                            onClick={() => toggleSeasoning(s.id)}
                                        >
                                            <div className={styles.seasoningCheckbox}>
                                                {checked
                                                    ? <span className={styles.checkboxOn}>✓</span>
                                                    : <span className={styles.checkboxOff} />}
                                            </div>
                                            <div className={styles.seasoningEmoji}>{s.emoji}</div>
                                            <div className={styles.seasoningInfo}>
                                                <div className={`${styles.seasoningName} ${checked ? styles.seasoningNameChecked : styles.seasoningNameUnchecked}`}>
                                                    {s.name}
                                                </div>
                                                <div className={styles.seasoningSubDesc}>{s.desc}</div>
                                            </div>
                                            <div className={`${styles.seasoningBadge} ${checked ? styles.seasoningBadgeHave : styles.seasoningBadgeLack}`}>
                                                {checked ? '있음' : '없음'}
                                            </div>
                                        </div>
                                    )
                                })}

                                <div className={styles.seasoningBulkRow}>
                                    <button
                                        className={styles.btnGhost}
                                        onClick={() => setSeasoningChecks(Object.fromEntries(DEFAULT_SEASONINGS.map(s => [s.id, true])))}
                                    >
                                        전부 있음
                                    </button>
                                    <button
                                        className={styles.btnGhost}
                                        onClick={() => setSeasoningChecks(Object.fromEntries(DEFAULT_SEASONINGS.map(s => [s.id, false])))}
                                    >
                                        전부 없음
                                    </button>
                                </div>
                            </div>

                            <div className={styles.editorFooter}>
                                <div className={styles.footerInfo}>
                                    <span className={styles.footerLabel}>보유 양념</span>
                                    <span className={styles.footerVal}>{checkedCount} / {DEFAULT_SEASONINGS.length}개</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${Math.round(checkedCount / DEFAULT_SEASONINGS.length * 100)}%` }}
                                    />
                                </div>
                                <div className={styles.footerBtns}>
                                    <button className={styles.btnComplete} onClick={() => setShowModal(true)} disabled={isSubmitting}>
                                        {isSubmitting
                                            ? <><span className={styles.spinner} />처리 중...</>
                                            : '✓ 분석 완료 — 요리 추천 받기'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── 알림 토스트 ── */}
            <div className={`${styles.notification} ${notif.visible ? styles.notifShow : ''}`}>
                <span>{notif.icon}</span>
                <span>{notif.text}</span>
            </div>

            {/* ── 완료 모달 ── */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className={styles.modal}>
                        <div className={styles.modalTitle}>🎉 분석 완료!</div>
                        <div className={styles.modalDesc}>
                            총 <strong style={{ color: '#2ECC71' }}>{total}</strong>가지 식재료로<br />
                            요리 추천을 받아보시겠어요?<br /><br />
                            <span className={styles.modalNote}>
                                확인 필요 항목이 <strong style={{ color: '#F39C12' }}>{warnList.length}</strong>개 있습니다. 진행하시겠습니까?
                            </span>
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.btnGhost} onClick={() => setShowModal(false)}>취소</button>
                            <button className={styles.btnPrimary} onClick={handleConfirm}>요리 추천 보기 →</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 이름 편집 모달 ── */}
            {editModal.open && (
                <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && handleEditCancel()}>
                    <div className={styles.modal}>
                        <div className={styles.modalTitle}>✏️ 식재료 이름 수정</div>
                        <div className={styles.modalDesc} style={{ marginBottom: 14 }}>
                            인식된 이름을 올바르게 수정해주세요.
                        </div>
                        <input
                            autoFocus
                            className={styles.editModalInput}
                            value={editModal.value}
                            onChange={e => setEditModal(m => ({ ...m, value: e.target.value }))}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleEditSave()
                                if (e.key === 'Escape') handleEditCancel()
                            }}
                            placeholder="식재료 이름 입력"
                        />
                        <div className={styles.modalActions} style={{ marginTop: 18 }}>
                            <button className={styles.btnGhost} onClick={handleEditCancel}>취소</button>
                            <button className={styles.btnPrimary} onClick={handleEditSave}>저장</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── IngCard 서브 컴포넌트 ──────────────────────────────────────────────
function IngCard({ ing, isFocused, isWarn, onFocus, onEditOpen, onQty, onQtyDirect, onDelete }) {
    return (
        <div
            id={`ing-${ing.id}`}
            className={`${styles.ingCard} ${isWarn ? styles.ingCardWarn : ''} ${isFocused ? (isWarn ? styles.ingCardFocusedWarn : styles.ingCardFocused) : ''}`}
            onClick={e => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return; onFocus() }}
        >
            <div className={styles.ingEmoji}>{getEmoji(ing.name)}</div>
            <div className={styles.ingInfo}>
                <div
                    className={`${styles.ingNameDisplay} ${isWarn ? styles.ingNameWarn : ''}`}
                    onClick={e => { e.stopPropagation(); onFocus(); onEditOpen() }}
                    title="클릭하여 이름 수정"
                >
                    {ing.name}
                    <span className={styles.ingNameEditHint}>✏️</span>
                </div>
                <div className={styles.ingMeta}>
                    {isWarn ? '⚠ 수동 확인 권장' : '✓ 인식 완료'}
                </div>
            </div>
            <div className={styles.qtyControl}>
                <button className={styles.qtyBtn} onClick={e => { e.stopPropagation(); onQty(-1) }}>−</button>
                <input
                    className={styles.qtyValue}
                    value={ing.quantity ?? 1}
                    onChange={e => onQtyDirect(e.target.value)}
                    onClick={e => e.stopPropagation()}
                />
                <button className={styles.qtyBtn} onClick={e => { e.stopPropagation(); onQty(1) }}>+</button>
            </div>
            <span className={styles.unitText}>{ing.unit ?? '개'}</span>
            <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); onDelete() }}>✕</button>
        </div>
    )
}