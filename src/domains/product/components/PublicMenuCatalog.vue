<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { planApi } from '../../subscription/api/planApi.js'
const props = defineProps({ compact: Boolean })
const route = useRoute()
const router = useRouter()
const plans = ref([]),
  loading = ref(false),
  error = ref(''),
  broken = ref(new Set())
const selected = computed({
  get: () =>
    plans.value.some((plan) => plan.planId === route.query.filterPlanId)
      ? route.query.filterPlanId
      : '',
  set: (value) =>
    router.replace({
      query: { ...route.query, filterPlanId: value || undefined },
    }),
})
let version = 0
const cards = computed(() =>
  plans.value
    .filter((p) => !selected.value || selected.value === p.planId)
    .flatMap((p) =>
      (props.compact ? p.menus.slice(0, 1) : p.menus).map((menu) => ({
        ...menu,
        planName: p.name,
        planId: p.planId,
        key: p.planId + ':' + menu.menuSequence,
      })),
    )
    .slice(0, props.compact ? 3 : undefined),
)
async function load() {
  const current = ++version
  loading.value = true
  error.value = ''
  plans.value = []
  try {
    const list = await planApi.listPlans()
    const details = await Promise.all(list.map((p) => planApi.getPlan(p.planId)))
    if (current === version) plans.value = details
  } catch {
    if (current === version) error.value = '메뉴를 불러오지 못했습니다. 다시 시도해 주세요.'
  } finally {
    if (current === version) loading.value = false
  }
}
function markBroken(key) {
  broken.value = new Set([...broken.value, key])
}
onMounted(load)
onUnmounted(() => {
  version++
})
</script>
<template>
  <section class="workspace-ui public-menu-catalog" aria-label="플랜별 메뉴">
    <p v-if="loading" role="status">메뉴를 불러오고 있어요.</p>
    <div v-else-if="error" class="ui-note" role="alert">
      <p>{{ error }}</p>
      <div class="ui-actions ui-actions--end">
        <button class="button button-secondary" @click="load">다시 시도</button>
      </div>
    </div>
    <template v-else
      ><label v-if="!compact && plans.length" class="ui-field menu-filter"
        >플랜 선택<select v-model="selected">
          <option value="">전체 플랜</option>
          <option v-for="plan in plans" :key="plan.planId" :value="plan.planId">
            {{ plan.name }}
          </option>
        </select></label
      >
      <div class="menu-cards">
        <article v-for="menu in cards" :key="menu.key" class="ui-surface menu-card">
          <div class="menu-photo">
            <img
              v-if="menu.imageUrl && !broken.has(menu.key)"
              class="menu-image"
              :src="menu.imageUrl"
              :alt="menu.name"
              loading="lazy"
              @error="markBroken(menu.key)"
            />
            <span v-else>메뉴 이미지 준비 중</span>
          </div>
          <div class="menu-card__content">
            <span class="menu-plan">{{ menu.planName }} 플랜</span>
            <h3>{{ menu.name }}</h3>
            <RouterLink
              class="button button-outline menu-detail-button"
              :aria-label="`${menu.planName} ${menu.name} 메뉴 상세`"
              :to="{
                name: 'wf-009',
                query: {
                  planId: menu.planId,
                  menuSequence: menu.menuSequence,
                  from: 'catalog',
                  filterPlanId: selected || undefined,
                },
              }"
            >
              <span>메뉴 상세</span>
              <ChevronRight :size="18" aria-hidden="true" />
            </RouterLink>
          </div>
        </article>
      </div>
      <p v-if="!cards.length" class="ui-empty">등록된 메뉴가 없어요.</p></template
    >
  </section>
</template>
<style scoped>
.public-menu-catalog {
  padding: 0;
}
.menu-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.menu-card {
  color: inherit;
  text-decoration: none;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.menu-detail-button:focus-visible {
  outline: 3px solid var(--color-primary-pressed);
  outline-offset: 2px;
}
.menu-photo {
  position: relative;
  aspect-ratio: 1 / 1;
  display: grid;
  place-items: center;
  background: var(--color-primary-soft);
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
.menu-card__content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5);
  flex: 1;
  min-width: 0;
  word-break: keep-all;
}
.menu-detail-button {
  width: 100%;
  min-width: 0;
  margin-top: auto;
  white-space: normal;
  text-decoration: none;
}
.menu-plan {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: var(--font-weight-bold);
}
.menu-card h3 {
  margin: 0;
  font-size: var(--font-item-title);
  line-height: var(--line-height-compact);
}
.menu-card p,
.menu-card h3 {
  overflow-wrap: anywhere;
}
.menu-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
summary {
  min-height: 44px;
  align-content: center;
  cursor: pointer;
  color: var(--color-primary-pressed);
  font-weight: 700;
}
.menu-filter {
  max-width: 320px;
  margin: 0 0 24px auto;
}
@media (max-width: 900px) {
  .menu-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .menu-cards {
    grid-template-columns: 1fr;
  }
}
</style>
