import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { MOCK_RECIPES } from '../utils/api'
import styles from './AnalyzePage.module.css'

const USE_MOCK = true

// ── 이모지 매핑 ────────────────────────────────────────────────────────
const EMOJI_MAP = {
    '계란': '🍳', '달걀': '🍳', '우유': '🥛', '당근': '🥕', '두부': '🫙',
    '대파': '🌿', '양파': '🧅', '마늘': '🧄', '감자': '🥔', '토마토': '🍅',
    '브로콜리': '🥦', '치즈': '🧀', '버터': '🧈', '돼지고기': '🥩',
    '소고기': '🥩', '닭고기': '🍗', '새우': '🍤', '고추': '🌶️',
}
const getEmoji = (name) => {
    for (const [k, v] of Object.entries(EMOJI_MAP)) {
        if (name?.includes(k)) return v
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
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

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
        if (!ing.bbox) return
        const { rx, ry, rw, rh } = ing.bbox
        const x = rx * W, y = ry * H, w = rw * W, h = rh * H
        ctx.fillStyle = BG_COLORS[idx % BG_COLORS.length] + '88'
        ctx.beginPath(); roundRect(ctx, x, y, w, h, 6); ctx.fill()
        ctx.font = `${Math.min(w, h) * 0.55}px serif`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(getEmoji(ing.name), x + w / 2, y + h / 2)
    })
}

function drawBBoxes(ctx, W, H, ingredients, focusedId) {
    ingredients.forEach((ing, i) => {
        if (!ing.bbox) return
        const { rx, ry, rw, rh } = ing.bbox
        const x = rx * W, y = ry * H, w = rw * W, h = rh * H
        const isFocused = focusedId === ing.id
        const isOk = (ing.confidence ?? 1) >= 0.75

        if (isFocused) {
            ctx.shadowBlur = 16
            ctx.shadowColor = isOk ? 'rgba(46,204,113,0.6)' : 'rgba(243,156,18,0.6)'
        }
        ctx.lineWidth = isFocused ? 2.5 : 1.5
        if (isOk) {
            ctx.strokeStyle = isFocused ? '#2ECC71' : 'rgba(46,204,113,0.85)'
            ctx.setLineDash([])
        } else {
            ctx.strokeStyle = isFocused ? '#F39C12' : 'rgba(243,156,18,0.85)'
            ctx.setLineDash([5, 4])
        }
        ctx.beginPath(); roundRect(ctx, x, y, w, h, 5); ctx.stroke()
        ctx.shadowBlur = 0; ctx.setLineDash([])

        ctx.fillStyle = isOk
            ? (isFocused ? 'rgba(46,204,113,0.12)' : 'rgba(46,204,113,0.05)')
            : (isFocused ? 'rgba(243,156,18,0.14)' : 'rgba(243,156,18,0.06)')
        ctx.beginPath(); roundRect(ctx, x, y, w, h, 5); ctx.fill()

        const labelH = 18
        ctx.font = `bold 10px "Noto Sans KR", sans-serif`
        const labelText = `${ing.name}  ${Math.round((ing.confidence ?? 1) * 100)}%`
        const labelW = Math.min(ctx.measureText(labelText).width + 10, w + 10)
        const labelY = y - labelH < 2 ? y + 1 : y - labelH
        ctx.fillStyle = isOk ? '#2ECC71' : '#F39C12'
        ctx.beginPath(); roundRect(ctx, x, labelY, labelW, labelH, 3); ctx.fill()
        ctx.fillStyle = '#0D1117'
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
        ctx.fillText(labelText, x + 5, labelY + labelH / 2)

        ctx.fillStyle = isOk ? '#2ECC71' : '#F39C12'
        ctx.beginPath(); ctx.arc(x + w - 10, y + 10, 9, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#0D1117'
        ctx.font = `bold 9px "Space Mono", monospace`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(i + 1, x + w - 10, y + 10)
    })
}

// ─────────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
    const navigate = useNavigate()
    const uploadedImage    = useAppStore(s => s.uploadedImage)
    const ingredients      = useAppStore(s => s.correctedIngredients)
    const updateIngredient = useAppStore(s => s.updateIngredient)
    const removeIngredient = useAppStore(s => s.removeIngredient)
    const addIngredient    = useAppStore(s => s.addIngredient)
    const setRecipes       = useAppStore(s => s.setRecipes)
    const resetStore       = useAppStore(s => s.reset)

    const [activePanel,  setActivePanel]  = useState('ingredients') // 'ingredients' | 'seasonings'
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

    // 양념 체크 상태 (default: 전부 체크)
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
            const img = imgRef.current
            const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight)
            const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale
            const ox = (W - dw) / 2, oy = (H - dh) / 2
            ctx.drawImage(img, ox, oy, dw, dh)
            ctx.fillStyle = 'rgba(13,17,23,0.2)'
            ctx.fillRect(0, 0, W, H)

            const mapped = ingredients.map(ing => {
                if (!ing.bbox) return ing
                const { rx, ry, rw, rh } = ing.bbox
                return { ...ing, bbox: {
                        rx: ox / W + rx * (dw / W),
                        ry: oy / H + ry * (dh / H),
                        rw: rw * (dw / W),
                        rh: rh * (dh / H),
                    }}
            })
            drawBBoxes(ctx, W, H, mapped, focusedId)
        } else {
            drawFridgeBg(ctx, W, H, ingredients)
            drawBBoxes(ctx, W, H, ingredients, focusedId)
        }
        ctx.restore()
    }, [ingredients, focusedId, zoom, uploadedImage])

    useEffect(() => { renderCanvas() }, [renderCanvas])

    useEffect(() => {
        const ro = new ResizeObserver(() => renderCanvas())
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [renderCanvas])

    const getHit = useCallback((clientX, clientY) => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        const mx = clientX - rect.left, my = clientY - rect.top
        const cx = (mx - canvas.width / 2) / zoom + canvas.width / 2
        const cy = (my - canvas.height / 2) / zoom + canvas.height / 2
        const W = canvas.width, H = canvas.height

        let hit = null
        const list = getMappedList(W, H)
        list.forEach(ing => {
            if (!ing.bbox) return
            const { rx, ry, rw, rh } = ing.bbox
            const x = rx * W, y = ry * H, w = rw * W, h = rh * H
            if (cx >= x && cx <= x + w && cy >= y && cy <= y + h) hit = ing
        })
        return hit
    }, [zoom, ingredients, uploadedImage])

    const getMappedList = (W, H) => {
        if (!imgRef.current) return ingredients
        const img = imgRef.current
        const scale = Math.min(W / img.naturalWidth, H / img.naturalHeight)
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale
        const ox = (W - dw) / 2, oy = (H - dh) / 2
        return ingredients.map(ing => {
            if (!ing.bbox) return ing
            const { rx, ry, rw, rh } = ing.bbox
            return { ...ing, bbox: { rx: ox/W + rx*(dw/W), ry: oy/H + ry*(dh/H), rw: rw*(dw/W), rh: rh*(dh/H) } }
        })
    }

    const handleMouseMove = (e) => {
        const hit  = getHit(e.clientX, e.clientY)
        const rect = canvasRef.current?.getBoundingClientRect()
        if (hit && rect) {
            setTooltip({ visible: true,
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

    const handleAddNew = () => {
        const newId = Date.now()
        addIngredient({ id: newId, name: '새 재료', quantity: 1, unit: '개', confidence: 1.0,
            bbox: { rx: 0.4, ry: 0.35, rw: 0.14, rh: 0.18 } })
        setFocusedId(newId)
        setTimeout(() => {
            const el = document.querySelector(`[data-nameid="${newId}"]`)
            if (el) { el.focus(); el.select() }
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
            const recipes = USE_MOCK
                ? await new Promise(r => setTimeout(() => r(MOCK_RECIPES), 1200))
                : await (await import('../utils/api')).fetchRecipes(ingredients)
            setRecipes(recipes); navigate('/recipes')
        } catch (e) {
            showNotif('⚠', '레시피 로딩 실패: ' + e.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // ── 양념 체크 토글 ─────────────────────────────────────────────────
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

    // ── 통계 ───────────────────────────────────────────────────────────
    const okList   = ingredients.filter(i => (i.confidence ?? 1) >= 0.75)
    const warnList = ingredients.filter(i => (i.confidence ?? 1) < 0.75)
    const total    = ingredients.length
    const pct      = total ? Math.round(okList.length / total * 100) : 0
    const filtered = ingredients.filter(i => i.name?.includes(searchText))
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
                            <button className={styles.toolBtn} onClick={handleAddNew} title="박스 추가">⊞</button>
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

                    {/* ── 패널 탭 전환 ── */}
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

                                {/* 전체 토글 버튼 */}
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
                    신뢰도 {Math.round((ing.confidence ?? 1) * 100)}% · {isWarn ? '수동 확인 권장' : '자동 인식'}
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
            <span className={styles.unitText}>{ing.unit}</span>
            <button className={styles.deleteBtn} onClick={e => { e.stopPropagation(); onDelete() }}>✕</button>
        </div>
    )
}