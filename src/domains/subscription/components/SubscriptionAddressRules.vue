<script setup>
import { computed } from 'vue'

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

const emit = defineEmits(['update-rule'])

const addressMap = computed(() => new Map(props.addresses.map((address) => [address.id, address])))

function selectedAddress(addressId) {
  return addressMap.value.get(addressId)
}

function updateRule(weekday, changes) {
  emit('update-rule', { weekday, changes })
}
</script>

<template>
  <div class="delivery-rule-list">
    <fieldset v-for="rule in rules" :key="rule.weekday" class="delivery-rule-card">
      <legend>
        <strong>{{ rule.label }}</strong>
        <span>배송</span>
      </legend>

      <label class="delivery-rule-card__address">
        배송지 선택
        <select
          :value="rule.addressId"
          :aria-label="`${rule.label} 배송지 선택`"
          @change="updateRule(rule.weekday, { addressId: $event.target.value })"
        >
          <option v-for="address in addresses" :key="address.id" :value="address.id">
            {{ address.name }}
          </option>
        </select>
        <!-- D-3: 주소 미리보기를 인라인 텍스트가 아닌 별도 박스로 표시합니다. -->
        <div v-if="selectedAddress(rule.addressId)" class="address-preview">
          <strong>{{ selectedAddress(rule.addressId).name }}</strong>
          <span>{{ selectedAddress(rule.addressId).address }}</span>
        </div>
      </label>

      <label>
        수령 방식
        <select
          :value="rule.receivingMethod"
          :aria-label="`${rule.label} 수령 방식`"
          @change="updateRule(rule.weekday, { receivingMethod: $event.target.value })"
        >
          <option>문 앞 비대면 배송</option>
          <option>직접 전달</option>
        </select>
      </label>

      <label>
        배송 메모
        <input
          :value="rule.deliveryNote"
          :aria-label="`${rule.label} 배송 메모`"
          placeholder="예: 공동현관 비밀번호는 출발 전에 알려주세요."
          type="text"
          @input="updateRule(rule.weekday, { deliveryNote: $event.target.value })"
        />
        <small>예: 공동현관 비밀번호는 배송 출발 전 알려주세요.</small>
      </label>
    </fieldset>
  </div>
</template>

<style scoped>
.delivery-rule-list {
  display: grid;
  gap: 14px;
}

.delivery-rule-card {
  overflow-wrap: anywhere;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  min-width: 0;
  padding: 18px;
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}

.delivery-rule-card legend {
  /* Keep the accessible group caption inside the card, off its border. */
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

.delivery-rule-card legend span {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--color-primary-soft);
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}

.delivery-rule-card label {
  min-width: 0;
  display: grid;
  gap: 8px;
  font-size: var(--font-caption);
  font-weight: 700;
}

.delivery-rule-card__address {
  grid-column: 1 / -1;
}

/* D-3: 주소 미리보기 보학 븕스 스타일 */
.address-preview {
  display: grid;
  gap: 3px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--color-primary-soft);
}

.address-preview strong {
  font-size: var(--font-caption);
  font-weight: 700;
  color: var(--color-primary-pressed);
}

.address-preview span {
  font-size: var(--font-caption);
  font-weight: 500;
  color: var(--color-text-muted);
  line-height: var(--line-height-compact);
}

.delivery-rule-card select,
.delivery-rule-card input {
  min-width: 0;
  min-height: 48px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}

.delivery-rule-card small {
  color: var(--color-text-muted);
  font-size: var(--font-caption);
  font-weight: 500;
  line-height: var(--line-height-compact);
}
</style>
