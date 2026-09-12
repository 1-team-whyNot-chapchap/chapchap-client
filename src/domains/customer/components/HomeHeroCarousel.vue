<script setup>
import { ref } from 'vue'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'

const emit = defineEmits(['navigate'])

const slides = [
  {
    id: 'easy-meal',
    eyebrow: '오늘 한 끼가 필요한 순간',
    highlight: '맛있는 식사도',
    title: '가볍게 챙겨요.',
    benefit: '원하는 날에 받고, 이번 주 메뉴를 직접 골라보세요.',
    action: { label: '이번 주 메뉴 보기', route: 'menu' },
    imagePosition: 'right center',
  },
  {
    id: 'meal-routine',
    eyebrow: '내 생활에 맞춘 식사 루틴',
    highlight: '바쁜 날에도',
    title: '든든하게 챙겨요.',
    benefit: '2주 단위로 구성하고, 내 일정에 맞춰 편하게 받아보세요.',
    action: { label: '플랜 살펴보기', route: 'plans' },
    imagePosition: '72% center',
  },
]

const currentSlide = ref(0)
const swipeDistance = 48
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

function handleTouchStart(event) {
  touchStartX = event.changedTouches[0].clientX
}

function handleTouchEnd(event) {
  const movedDistance = event.changedTouches[0].clientX - touchStartX

  if (Math.abs(movedDistance) >= swipeDistance) {
    movedDistance < 0 ? showNextSlide() : showPreviousSlide()
  }
}
</script>

<template>
  <section
    class="home-hero"
    aria-label="챱챱 주요 안내"
    aria-roledescription="캐러셀"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
    <div class="home-hero__viewport">
      <div class="home-hero__track" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
        <article
          v-for="(slide, index) in slides"
          :key="slide.id"
          class="home-hero__slide"
          :aria-hidden="currentSlide !== index"
          :style="{ '--hero-image-position': slide.imagePosition }"
        >
          <div class="home-hero__scrim" aria-hidden="true" />
          <div class="home-hero__content">
            <h1>
              <span>{{ slide.highlight }}</span>
              {{ slide.title }}
            </h1>
            <p class="home-hero__benefit">{{ slide.benefit }}</p>
            <button
              class="home-hero__link"
              type="button"
              :tabindex="currentSlide === index ? 0 : -1"
              @click="emit('navigate', slide.action.route)"
            >
              {{ slide.action.label }}
              <ArrowRight :size="17" aria-hidden="true" />
            </button>
          </div>
        </article>
      </div>
    </div>

    <button
      class="home-hero__arrow home-hero__arrow--previous"
      type="button"
      aria-label="이전 슬라이드"
      @click="showPreviousSlide"
    >
      <ArrowLeft :size="22" aria-hidden="true" />
    </button>
    <button
      class="home-hero__arrow home-hero__arrow--next"
      type="button"
      aria-label="다음 슬라이드"
      @click="showNextSlide"
    >
      <ArrowRight :size="22" aria-hidden="true" />
    </button>

    <div class="home-hero__indicators" aria-label="히어로 슬라이드 선택">
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
.home-hero {
  position: relative;
  overflow: hidden;
  min-height: 490px;
  background: #323436;
}

.home-hero__viewport {
  overflow: hidden;
}

.home-hero__track {
  display: flex;
  transition: transform 0.52s cubic-bezier(0.22, 0.61, 0.36, 1);
}
@media (prefers-reduced-motion: reduce) {
  .home-hero__track {
    transition: none;
  }
}

.home-hero__slide {
  position: relative;
  flex: 0 0 100%;
  min-height: 490px;
  display: flex;
  align-items: center;
  padding: 72px clamp(54px, 7vw, 106px) 86px;
  isolation: isolate;
  background-image: url('/images/home-hero-jeon.png');
  background-position: var(--hero-image-position);
  background-size: cover;
}

.home-hero__scrim {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(
      90deg,
      rgba(18, 20, 21, 0.78) 0%,
      rgba(18, 20, 21, 0.66) 33%,
      rgba(18, 20, 21, 0.1) 67%
    ),
    linear-gradient(0deg, rgba(0, 0, 0, 0.18), transparent 48%);
}

.home-hero__content {
  max-width: 500px;
  color: #fff;
}

.home-hero__eyebrow {
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-body);
  font-weight: 700;
  line-height: var(--line-height-body);
}

.home-hero h1 {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 12px;
  color: #fff;
  font-size: var(--font-display);
  font-weight: 800;
  line-height: var(--line-height-title);
  letter-spacing: -0.07em;
}

.home-hero h1 span {
  width: fit-content;
  padding: 2px 11px 5px;
  background: #f07122;
  color: #fff;
}

.home-hero__benefit {
  max-width: 340px;
  margin-top: 22px;
  color: rgba(255, 255, 255, 0.86);
  font-size: var(--font-body);
  font-weight: 600;
  line-height: var(--line-height-body);
}

.home-hero__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 25px;
  padding: 0 0 4px;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.72);
  background: transparent;
  color: #fff;
  font-size: var(--font-body);
  font-weight: 700;
}

.home-hero__link:hover {
  border-bottom-color: #f07122;
  color: #ffd3b8;
}

.home-hero__arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 50%;
  background: rgba(29, 31, 31, 0.24);
  color: #fff;
  opacity: 0.9;
  transform: translateY(-50%);
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
}

.home-hero__arrow:hover {
  background: rgba(240, 113, 34, 0.9);
  opacity: 1;
}

.home-hero__arrow--previous {
  left: 18px;
}

.home-hero__arrow--next {
  right: 18px;
}

.home-hero__indicators {
  position: absolute;
  right: 50%;
  bottom: 28px;
  z-index: 2;
  display: flex;
  gap: 8px;
  transform: translateX(50%);
}

.home-hero__indicators button {
  width: 34px;
  height: 3px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.home-hero__indicators button.is-active {
  background: #fff;
  transform: scaleX(1.15);
}

.home-hero__arrow:focus-visible,
.home-hero__link:focus-visible,
.home-hero__indicators button:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}

@media (max-width: 760px) {
  .home-hero {
    min-height: 520px;
  }

  .home-hero__slide {
    min-height: 520px;
    align-items: flex-start;
    padding: 58px 32px 96px;
    background-position: 82% center;
  }

  .home-hero__scrim {
    background:
      linear-gradient(
        90deg,
        rgba(18, 20, 21, 0.8) 0%,
        rgba(18, 20, 21, 0.5) 70%,
        rgba(18, 20, 21, 0.12) 100%
      ),
      linear-gradient(0deg, rgba(0, 0, 0, 0.34), transparent 58%);
  }

  .home-hero__eyebrow {
    font-size: var(--font-body);
  }

  .home-hero h1 {
    font-size: var(--font-display);
  }

  .home-hero__benefit {
    margin-top: 18px;
    font-size: var(--font-caption);
  }

  .home-hero__arrow {
    top: auto;
    bottom: 20px;
    width: 38px;
    height: 38px;
    transform: none;
  }

  .home-hero__arrow--previous {
    left: 20px;
  }

  .home-hero__arrow--next {
    right: 20px;
  }

  .home-hero__indicators {
    bottom: 37px;
  }
}
</style>
