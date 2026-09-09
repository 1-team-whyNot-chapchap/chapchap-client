<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ClipboardList, Headphones, Package } from 'lucide-vue-next'

const emit = defineEmits(['navigate'])

const menuOffset = ref(0)
let lastScrollY = 0
let targetOffset = 0
let settleTimer
let animationFrame

// 스크롤 거리만큼 퀵 메뉴를 바로 움직이지 않고, 현재 위치가 목표 위치를 천천히 따라가게 합니다.
// requestAnimationFrame은 브라우저가 화면을 그리는 타이밍에 맞춰 한 프레임씩 실행하는 함수입니다.
function animateMenuPosition() {
  menuOffset.value += (targetOffset - menuOffset.value) * 0.14

  if (Math.abs(targetOffset - menuOffset.value) > 0.2) {
    animationFrame = window.requestAnimationFrame(animateMenuPosition)
    return
  }

  menuOffset.value = targetOffset
  animationFrame = undefined
}

function startMenuAnimation() {
  if (!animationFrame) {
    animationFrame = window.requestAnimationFrame(animateMenuPosition)
  }
}

// 스크롤 중에는 이동 방향 반대로 살짝 뒤처지게 두고, 멈춘 뒤에 원래 기준 위치로 돌아옵니다.
function handleScroll() {
  const currentScrollY = window.scrollY
  const scrollDistance = currentScrollY - lastScrollY

  lastScrollY = currentScrollY
  targetOffset = Math.max(-28, Math.min(28, targetOffset + scrollDistance * 0.3))
  startMenuAnimation()

  window.clearTimeout(settleTimer)
  settleTimer = window.setTimeout(() => {
    targetOffset = 0
    startMenuAnimation()
  }, 90)
}

// onMounted는 컴포넌트가 화면에 붙은 직후 한 번 실행됩니다.
// 여기서 스크롤을 감지하고, 화면을 떠날 때는 감지를 해제해 불필요한 동작을 막습니다.
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  lastScrollY = window.scrollY
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.clearTimeout(settleTimer)

  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
  }
})
</script>

<template>
  <!-- 데스크톱에서 메뉴와 플랜으로 빠르게 이동하는 보조 네비게이션입니다. -->
  <aside
    class="customer-quick-navigation"
    :style="{ transform: `translateY(${menuOffset}px)` }"
    aria-label="빠른 이동"
  >
    <p class="customer-quick-navigation__label">빠른 이동</p>
    <button type="button" @click="emit('navigate', 'menu')">
      <ClipboardList :size="18" aria-hidden="true" />
      <span>메뉴</span>
    </button>
    <button type="button" @click="emit('navigate', 'plans')">
      <Package :size="18" aria-hidden="true" />
      <span>플랜</span>
    </button>
    <button type="button" @click="emit('navigate', 'customer-support')">
      <Headphones :size="18" aria-hidden="true" />
      <span>고객지원</span>
    </button>
  </aside>
</template>

<style scoped>
.customer-quick-navigation {
  position: fixed;
  z-index: 15;
  top: 164px;
  right: clamp(18px, calc((100vw - 1380px) / 2), 44px);
  width: 88px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: rgba(255, 253, 249, 0.94);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(14px);
  will-change: transform;
}

.customer-quick-navigation__label {
  padding: 11px 8px 8px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
  line-height: var(--line-height-title);
  text-align: center;
}

.customer-quick-navigation button {
  width: 100%;
  display: grid;
  justify-items: center;
  gap: 5px;
  padding: 13px 8px;
  border: 0;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 800;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.customer-quick-navigation button:last-child {
  border-bottom: 0;
}

.customer-quick-navigation button:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
}

@media (max-width: 1320px) {
  .customer-quick-navigation {
    display: none;
  }
}
</style>
