import React, { useEffect, useRef, useState } from 'react'
import WeatherPanel from '../components/seasonal/WeatherPanel'
import FoodCardStack from '../components/seasonal/FoodCardStack'
import { LeafIcon } from '../components/seasonal/SeasonalIcons'
import { fetchCurrentWeather, fetchSeasonalFoods } from '../utils/api'
import styles from './SeasonalPage.module.css'

// 위치 권한 거부·실패 시 기본 위치 (서울 종로구)
const DEFAULT_POS = { lat: 37.5729, lon: 126.9794, isDefault: true }
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 브라우저 위치 → 실패하면 기본 위치
function getPosition() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve(DEFAULT_POS)
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, isDefault: false }),
      () => resolve(DEFAULT_POS),
      { timeout: 5000, maximumAge: 10 * 60 * 1000 },
    )
  })
}

export default function SeasonalPage() {
  const now = new Date()
  const year = now.getFullYear()

  // ── 날씨 ──
  const [weather, setWeather]               = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(true)
  const [weatherError, setWeatherError]     = useState(false)

  // ── 제철 식재료 ──
  const [month, setMonth]               = useState(now.getMonth() + 1)
  const [foods, setFoods]               = useState([])
  const [foodsLoading, setFoodsLoading] = useState(true)
  const monthReq = useRef(0)   // 월을 빠르게 바꿀 때 늦게 온 이전 응답 무시

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { lat, lon, isDefault } = await getPosition()
        const data = await fetchCurrentWeather(lat, lon)
        // 기상청은 주소를 주지 않음 → 위치 권한 여부로 표시 문구 결정
        if (alive) setWeather({ ...data, locationName: data.locationName ?? (isDefault ? '서울' : '내 위치') })
      } catch (err) {
        console.error('[SeasonalPage] 날씨 조회 실패', err)
        if (alive) setWeatherError(true)
      } finally {
        if (alive) setWeatherLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const req = ++monthReq.current
    setFoodsLoading(true)
    fetchSeasonalFoods(year, month)
      .then(data => { if (req === monthReq.current) setFoods(data) })
      .catch(err => {
        console.error('[SeasonalPage] 제철 식재료 조회 실패', err)
        if (req === monthReq.current) setFoods([])
      })
      .finally(() => { if (req === monthReq.current) setFoodsLoading(false) })
  }, [year, month])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <LeafIcon size={30} /> 제철 식재료 보기
        </h1>
        <p className={styles.subTitle}>
          오늘 날씨에 맞는 보관 팁과 {month}월 제철 식재료를 카드로 넘겨 보세요.
        </p>
      </header>

      <div className={styles.grid}>
        <aside className={styles.left}>
          <h2 className={styles.panelTitle}>오늘의 날씨</h2>
          <WeatherPanel weather={weather} loading={weatherLoading} error={weatherError} />
        </aside>

        <section className={styles.right}>
          <div className={styles.rightHead}>
            <h2 className={styles.panelTitle}>이달의 음식</h2>
            <div className={styles.months} role="tablist" aria-label="월 선택">
              {MONTHS.map(m => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={m === month}
                  className={`${styles.monthChip} ${m === month ? styles.monthActive : ''}`}
                  onClick={() => setMonth(m)}
                >
                  {m}월
                </button>
              ))}
            </div>
          </div>

          {/* key={month} — 월이 바뀌면 카드 위치·뒤집기 상태 초기화 */}
          <FoodCardStack key={month} foods={foods} month={month} loading={foodsLoading} />
        </section>
      </div>
    </div>
  )
}
