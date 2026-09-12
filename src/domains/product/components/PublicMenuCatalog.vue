<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { planApi } from '../../subscription/api/planApi.js'
const props = defineProps({ compact: Boolean })
const plans = ref([]),
  loading = ref(false),
  error = ref(''),
  selected = ref(''),
  broken = ref(new Set())
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
          <img
            v-if="menu.imageUrl && !broken.has(menu.key)"
            class="menu-image"
            :src="menu.imageUrl"
            :alt="menu.name"
            loading="lazy"
            @error="markBroken(menu.key)"
          />
          <div class="ui-stack">
            <p class="ui-muted">{{ menu.planName }} · {{ menu.menuSequence }}번 메뉴</p>
            <h3>{{ menu.name }}</h3>
            <p>{{ menu.description }}</p>
            <p v-if="menu.nutritionInfo">{{ menu.nutritionInfo }}</p>
            <details v-if="!compact">
              <summary>메뉴 상세 정보</summary>
              <p>알레르기: {{ menu.allergenInfo || '등록된 정보 없음' }}</p>
              <p>원재료: {{ menu.ingredientInfo || '등록된 정보 없음' }}</p>
            </details>
            <RouterLink class="button button-secondary" :to="'/plans/' + menu.planId"
              >플랜 상세</RouterLink
            >
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
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.menu-card > .ui-stack {
  padding: 24px;
  flex: 1;
}
.menu-card .button {
  margin-top: auto;
  align-self: flex-end;
}
.menu-card p,
.menu-card h3 {
  overflow-wrap: anywhere;
}
.menu-image {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
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
