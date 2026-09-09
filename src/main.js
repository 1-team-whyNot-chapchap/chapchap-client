import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import router from './router'
import './common/styles/global.css'
import './common/styles/workspace-ui.css'
import './domains/admin/admin-boundaries.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(autoAnimatePlugin)

// import.meta.env는 Vite가 .env 파일의 값을 JavaScript에서 읽을 수 있게 제공하는 객체입니다.
// VITE_로 시작하는 값은 브라우저 번들에 포함되므로, PrimeUI처럼 공개 사용을 허용한 키만 넣어야 합니다.
const primeUiLicense = import.meta.env.VITE_PRIMEUI_LICENSE

app.use(PrimeVue, {
  unstyled: true,
  license: primeUiLicense,
  locale: {
    firstDayOfWeek: 0,
    chooseYear: '연도 선택',
    chooseMonth: '월 선택',
    chooseDate: '날짜 선택',
    prevMonth: '이전 달',
    nextMonth: '다음 달',
    prevYear: '이전 연도',
    nextYear: '다음 연도',
    dayNames: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
    dayNamesMin: ['일', '월', '화', '수', '목', '금', '토'],
    monthNames: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
    monthNamesShort: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
    today: '오늘',
    clear: '지우기',
    dateFormat: 'yy-mm-dd',
    aria: {
      firstPageLabel: '첫 페이지',
      prevPageLabel: '이전 페이지',
      nextPageLabel: '다음 페이지',
      lastPageLabel: '마지막 페이지',
      pageLabel: '{page}페이지',
      selectRow: '행 선택',
      unselectRow: '행 선택 해제',
      close: '닫기',
    },
  },
})
app.use(router)

// isReady()는 새로고침한 주소에 맞는 페이지를 Vue Router가 찾을 때까지 기다립니다.
// 라우터가 준비된 뒤 앱을 연결하면 다른 페이지가 잠깐 보이는 현상을 줄일 수 있습니다.
router.isReady().then(() => {
  app.mount('#app')
})
