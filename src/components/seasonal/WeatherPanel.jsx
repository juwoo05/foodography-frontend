import React, { useEffect, useState } from 'react'
import { animate, motion, useReducedMotion } from 'framer-motion'
import {
  SunIcon, CloudIcon, RainIcon, SnowIcon,
  ThermometerIcon, DropletIcon, WindIcon, PinIcon, FridgeIcon,
} from './SeasonalIcons'
import styles from './WeatherPanel.module.css'

// 기상청 PTY(강수형태) + 습도 → 화면에 표시할 날씨 상태
// 초단기실황에는 하늘상태(SKY)가 없으므로 강수 없음 + 고습도는 흐림으로 간주
function getCondition({ pty, humidity }) {
  if ([1, 2, 5].includes(pty)) return { key: 'rain',  label: '비',   Icon: RainIcon }
  if ([3, 6, 7].includes(pty)) return { key: 'snow',  label: '눈',   Icon: SnowIcon }
  if (humidity >= 85)          return { key: 'cloud', label: '흐림', Icon: CloudIcon }
  return { key: 'sun', label: '맑음', Icon: SunIcon }
}

// 기온·습도 기준 오늘의 식재료 보관 팁
function getStorageTips({ temperature, humidity }) {
  const tips = []
  if (temperature >= 25) tips.push('기온이 높아요. 실온에 두던 과일·빵도 냉장 보관하세요.')
  else if (temperature <= 5) tips.push('추운 날엔 감자·고구마가 냉해를 입지 않게 실내 서늘한 곳에 두세요.')
  else tips.push('뿌리채소는 신문지에 싸서 서늘한 실온에 두기 좋은 날씨예요.')

  if (humidity >= 70) tips.push('습도가 높아요. 잎채소는 키친타월로 감싸 밀폐 용기에 냉장하세요.')
  else if (humidity <= 35) tips.push('건조해요. 과일·채소는 랩이나 비닐로 감싸 수분 증발을 막으세요.')
  else tips.push('곡류·견과류는 밀폐 용기에 담아 두면 눅눅해지지 않아요.')
  return tips
}

// 숫자 카운트업
function useCountUp(target, duration = 1.2) {
  const [value, setValue] = useState(0)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (target == null) return
    const controls = animate(0, target, {
      duration: reduce ? 0 : duration,
      ease: 'easeOut',
      onUpdate: v => setValue(v),
    })
    return () => controls.stop()
  }, [target, duration, reduce])
  return value
}

const GAUGE_R = 42
const GAUGE_C = 2 * Math.PI * GAUGE_R

export default function WeatherPanel({ weather, loading, error }) {
  const temp     = useCountUp(weather?.temperature)
  const humidity = useCountUp(weather?.humidity)

  if (loading) {
    return (
      <section className={styles.panel} aria-busy="true">
        <div className={`skeleton ${styles.skelIcon}`} />
        <div className={`skeleton ${styles.skelLine}`} />
        <div className={`skeleton ${styles.skelGauge}`} />
        <div className={`skeleton ${styles.skelBlock}`} />
      </section>
    )
  }

  if (error || !weather) {
    return (
      <section className={styles.panel}>
        <p className={styles.error}>날씨 정보를 불러오지 못했어요.</p>
      </section>
    )
  }

  const cond = getCondition(weather)
  const tips = getStorageTips(weather)
  const time = weather.baseDateTime?.slice(11, 16)

  return (
    <motion.section
      className={styles.panel}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header className={styles.header}>
        <span className={styles.location}>
          <PinIcon size={15} /> {weather.locationName}
        </span>
        {time && <span className={styles.time}>{time} 기준</span>}
      </header>

      {/* 날씨 아이콘 + 기온 */}
      <div className={styles.main}>
        <div className={`${styles.condIcon} ${styles[cond.key]}`}>
          <cond.Icon size={88} strokeWidth={1.4} />
        </div>
        <div className={styles.tempWrap}>
          <span className={styles.temp}>{temp.toFixed(1)}<small>℃</small></span>
          <span className={styles.condLabel}>{cond.label}</span>
        </div>
      </div>

      {/* 습도 게이지 */}
      <div className={styles.gaugeRow}>
        <div className={styles.gauge}>
          <svg viewBox="0 0 100 100" width="112" height="112">
            <circle cx="50" cy="50" r={GAUGE_R} className={styles.gaugeTrack} />
            <motion.circle
              cx="50" cy="50" r={GAUGE_R}
              className={styles.gaugeBar}
              strokeDasharray={GAUGE_C}
              initial={{ strokeDashoffset: GAUGE_C }}
              animate={{ strokeDashoffset: GAUGE_C * (1 - weather.humidity / 100) }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className={styles.gaugeText}>
            <DropletIcon size={16} />
            <strong>{Math.round(humidity)}%</strong>
            <span>습도</span>
          </div>
        </div>

        <ul className={styles.stats}>
          <li>
            <ThermometerIcon size={18} />
            <span>기온</span>
            <strong>{weather.temperature}℃</strong>
          </li>
          <li>
            <RainIcon size={18} />
            <span>강수량</span>
            <strong>{weather.rn1} mm</strong>
          </li>
          <li>
            <WindIcon size={18} />
            <span>풍속</span>
            <strong>{weather.windSpeed} m/s</strong>
          </li>
        </ul>
      </div>

      {/* 오늘의 보관 팁 */}
      <div className={styles.tips}>
        <h3 className={styles.tipsTitle}>
          <FridgeIcon size={18} /> 오늘의 보관 팁
        </h3>
        <ul>
          {tips.map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
            >
              {t}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.section>
  )
}
