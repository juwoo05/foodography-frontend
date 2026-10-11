// 광고 슬롯 설정 — 광고 네트워크(AdSense 등) 붙일 때 이 파일과 AdBanner 내부만 수정
//
// width·height : 데스크톱 크기 (IAB 표준 규격)
// mobile       : 900px 이하 크기 (없으면 데스크톱 크기를 비율 유지 축소)
// adUnit       : 나중에 넣을 광고 단위 ID — 있으면 최우선 표시
// image        : 이미지 배너 (adUnit 이 없을 때 표시, 로드 실패 시 promo 로 대체)
//   src        : 데스크톱 이미지 — 표시 크기의 2배(@2x)로 제작, 파일은 client/public/ads/ 에 둠
//   mobileSrc  : 900px 이하 이미지 (없으면 src 를 비율 맞춰 잘라 표시)
//   alt        : 대체 텍스트 (필수)
//   href       : 클릭 시 이동 — '/seasonal' 같은 내부 경로 또는 https:// 외부 URL (없으면 클릭 불가)
//   newTab     : 외부 URL 새 창 열기 여부
//   eager      : 첫 화면 상단 배너면 true (지연 로딩 안 함)
//   labelSide  : 'right' 면 AD 라벨을 오른쪽 위에 표시 (이미지 왼쪽 위에 글자가 있을 때)
// promo        : 이미지도 없을 때 보여줄 자체 홍보 텍스트 배너 (null 이면 빈 플레이스홀더)
//
// 예)
//   image: {
//     src:       '/ads/notice-top_728x90.webp',
//     mobileSrc: '/ads/notice-top_mobile_320x100.webp',
//     alt:       '10월 제철 식재료 보러 가기',
//     href:      '/seasonal',
//     eager:     true,
//   },

// AdBanner.module.css 의 @media (max-width: 900px) 와 같은 값 유지
export const AD_MOBILE_QUERY = '(max-width: 900px)'

export const AD_SLOTS = {
  'notice-top': {
    width: 728, height: 90,
    mobile: { width: 320, height: 100 },
    adUnit: null,
    image: {
      src:   '/ads/notice-top_728x90.webp',
      alt:   '이달의 제철 — 제철 식재료 보러 가기',
      href:  '/seasonal',
      eager: true,
    },
    promo: {
      eyebrow: '이달의 제철',
      title:   '오늘 날씨에 맞는 제철 식재료 보기',
      cta:     '보러 가기',
      to:      '/seasonal',
    },
  },
  'notice-side': {
    width: 300, height: 250,
    adUnit: null,
    image: {
      src:  '/ads/notice-side_300x250.webp',
      alt:  'AI 냉장고 분석 — 냉장고 사진 한 장으로 오늘 저녁 메뉴 추천, 사진 올리기',
      href: '/',
    },
    promo: {
      eyebrow: 'AI 냉장고 분석',
      title:   '냉장고 사진 한 장으로\n오늘 저녁 메뉴 추천',
      cta:     '사진 올리기',
      to:      '/',
    },
  },
  'notice-bottom': {
    width: 728, height: 90,
    mobile: { width: 320, height: 100 },
    adUnit: null,
    image: {
      src:       '/ads/notice-bottom_728x90.webp',
      alt:       '오늘 단 하루! 인기 밀키트 & 신선식품 최대 50% OFF — 첫 구매 100원 혜택 + 무료 배송, 지금 쇼핑하기',
      href:      '/shopping',
      labelSide: 'right',
    },
    promo: null,
  },
}
