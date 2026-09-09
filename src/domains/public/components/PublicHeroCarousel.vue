<script setup>
import { ref } from 'vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const emit = defineEmits(['move-to-section'])

const slides = [
  {
    id: 'subscription-start',
    eyebrow: '나의 일정에 맞춘 식사 구독',
    highlight: '필요한 요일에,',
    title: '챱챱 받는 식사',
    description: '플랜과 요일별 배송 조건을 설정하고, 서버가 안내하는 적용 결과를 확인하세요.',
    imagePosition: 'right center',
  },
  {
    id: 'subscription-overview',
    eyebrow: '한 주의 조건을 한 화면에서',
    highlight: '구독 상태부터',
    title: '다음 배송까지',
    description: '로그인 후 현재 구독, 배송 상태와 필요한 관리 화면을 각각 확인할 수 있습니다.',
    imagePosition: '72% center',
  },
]

const currentSlide = ref(0)
const swipeThreshold = 48
let touchStartX = 0

function showSlide(index) {
  currentSlide.value = index
}

function showNextSlide() {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}

function showPreviousSlide() {
  currentSlide.value = (currentSlide.value - 1 + slides.length) % slides.length
}

function recordTouchStart(event) {
  touchStartX = event.changedTouches[0].clientX
}

function moveByTouch(event) {
  const movedDistance = event.changedTouches[0].clientX - touchStartX
  if (Math.abs(movedDistance) < swipeThreshold) return
  if (movedDistance < 0) showNextSlide()
  else showPreviousSlide()
}
</script>

<template>
  <section
    class="hero-carousel"
    aria-label="챱챱 주요 안내"
    aria-roledescription="캐러셀"
    @touchstart.passive="recordTouchStart"
    @touchend.passive="moveByTouch"
  >
    <div class="hero-carousel__viewport">
      <div
        class="hero-carousel__track"
        :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
      >
        <article
          v-for="(slide, index) in slides"
          :key="slide.id"
          class="hero-carousel__slide"
          :aria-hidden="currentSlide !== index"
          :aria-label="`${index + 1} / ${slides.length}`"
          aria-roledescription="슬라이드"
          :style="{ '--hero-image-position': slide.imagePosition }"
        >
          <div class="hero-carousel__scrim" aria-hidden="true" />
          <div class="hero-carousel__copy">
            <h1>
              <span>{{ slide.highlight }}</span>
              {{ slide.title }}
            </h1>
            <strong>{{ slide.description }}</strong>
            <div class="hero-carousel__actions">
              <RouterLink
                class="button hero-carousel__primary"
                :tabindex="currentSlide === index ? 0 : -1"
                :to="{ name: 'login' }"
              >
                구독 시작하기 <ArrowRight :size="18" aria-hidden="true" />
              </RouterLink>
              <button
                type="button"
                :tabindex="currentSlide === index ? 0 : -1"
                @click="emit('move-to-section', 'how-it-works')"
              >
                이용 방법 보기
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>

    <button
      class="hero-carousel__arrow hero-carousel__arrow--previous"
      type="button"
      aria-label="이전 슬라이드"
      @click="showPreviousSlide"
    >
      <ArrowLeft :size="22" aria-hidden="true" />
    </button>
    <button
      class="hero-carousel__arrow hero-carousel__arrow--next"
      type="button"
      aria-label="다음 슬라이드"
      @click="showNextSlide"
    >
      <ArrowRight :size="22" aria-hidden="true" />
    </button>
    <div class="hero-carousel__indicators" aria-label="히어로 슬라이드 선택">
      <button
        v-for="(slide, index) in slides"
        :key="slide.id"
        type="button"
        :class="{ 'is-active': currentSlide === index }"
        :aria-label="`${index + 1}번 슬라이드 보기`"
        :aria-current="currentSlide === index ? 'true' : undefined"
        @click="showSlide(index)"
      />
    </div>
  </section>
</template>

<style scoped>
.hero-carousel {
  position: relative;
  width: min(100%, var(--content-width));
  min-height: 510px;
  margin: 16px auto 0;
  overflow: hidden;
  border-radius: 0 0 36px 36px;
  background: #323436;
}
.hero-carousel__viewport {
  overflow: hidden;
}
.hero-carousel__track {
  display: flex;
  transition: transform 360ms cubic-bezier(0.22, 0.61, 0.36, 1);
}
.hero-carousel__slide {
  position: relative;
  z-index: 0;
  display: flex;
  flex: 0 0 100%;
  align-items: center;
  min-height: 510px;
  padding: 72px min(7vw, 84px) 86px;
  isolation: isolate;
  background-image: url('/images/home-hero-jeon.png');
  background-position: var(--hero-image-position);
  background-size: cover;
}
.hero-carousel__scrim {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(
      90deg,
      rgba(18, 20, 21, 0.8) 0%,
      rgba(18, 20, 21, 0.66) 37%,
      rgba(18, 20, 21, 0.08) 72%
    ),
    linear-gradient(0deg, rgba(0, 0, 0, 0.2), transparent 50%);
}
.hero-carousel__copy {
  max-width: 510px;
  color: var(--color-surface);
}
.hero-carousel__copy > p {
  margin: 0;
  color: rgba(255, 255, 255, 0.88);
  font-size: var(--font-body);
  font-weight: 800;
}
.hero-carousel h1 {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 13px 0 0;
  font-size: var(--font-display);
  line-height: var(--line-height-title);
  letter-spacing: -0.07em;
}
.hero-carousel h1 span {
  width: fit-content;
  padding: 2px 11px 5px;
  background: var(--color-primary);
  color: var(--color-text);
}
.hero-carousel__copy > strong {
  display: block;
  max-width: 410px;
  margin-top: 23px;
  color: rgba(255, 255, 255, 0.84);
  font-size: var(--font-body);
  font-weight: 500;
  line-height: var(--line-height-body);
}
.hero-carousel__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  margin-top: 32px;
}
.hero-carousel__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 48px;
  padding: 11px 17px;
  border-radius: 10px;
  background: var(--color-primary);
  color: var(--color-text);
  font-weight: 800;
  text-decoration: none;
}
.hero-carousel__actions > button {
  min-height: 40px;
  padding: 0 0 3px;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.62);
  background: transparent;
  color: var(--color-surface);
  font-size: var(--font-body);
  font-weight: 800;
}
.hero-carousel__arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: grid;
  width: 44px;
  height: 44px;
  padding: 0;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 50%;
  background: rgba(29, 31, 31, 0.28);
  color: var(--color-surface);
  transform: translateY(-50%);
}
.hero-carousel__arrow--previous {
  left: 18px;
}
.hero-carousel__arrow--next {
  right: 18px;
}
.hero-carousel__indicators {
  position: absolute;
  bottom: 28px;
  left: 50%;
  z-index: 2;
  display: flex;
  gap: 8px;
  transform: translateX(-50%);
}
.hero-carousel__indicators button {
  width: 34px;
  height: 4px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
}
.hero-carousel__indicators button.is-active {
  background: var(--color-surface);
}
@media (hover: hover) and (pointer: fine) {
  .hero-carousel__primary:hover {
    background: var(--color-primary-hover);
  }
  .hero-carousel__actions > button:hover {
    border-bottom-color: var(--color-primary);
    color: var(--color-primary-hover);
  }
  .hero-carousel__arrow:hover {
    background: rgba(150, 167, 94, 0.9);
    color: var(--color-text);
  }
}
@media (max-width: 768px) {
  .hero-carousel {
    min-height: 520px;
    margin-top: 0;
    border-radius: 0;
  }
  .hero-carousel__slide {
    align-items: flex-start;
    min-height: 520px;
    padding: 58px var(--page-padding-mobile) 98px;
    background-position: 78% center;
  }
  .hero-carousel__scrim {
    background:
      linear-gradient(
        90deg,
        rgba(18, 20, 21, 0.84) 0%,
        rgba(18, 20, 21, 0.48) 76%,
        rgba(18, 20, 21, 0.12) 100%
      ),
      linear-gradient(0deg, rgba(0, 0, 0, 0.34), transparent 58%);
  }
  .hero-carousel__copy > p {
    font-size: var(--font-body);
  }
  .hero-carousel h1 {
    font-size: var(--font-display);
  }
  .hero-carousel__copy > strong {
    max-width: 320px;
    margin-top: 18px;
    font-size: var(--font-caption);
  }
  .hero-carousel__arrow {
    top: auto;
    bottom: 20px;
    width: 40px;
    height: 40px;
    transform: none;
  }
  .hero-carousel__arrow--previous {
    left: 20px;
  }
  .hero-carousel__arrow--next {
    right: 20px;
  }
  .hero-carousel__indicators {
    bottom: 39px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero-carousel__track {
    transition: none;
  }
}
</style>
