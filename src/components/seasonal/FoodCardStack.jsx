import React, { useRef, useState } from 'react'
import {
  AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform,
} from 'framer-motion'
import {
  FruitIcon, VegetableIcon, SeafoodIcon, GrainIcon, MushroomIcon, BowlIcon,
  CartIcon, FridgeIcon, KnifeIcon, HeartIcon, FlipIcon, ChevronIcon, LeafIcon,
} from './SeasonalIcons'
import styles from './FoodCardStack.module.css'

const SWIPE_OFFSET   = 120   // 이 거리 이상 드래그하면 넘김
const SWIPE_VELOCITY = 500   // 또는 이 속도 이상으로 던지면 넘김
const STACK_DEPTH    = 2     // 맨 위 카드 뒤에 겹쳐 보일 카드 수

// 뒤 카드 위치 — 맨 위 카드가 넘어가면 다음 카드가 이 위치에서 올라옴
const stackPos = (depth) => ({ scale: 1 - depth * 0.05, y: depth * 16 })

// 분류 → 아이콘·라벨 매핑
const CATEGORY_META = {
  fruit:     { Icon: FruitIcon,     label: '과일' },
  vegetable: { Icon: VegetableIcon, label: '채소' },
  seafood:   { Icon: SeafoodIcon,   label: '수산물' },
  grain:     { Icon: GrainIcon,     label: '곡류·견과' },
  mushroom:  { Icon: MushroomIcon,  label: '버섯' },
  processed: { Icon: BowlIcon,      label: '축산·가공' },
}

const DETAIL_SECTIONS = [
  { key: 'buyTip',    label: '구입요령',  Icon: CartIcon },
  { key: 'storage',   label: '보관법',    Icon: FridgeIcon },
  { key: 'prep',      label: '손질법',    Icon: KnifeIcon },
  { key: 'nutrition', label: '영양·효능', Icon: HeartIcon },
]

// dir: 1 = 다음(왼쪽으로 날아감), -1 = 이전(오른쪽으로 날아감)
const topVariants = {
  enter: ({ reduce }) => (reduce ? { opacity: 0 } : { ...stackPos(1), opacity: 1 }),
  center: { x: 0, scale: 1, y: 0, opacity: 1, rotate: 0 },
  exit: ({ dir, reduce }) => (reduce
    ? { opacity: 0, transition: { duration: 0.2 } }
    : { x: dir > 0 ? -520 : 520, rotate: dir > 0 ? -18 : 18, opacity: 0, transition: { duration: 0.35 } }),
}

function CardFaces({ food, month }) {
  const meta = CATEGORY_META[food.category] ?? CATEGORY_META.vegetable
  return (
    <>
      {/* 앞면 */}
      <div className={`${styles.face} ${styles.front} ${styles[`cat_${food.category}`] ?? ''}`}>
        <span className={styles.badge}>
          <LeafIcon size={13} /> {month}월 제철
        </span>
        <div className={styles.illust}>
          {food.imageUrl
            ? <img src={food.imageUrl} alt={food.name} className={styles.photo} draggable={false} />
            : <meta.Icon size={96} strokeWidth={1.3} />}
        </div>
        <span className={styles.category}>{meta.label}</span>
        <h3 className={styles.name}>{food.name}</h3>
        <p className={styles.intro}>{food.intro}</p>
        <span className={styles.flipHint}>
          <FlipIcon size={14} /> 눌러서 보관법 보기
        </span>
      </div>

      {/* 뒷면 */}
      <div className={`${styles.face} ${styles.back}`}>
        <h3 className={styles.backTitle}>
          <meta.Icon size={22} /> {food.name}
        </h3>
        <div className={styles.sections}>
          {DETAIL_SECTIONS.map(({ key, label, Icon }) => food[key] && (
            <section key={key} className={`${styles.section} ${key === 'storage' ? styles.sectionHighlight : ''}`}>
              <h4><Icon size={16} /> {label}</h4>
              <p>{food[key]}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

// 맨 위 카드 — 마운트마다 새 motion value 를 가지도록 별도 컴포넌트
function TopCard({ food, month, flipped, onFlip, onSwipe, reduce, dir }) {
  const x       = useMotionValue(0)
  const rotate  = useTransform(x, [-240, 240], reduce ? [0, 0] : [-14, 14])
  const opacity = useTransform(x, [-320, -160, 0, 160, 320], [0.3, 1, 1, 1, 0.3])
  const dragged = useRef(false)

  return (
    <motion.div
      className={styles.card}
      style={{ x, rotate, opacity, zIndex: STACK_DEPTH + 1 }}
      custom={{ dir, reduce }}
      variants={topVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      drag="x"
      dragSnapToOrigin
      dragElastic={0.9}
      onPointerDown={() => { dragged.current = false }}
      onDragStart={() => { dragged.current = true }}
      onDragEnd={(_, { offset, velocity }) => {
        if (offset.x < -SWIPE_OFFSET || velocity.x < -SWIPE_VELOCITY) onSwipe(1)
        else if (offset.x > SWIPE_OFFSET || velocity.x > SWIPE_VELOCITY) onSwipe(-1)
      }}
      onClick={() => {
        // 드래그 직후 발생하는 click 은 뒤집기로 처리하지 않음
        if (!dragged.current) onFlip()
      }}
      whileTap={{ cursor: 'grabbing' }}
    >
      <motion.div
        className={styles.inner}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
      >
        <CardFaces food={food} month={month} />
      </motion.div>
    </motion.div>
  )
}

export default function FoodCardStack({ foods, month, loading }) {
  const reduce = useReducedMotion()
  const [index, setIndex]     = useState(0)
  const [dir, setDir]         = useState(1)
  const [turn, setTurn]       = useState(0)   // 넘길 때마다 증가 — 같은 카드로 돌아와도 새로 마운트
  const [flipped, setFlipped] = useState(false)

  if (loading) {
    return <div className={`skeleton ${styles.skeleton}`} />
  }

  if (!foods.length) {
    return (
      <div className={styles.empty}>
        <LeafIcon size={40} />
        <p>{month}월 제철 식재료 정보가 아직 없어요.</p>
      </div>
    )
  }

  const total = foods.length
  const food  = foods[index]

  const paginate = (d) => {
    setDir(d)
    setIndex(i => (i + d + total) % total)   // 끝에서 처음으로 순환
    setTurn(t => t + 1)
    setFlipped(false)
  }

  const goTo = (i) => {
    if (i === index) return
    setDir(i > index ? 1 : -1)
    setIndex(i)
    setTurn(t => t + 1)
    setFlipped(false)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); paginate(1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); paginate(-1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
  }

  // 뒤에 겹쳐 보일 카드 (총 개수보다 많이 보여주지 않음)
  const behind = Array.from({ length: Math.min(STACK_DEPTH, total - 1) }, (_, k) => {
    const depth = k + 1
    return { depth, food: foods[(index + depth) % total] }
  })

  return (
    <div className={styles.wrap}>
      <div
        className={styles.stage}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${month}월 제철 식재료 카드. 좌우 화살표로 넘기고 Enter로 뒤집기`}
        onKeyDown={onKeyDown}
      >
        {/* 뒤 카드들 — 앞면만, 상호작용 없음 */}
        {behind.slice().reverse().map(({ depth, food: f }) => (
          <motion.div
            key={`${f.cntntsNo}-behind`}
            className={`${styles.card} ${styles.cardBehind}`}
            style={{ zIndex: STACK_DEPTH + 1 - depth }}
            initial={{ ...stackPos(depth + 1), opacity: 0 }}
            animate={{ ...stackPos(depth), opacity: 1 - depth * 0.25 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            aria-hidden="true"
          >
            <div className={styles.inner}>
              <CardFaces food={f} month={month} />
            </div>
          </motion.div>
        ))}

        <AnimatePresence initial={false} custom={{ dir, reduce }}>
          <TopCard
            key={turn}
            food={food}
            month={month}
            flipped={flipped}
            onFlip={() => setFlipped(f => !f)}
            onSwipe={paginate}
            reduce={reduce}
            dir={dir}
          />
        </AnimatePresence>
      </div>

      {/* 하단 컨트롤 */}
      <div className={styles.controls}>
        <button className={styles.navBtn} onClick={() => paginate(-1)} aria-label="이전 식재료">
          <ChevronIcon dir="left" size={20} />
        </button>

        <div className={styles.dots}>
          {foods.map((f, i) => (
            <button
              key={f.cntntsNo}
              className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
              onClick={() => goTo(i)}
              aria-label={`${f.name} 보기`}
              aria-current={i === index}
            />
          ))}
        </div>

        <button className={styles.navBtn} onClick={() => paginate(1)} aria-label="다음 식재료">
          <ChevronIcon dir="right" size={20} />
        </button>
      </div>
      <p className={styles.counter}>
        <strong>{index + 1}</strong> / {total}
        <span className={styles.helper}>드래그하거나 ← → 키로 넘기기</span>
      </p>
    </div>
  )
}
