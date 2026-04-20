import { create } from 'zustand'

export const useAppStore = create((set, get) => ({
  // Upload state
  uploadedImage: null,
  uploadedFile: null,

  // Analysis state
  analysisResult: null,
  isAnalyzing: false,
  analysisError: null,

  // Corrected ingredients after user edit
  correctedIngredients: [],

  // Recipe state
  recipes: [],
  selectedRecipe: null,
  isLoadingRecipes: false,

  // Shopping cart
  // item 구조: { id, name, emoji, price, unit, quantity, recipeTitle }
  cartItems: [],

  // Cooking guide
  currentStep: 0,
  timerRunning: false,
  timerSeconds: 0,

  // Actions
  setUploadedImage: (image, file) => set({ uploadedImage: image, uploadedFile: file }),

  // FastAPI 응답 구조:
  // {
  //   success, detected_count,
  //   ingredients: [{ idx, label, name, confidence, unit, stock_status, freshness, note, polygon }]
  // }
  //
  // 매핑 규칙:
  //   id          ← idx (Roboflow 감지 순번, 고정값)
  //   quantity    ← 식품명이 같은 항목 수 집계 (숫자)
  //   stockStatus ← stock_status (Gemini 재고 상태 텍스트: 많음/보통/적음)
  //   polygon     ← Roboflow 폴리곤 좌표 [{ x, y }, ...]
  setAnalysisResult: (result) => {

    const UNKNOWN = '알 수 없음'

    const getGroupKey = (ing, index) => {
      const name = ing.name ?? ing.label
      // 알 수 없음은 개별 항목이므로 idx를 suffix로 붙여 유일키 생성
      return name === UNKNOWN ? `${UNKNOWN}_${ing.idx ?? index}` : name
    }

    // 식품명 기준 수량 집계 (같은 이름이 여러 번 감지된 경우 quantity 누적)
    const nameCountMap = {}
    result?.ingredients?.forEach(ing => {
      const key = getGroupKey(ing, ing.idx)
      nameCountMap[key] = (nameCountMap[key] ?? 0) + 1
    })

    // 이미 처리한 이름 추적 (첫 등장 항목만 남기고 나머지는 수량에 반영)
    const seenNames = {}

    const mapped = result?.ingredients
      ?.filter(ing => {
        const key = getGroupKey(ing, ing.idx)
        if (seenNames[key]) return false   // 중복 항목 제거 (수량에 이미 반영됨)
        seenNames[key] = true
        return true
      })

      ?.map(ing => ({
        ...ing,
        id:          ing.idx,                              // Roboflow 순번을 id로 사용
        quantity:    nameCountMap[getGroupKey(ing, ing.idx)],  // 같은 이름 감지 횟수 = 수량
        unit:        ing.unit        ?? '개',
        stockStatus: ing.stock_status ?? '알 수 없음',     // Gemini 재고 상태 텍스트
        freshness:   ing.freshness   ?? '알 수 없음',
        note:        ing.note        ?? null,
        polygon:     ing.polygon     ?? [],                // Roboflow 폴리곤 좌표
      })) ?? []

    // ★ 로그 2: 매핑 후 polygon 존재 여부
    console.log('[Store] correctedIngredients polygon check:',
        mapped.map(m => ({ name: m.name, polygonLen: m.polygon?.length ?? 0, polygon: m.polygon }))
    )

    set({
      analysisResult: result,
      correctedIngredients: mapped,
    })
  },

  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
  setAnalysisError: (e) => set({ analysisError: e }),

  updateIngredient: (id, changes) => set((state) => ({
    correctedIngredients: state.correctedIngredients.map((ing) =>
      ing.id === id ? { ...ing, ...changes } : ing
    ),
  })),

  removeIngredient: (id) => set((state) => ({
    correctedIngredients: state.correctedIngredients.filter((ing) => ing.id !== id),
  })),

  addIngredient: (ingredient) => set((state) => ({
    correctedIngredients: [
      ...state.correctedIngredients,
      { ...ingredient, id: Date.now() },
    ],
  })),

  setRecipes: (recipes) => set({ recipes }),
  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
  setIsLoadingRecipes: (v) => set({ isLoadingRecipes: v }),

  addToCart: (item) => set((state) => {
    const exists = state.cartItems.find((c) => c.id === item.id)
    if (exists) {
      return {
        cartItems: state.cartItems.map((c) =>
          c.id === item.id
            ? { ...c, quantity: c.quantity + (item.quantity ?? 1) }
            : c
        ),
      }
    }
    return { cartItems: [...state.cartItems, { ...item, quantity: item.quantity ?? 1 }] }
  }),

  addMissingToCart: (missingIngredients, cartMap, recipeTitle) => set((state) => {
    let next = [...state.cartItems]
    missingIngredients.forEach((item) => {
      const qty = cartMap[item.name] ?? 1
      if (qty <= 0) return
      const id = `missing-${item.name}`
      const exists = next.find((c) => c.id === id)
      if (exists) {
        next = next.map((c) =>
          c.id === id ? { ...c, quantity: c.quantity + qty } : c
        )
      } else {
        next.push({
          id,
          name:        item.name,
          emoji:       item.emoji  ?? '🛒',
          price:       item.price  ?? 0,
          unit:        item.unit   ?? '개',
          quantity:    qty,
          recipeTitle: recipeTitle ?? '',
        })
      }
    })
    return { cartItems: next }
  }),

  removeFromCart: (id) => set((state) => ({
    cartItems: state.cartItems.filter((c) => c.id !== id),
  })),

  clearCart: () => set({ cartItems: [] }),

  setCurrentStep: (step) => set({ currentStep: step }),
  setTimerRunning: (v) => set({ timerRunning: v }),
  setTimerSeconds: (s) => set({ timerSeconds: s }),

  reset: () => set({
    uploadedImage: null,
    uploadedFile: null,
    analysisResult: null,
    isAnalyzing: false,
    analysisError: null,
    correctedIngredients: [],
    recipes: [],
    selectedRecipe: null,
    currentStep: 0,
  }),
}))
