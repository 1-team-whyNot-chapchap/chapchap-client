<script setup>
import { ref } from 'vue'
const emit = defineEmits(['navigate'])
const orders = ref([
  { id: 'CH-240809-04', menu: '균형 식단 도시락', date: '8월 9일 배송', reviewed: false },
  { id: 'CH-240805-11', menu: '저당 도시락', date: '8월 5일 배송', reviewed: true },
])
</script>
<template>
  <section class="page">
    <header>
      <p>리뷰</p>
      <h1>배송 완료 주문의 후기를 관리해요.</h1>
      <span>리뷰는 본인이 받은 배송 완료 주문에만 작성할 수 있어요.</span>
    </header>
    <ul>
      <li v-for="order in orders" :key="order.id">
        <div>
          <strong>{{ order.menu }}</strong
          ><span>{{ order.date }} · {{ order.id }}</span>
        </div>
        <button
          v-if="!order.reviewed"
          class="button button-primary"
          type="button"
          @click="emit('navigate', 'review-create')"
        >
          후기 작성</button
        ><b v-else>작성 완료</b>
      </li>
    </ul>
  </section>
</template>
<style scoped>
header p {
  color: var(--color-primary-pressed);
  font-weight: 800;
}
h1 {
  font-size: var(--font-page-title);
  letter-spacing: -0.05em;
}
header span {
  color: var(--color-text-muted);
}
ul {
  margin: 28px 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 18px 0;
  border-bottom: 1px solid var(--color-border);
}
strong,
span {
  display: block;
}
li span {
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: var(--font-caption);
}
b {
  color: var(--color-success);
  font-size: var(--font-caption);
}
@media (max-width: 500px) {
  li {
    align-items: flex-start;
    flex-direction: column;
  }
  li .button {
    width: 100%;
  }
}
</style>
