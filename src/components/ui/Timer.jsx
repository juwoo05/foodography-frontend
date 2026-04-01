import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import styles from './Timer.module.css'

export default function Timer({ initialSeconds, onComplete }) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    setSeconds(initialSeconds)
    setRunning(false)
  }, [initialSeconds])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            onComplete?.()
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const reset = () => {
    clearInterval(intervalRef.current)
    setSeconds(initialSeconds)
    setRunning(false)
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  const progress = seconds / initialSeconds

  const r = 36
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - progress)

  return (
    <div className={styles.timer}>
      <svg className={styles.ring} width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
        <circle
          cx="45" cy="45" r={r}
          fill="none"
          stroke={seconds < 30 ? 'var(--red)' : 'var(--green)'}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.9s linear', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
        <text x="45" y="50" textAnchor="middle" fill="var(--text)" fontSize="14" fontFamily="Syne" fontWeight="700">
          {mm}:{ss}
        </text>
      </svg>
      <div className={styles.controls}>
        <button className={styles.ctrl} onClick={() => setRunning((r) => !r)}>
          {running ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button className={styles.ctrl} onClick={reset}>
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}
