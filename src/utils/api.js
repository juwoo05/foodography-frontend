import axios from 'axios'

// Base URL — set via .env: VITE_API_BASE=http://localhost:8080
const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'

// axios 인스턴스 — 회원/인증 관련 요청에만 사용
const userApi = axios.create({
  baseURL: BASE,
  withCredentials: true,  // 세션 쿠키 포함 — 필수!
})

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}

// ── 이메일 중복 확인 ─────────────────────────────
export async function checkEmailExists(email) {
  const res = await userApi.post(
      '/api/user/getEmailExists',
      new URLSearchParams({ email })
  )
  return res.data  // { existYn: 'Y' } 또는 { existYn: 'N' }
}

// ── 인증코드 발송 ─────────────────────────────────
export async function sendAuthCode(email) {
  const res = await userApi.post(
      '/api/user/sendEmailAuthCode',
      new URLSearchParams({ email })
  )
  return res.data  // { result: 1, msg: '...' }
}

// ── 인증코드 검증 ─────────────────────────────────
export async function verifyAuthCode(email, code) {
  const res = await userApi.post(
      '/api/user/verifyEmailCode',
      new URLSearchParams({ email, code })
  )
  return res.data  // { result: 1, msg: '인증 성공' }
}

// ── 회원가입 ──────────────────────────────────────
export async function registerUser(userName, email, phoneNum, password) {
  const res = await userApi.post(
      '/api/user/insertUserInfo',
      new URLSearchParams({ userName, email, phoneNum, password })
  )
  return res.data  // { result: 1, msg: '회원가입되었습니다.' }
}

// ── 로그인 ────────────────────────────────────────
export async function loginUser(email, password) {
  const res = await userApi.post(
      '/api/user/loginProc',
      new URLSearchParams({ email, password })
  )
  return res.data  // { result: 1, msg: '로그인 성공했습니다.' }
}

// ── 세션 확인 ────────────────────────────────────
export async function sessionCheck() {
  const res = await userApi.get('/api/user/sessionCheck')
  return res.data  // { email, existYn: 'Y' } 또는 { existYn: 'N' }
}

// ── 아이디(이메일) 찾기 ──────────────────────────
export async function searchUserEmail(userName, phoneNum) {
  const res = await userApi.post(
      '/api/user/searchUserEmail',
      new URLSearchParams({ userName, phoneNum })
  )
  return res.data
  // 찾으면: { email: 'xxx@xxx.com', userName: '...', phoneNum: '...' }
  // 못 찾으면: { email: null } 또는 빈 객체
}

// ── 비밀번호 재설정 ──────────────────────────────
export async function updatePassword(email, password) {
  const res = await userApi.post(
      '/api/user/updatePassword',
      new URLSearchParams({ email, password })
  )
  return res.data
}

// ── 로그아웃 ─────────────────────────────────────
export async function logoutUser() {
  const res = await userApi.post(
      '/api/user/logout',
      new URLSearchParams()
  )
  return res.data
}

// ── S3 Presigned URL 발급 요청 ──────────────────────────────
// Spring에게 "이 파일 이름으로 업로드할 URL 줘" 요청
export async function getPresignedUrl(filename) {
  const res = await userApi.get('/api/images/my-fridge-input', {
    params: { filename },   // GET ?filename=xxx.jpg
  })
  return res.data
  // 응답 예시: { uploadUrl: "https://s3.amazonaws.com/...", s3Key: "images/uuid_xxx.jpg" }
}

// ── S3에 이미지 직접 업로드 (Presigned URL 사용) ────────────
// Spring을 거치지 않고 S3에 직접 PUT 요청
export async function uploadToS3(presignedUrl, file) {
  // axios 인스턴스(userApi) 사용 X → 직접 S3에 보내므로 별도 axios 사용
  const res = await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,  // 예: 'image/jpeg'
    },
    // withCredentials: false → S3는 쿠키 불필요
  })
  return res  // 성공 시 status 200
}

// ── 냉장고 분석 (S3 업로드 완료 후 savedFilename 전달) ────────────────────
// Spring Boot → FastAPI (Presigned Download URL + s3Key) → 분석 결과 반환
export async function analyzeImage(savedFilename) {
  const res = await userApi.post(
      '/api/analyze',
      null,                          // body 없음
      { params: { filename: savedFilename } }   // GET 파라미터로 전달
  )
  console.log('[API] analyzeImage raw response:', JSON.stringify(res.data, null, 2))
  return res.data
}

// ── 사용자 수정 식재료 결과 저장 (FOOD_AFTER) ────────────────────────────
// correctedIngredients: appStore의 수정된 식재료 목록
// analysisResult:       원본 분석 결과 (scanId 포함)
export async function saveAfterResult(analysisResult, correctedIngredients) {
  const ingredients = correctedIngredients.map(ing => ({
    idx:          ing.id,
    label:        ing.label        ?? '',
    name:         ing.name         ?? '',
    confidence:   ing.confidence   ?? 1.0,
    freshness:    ing.freshness    ?? '알 수 없음',
    quantity:     String(ing.quantity ?? 1),   // Java IngredientDTO.quantity 는 String
    note:         ing.note         ?? null,
    polygon:      ing.polygon      ?? [],
    stock_status: ing.stockStatus  ?? '알 수 없음',
  }))

  const body = {
    success:        analysisResult?.success       ?? true,
    detectedCount:  analysisResult?.detectedCount ?? correctedIngredients.length,
    ingredients,
    errorMessage:   null,
    scanId:         analysisResult?.scanId        ?? null,
  }

  const res = await userApi.post('/api/analyze/reviewed', body)
  return res.data  // { result: 1, msg: '저장 완료' }
}

// ── 레시피 추천 ──────────────────────────────────────
// FOOD_AFTER 저장된 식재료(scanId 기준) → Spring → FastAPI 레시피 분석
export async function fetchRecipes(scanId) {
  const res = await userApi.post(
    '/api/analyze/recipe',
    null,
    { params: { scanId } }
  )
  return res.data  // List<RecipeDTO>
}

// ── 레시피 상세 ──────────────────────────────────────
export async function fetchRecipeDetail(id) {
  return request(`/api/recipes/${id}`)
}

// ── 가격 비교 ────────────────────────────────────────
export async function fetchPrices(ingredientNames) {
  return request('/api/prices', {
    method: 'POST',
    body: JSON.stringify({ ingredients: ingredientNames }),
  })
}

// ── Mock data for development ─────────────────────────────────────────
export const MOCK_ANALYSIS = {
  ingredients: [
    { id: 0, name: '계란',  quantity: 6, unit: '개', confidence: 0.97, bbox: { x: 60,  y: 40,  w: 140, h: 120 } },
    { id: 1, name: '당근',  quantity: 2, unit: '개', confidence: 0.91, bbox: { x: 240, y: 30,  w: 100, h: 150 } },
    { id: 2, name: '두부',  quantity: 1, unit: '모', confidence: 0.85, bbox: { x: 360, y: 80,  w: 130, h: 110 } },
    { id: 3, name: '대파',  quantity: 3, unit: '대', confidence: 0.62, bbox: { x: 50,  y: 190, w: 180, h: 80  } },
    { id: 4, name: '우유',  quantity: 1, unit: '팩', confidence: 0.94, bbox: { x: 280, y: 200, w: 110, h: 130 } },
  ],
}

export const MOCK_RECIPES = [
  {
    id: 1,
    title: '계란 두부 조림',
    thumbnail: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
    cookTime: 20,
    missingCount: 0,
    extraCost: 0,
    calories: 310,
    tags: ['간단', '저칼로리'],
    missingIngredients: [],   // 재료가 모두 있음
  },
  {
    id: 2,
    title: '당근 계란볶음밥',
    thumbnail: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80',
    cookTime: 15,
    missingCount: 1,
    extraCost: 1200,
    calories: 480,
    tags: ['든든', '한끼'],
    missingIngredients: [
      { name: '밥',   emoji: '🍚', price: 1200, unit: '공기' },
    ],
  },
  {
    id: 3,
    title: '두부 된장찌개',
    thumbnail: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80',
    cookTime: 25,
    missingCount: 2,
    extraCost: 3500,
    calories: 220,
    tags: ['국물', '건강식'],
    missingIngredients: [
      { name: '된장',  emoji: '🫙', price: 2500, unit: '통' },
      { name: '애호박', emoji: '🥬', price: 1000, unit: '개' },
    ],
  },
  {
    id: 4,
    title: '대파 계란국',
    thumbnail: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
    cookTime: 10,
    missingCount: 0,
    extraCost: 0,
    calories: 180,
    tags: ['간단', '국물'],
    missingIngredients: [],   // 재료가 모두 있음
  },
]

export const MOCK_RECIPE_DETAIL = {
  id: 1,
  title: '계란 두부 조림',
  thumbnail: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
  cookTime: 20,
  servings: 2,
  calories: 310,
  ingredients: [
    { name: '계란',   amount: '3개'  },
    { name: '두부',   amount: '1/2모' },
    { name: '간장',   amount: '2T'   },
    { name: '설탕',   amount: '1T'   },
    { name: '참기름', amount: '약간'  },
  ],
  steps: [
    {
      step: 1,
      title: '재료 준비',
      description: '두부는 2cm 두께로 썰어주세요. 계란은 미리 상온에 꺼내둡니다.',
      timerSeconds: null,
      videoUrl: null,
      stepImage: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800&q=80',
    },
    {
      step: 2,
      title: '두부 굽기',
      description: '팬에 기름을 두르고 두부를 중불에서 앞뒤로 노릇하게 구워주세요.',
      timerSeconds: 300,
      videoUrl: null,
      stepImage: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80',
    },
    {
      step: 3,
      title: '계란 삶기',
      description: '냄비에 물을 끓인 후 계란을 넣고 8분간 삶아주세요.',
      timerSeconds: 480,
      videoUrl: null,
      stepImage: 'https://images.unsplash.com/photo-1607689536313-a7f5cb0f61d4?w=800&q=80',
    },
    {
      step: 4,
      title: '조림 소스 만들기',
      description: '간장 2큰술, 설탕 1큰술, 물 3큰술을 섞어 조림장을 만들어주세요.',
      timerSeconds: null,
      videoUrl: null,
      stepImage: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&q=80',
    },
    {
      step: 5,
      title: '조림 완성',
      description: '구운 두부와 삶은 계란을 조림장과 함께 약불에서 졸여주세요. 완성 후 참기름을 둘러 마무리합니다.',
      timerSeconds: 600,
      videoUrl: null,
      stepImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    },
  ],
}
