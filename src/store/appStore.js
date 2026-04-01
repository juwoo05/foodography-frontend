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

  setAnalysisResult: (result) => set({
    analysisResult: result,
    correctedIngredients: result?.ingredients?.map((ing, i) => ({ ...ing, id: i })) ?? [],
  }),

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

  // 장바구니에 단일 항목 추가 (중복 시 수량 누적)
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

  // 레시피의 missingIngredients 전체를 장바구니에 추가
  // cartMap: { [name]: quantity } — 모달에서 조절한 수량
  addMissingToCart: (missingIngredients, cartMap, recipeTitle) => set((state) => {
    let next = [...state.cartItems]
    missingIngredients.forEach((item) => {
      const qty = cartMap[item.name] ?? 1
      if (qty <= 0) return                          // 수량 0은 담지 않음
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
