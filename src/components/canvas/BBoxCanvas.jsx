import React, { useRef, useEffect, useState, useCallback } from 'react'
import styles from './BBoxCanvas.module.css'

/**
 * BBoxCanvas — draws bounding boxes over an image.
 *
 * Props:
 *  imageSrc       : string   — image URL or base64
 *  ingredients    : array    — [{ id, name, confidence, bbox: { x, y, w, h } }]
 *  selectedId     : number|null
 *  onSelect       : (id) => void
 */
export default function BBoxCanvas({ imageSrc, ingredients = [], selectedId, onSelect }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 })
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })

  // Load image and get natural dimensions
  useEffect(() => {
    if (!imageSrc) return
    setImgLoaded(false)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      setImgLoaded(true)
    }
    img.src = imageSrc
  }, [imageSrc])

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect
        setCanvasSize({ w: width, h: height })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const getScale = useCallback(() => {
    if (!canvasSize.w || !naturalSize.w) return { sx: 1, sy: 1, offsetX: 0, offsetY: 0 }
    const imgAspect = naturalSize.w / naturalSize.h
    const canvasAspect = canvasSize.w / canvasSize.h

    let drawW, drawH, offsetX = 0, offsetY = 0
    if (imgAspect > canvasAspect) {
      drawW = canvasSize.w
      drawH = canvasSize.w / imgAspect
      offsetY = (canvasSize.h - drawH) / 2
    } else {
      drawH = canvasSize.h
      drawW = canvasSize.h * imgAspect
      offsetX = (canvasSize.w - drawW) / 2
    }
    return { sx: drawW / naturalSize.w, sy: drawH / naturalSize.h, offsetX, offsetY }
  }, [canvasSize, naturalSize])

  // Draw
  useEffect(() => {
    if (!canvasRef.current || !imgRef.current || !imgLoaded || !canvasSize.w) return
    const ctx = canvasRef.current.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvasRef.current.width = canvasSize.w * dpr
    canvasRef.current.height = canvasSize.h * dpr
    ctx.scale(dpr, dpr)

    const { sx, sy, offsetX, offsetY } = getScale()

    // Draw image
    ctx.drawImage(
      imgRef.current,
      offsetX, offsetY,
      naturalSize.w * sx, naturalSize.h * sy,
    )

    // Dim overlay
    ctx.fillStyle = 'rgba(13, 15, 14, 0.25)'
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h)

    // Draw boxes
    ingredients.forEach((ing) => {
      if (!ing.bbox) return
      const { x, y, w, h } = ing.bbox
      const bx = offsetX + x * sx
      const by = offsetY + y * sy
      const bw = w * sx
      const bh = h * sy

      const isSelected = ing.id === selectedId
      const isLowConf = ing.confidence < 0.75
      const color = isLowConf ? '#F39C12' : '#2ECC71'

      ctx.strokeStyle = color
      ctx.lineWidth = isSelected ? 2.5 : 1.5
      ctx.globalAlpha = isSelected ? 1 : 0.75

      if (isLowConf && !isSelected) {
        ctx.setLineDash([6, 4])
      } else {
        ctx.setLineDash([])
      }

      // Glow
      ctx.shadowColor = color
      ctx.shadowBlur = isSelected ? 16 : 6
      ctx.strokeRect(bx, by, bw, bh)
      ctx.shadowBlur = 0

      // Fill highlight for selected
      if (isSelected) {
        ctx.fillStyle = `${color}22`
        ctx.fillRect(bx, by, bw, bh)
      }
      ctx.globalAlpha = 1

      // Label
      ctx.setLineDash([])
      const labelPad = 6
      const labelFontSize = 12
      ctx.font = `600 ${labelFontSize}px "Noto Sans KR", sans-serif`
      const labelText = `${ing.name} ${Math.round(ing.confidence * 100)}%`
      const labelW = ctx.measureText(labelText).width + labelPad * 2

      const labelX = bx
      const labelY = by - labelFontSize - labelPad * 2 < 0 ? by : by - labelFontSize - labelPad * 2

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(labelX, labelY, labelW, labelFontSize + labelPad * 2, 4)
      ctx.fill()

      ctx.fillStyle = '#071209'
      ctx.fillText(labelText, labelX + labelPad, labelY + labelFontSize + labelPad - 1)
    })
  }, [imgLoaded, ingredients, selectedId, canvasSize, getScale, naturalSize])

  // Click hit-test
  const handleClick = useCallback((e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const { sx, sy, offsetX, offsetY } = getScale()

    let hit = null
    for (const ing of [...ingredients].reverse()) {
      if (!ing.bbox) continue
      const { x, y, w, h } = ing.bbox
      const bx = offsetX + x * sx
      const by = offsetY + y * sy
      if (cx >= bx && cx <= bx + w * sx && cy >= by && cy <= by + h * sy) {
        hit = ing.id
        break
      }
    }
    onSelect?.(hit)
  }, [ingredients, getScale, onSelect])

  return (
    <div ref={containerRef} className={styles.container} onClick={handleClick}>
      {!imgLoaded && (
        <div className={styles.placeholder}>
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
          <span className={styles.loadingDot} />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
      />
    </div>
  )
}
