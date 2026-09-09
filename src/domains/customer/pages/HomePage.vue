<script setup>
import DesignPreview from '../../../common/components/feedback/DesignPreview.vue'
import HomeFaqSection from '../components/HomeFaqSection.vue'
import HomeHeroCarousel from '../components/HomeHeroCarousel.vue'
import HomeMenuCarousel from '../components/HomeMenuCarousel.vue'
import HomeRoutineSection from '../components/HomeRoutineSection.vue'
import HomeSupportNoticeSection from '../components/HomeSupportNoticeSection.vue'
import HomeSubscriptionCta from '../components/HomeSubscriptionCta.vue'

// defineEmits는 자식 페이지가 App.vue에 화면 이동을 요청할 때 사용하는 Vue 문법입니다.
// 메인 전용 컴포넌트에서 받은 이동 요청을 상위 App.vue로 그대로 전달합니다.
const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="page page-home design-review-page">
    <DesignPreview title="홈" empty="새로운 메뉴를 준비하고 있어요.">
      <!-- 메인 첫 화면에서 서비스 소개와 세 가지 플랜을 안내하는 영역입니다. -->
      <HomeHeroCarousel @navigate="emit('navigate', $event)" />

      <!-- 구독을 시작하는 기본 순서를 세 단계로 설명하는 영역입니다. -->
      <HomeRoutineSection />

      <!-- 실제 메뉴 목록으로 이동하기 전에 이번 메뉴를 미리 확인하는 영역입니다. -->
      <HomeMenuCarousel @navigate="emit('navigate', $event)" />

      <!-- 메인에서 자주 묻는 내용을 바로 확인하고 고객지원으로 연결하는 영역입니다. -->
      <HomeFaqSection @navigate="emit('navigate', $event)" />

      <!-- FAQ 이후 상담 시작과 최신 운영 공지를 확인할 수 있는 보조 안내 영역입니다. -->
      <HomeSupportNoticeSection @navigate="emit('navigate', $event)" />

      <!-- 모든 안내와 궁금증을 해소한 사용자가 구독을 결심하는 마지막 CTA 영역입니다. -->
      <HomeSubscriptionCta @navigate="emit('navigate', $event)" />
    </DesignPreview>
  </div>
</template>

<style scoped>
.page-home {
  padding-top: 30px;
}

@media (max-width: 760px) {
  .page-home {
    padding-top: 16px;
  }
}
</style>
