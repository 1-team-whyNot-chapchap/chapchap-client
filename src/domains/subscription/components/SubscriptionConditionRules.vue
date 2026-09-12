<script setup>
import { computed } from 'vue'
import { Minus, Plus } from 'lucide-vue-next'

const props = defineProps({
  rules: {
    type: Array,
    required: true,
  },
  addresses: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['change-person-count', 'update-rule'])

const deliveryTimes = ['점심 · 11:00~13:00', '저녁 · 17:00~19:00']
const addressMap = computed(() => new Map(props.addresses.map((address) => [address.id, address])))

function addressName(addressId) {
  return addressMap.value.get(addressId)?.name || '배송지 미선택'
}

function changePersonCount(weekday, change) {
  emit('change-person-count', { weekday, change })
}

function updateRule(weekday, changes) {
  emit('update-rule', { weekday, changes })
}
</script>

<template>
  <div class="condition-rule-list">
    <fieldset v-for="rule in rules" :key="rule.weekday" class="condition-rule-card">
      <legend>
        <strong>{{ rule.label }}</strong>
        <span>{{ addressName(rule.addressId) }}</span>
      </legend>

      <div class="condition-rule-card__field">
        <span>인원수</span>
        <div class="count-control" :aria-label="`${rule.label} 인원수`">
          <button
            type="button"
            :disabled="rule.personCount <= 1"
            :aria-label="`${rule.label} 인원 줄이기`"
            @click="changePersonCount(rule.weekday, -1)"
          >
            <Minus :size="17" aria-hidden="true" />
          </button>
          <output aria-live="polite">{{ rule.personCount }}명</output>
          <button
            type="button"
            :disabled="rule.personCount >= 6"
            :aria-label="`${rule.label} 인원 늘리기`"
            @click="changePersonCount(rule.weekday, 1)"
          >
            <Plus :size="17" aria-hidden="true" />
          </button>
        </div>
        <small>1~6명까지 설정할 수 있어요.</small>
      </div>

      <label class="condition-rule-card__field">
        시간대
        <select
          :value="rule.deliveryTime"
          :aria-label="`${rule.label} 배송 시간대`"
          @change="updateRule(rule.weekday, { deliveryTime: $event.target.value })"
        >
          <option v-for="deliveryTime in deliveryTimes" :key="deliveryTime">
            {{ deliveryTime }}
          </option>
        </select>
      </label>
    </fieldset>
  </div>
</template>

<style scoped>
.condition-rule-list {
  display: grid;
  gap: 14px;
}

.condition-rule-card {
  overflow-wrap: anywhere;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-width: 0;
  padding: 18px;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}

.condition-rule-card legend {
  /* Preserve fieldset semantics while laying out the caption as a grid row. */
  float: left;
  grid-column: 1 / -1;
  min-width: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  font-size: var(--font-item-title);
}

.condition-rule-card legend span {
  min-width: 0;
  max-width: 100%;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 600;
}

.condition-rule-card__field {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 8px;
  font-size: var(--font-caption);
  font-weight: 700;
}

.condition-rule-card select {
  min-width: 0;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.count-control {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 6px;
  padding: 5px;
  border-radius: 12px;
  background: var(--color-surface-subtle);
}

.count-control button {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: 9px;
  background: var(--color-surface);
  color: var(--color-text);
}

.count-control button:disabled {
  cursor: not-allowed;
  color: var(--color-text-muted);
}

.count-control output {
  min-width: 46px;
  font-weight: 800;
  text-align: center;
}

.condition-rule-card small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 500;
}

@media (max-width: 540px) {
  .condition-rule-card {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
