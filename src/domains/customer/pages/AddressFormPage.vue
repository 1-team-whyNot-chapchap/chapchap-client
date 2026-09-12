<script setup>
import AddressEditor from '../components/AddressEditor.vue'
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
const emit = defineEmits(['navigate'])
</script>
<template>
  <div class="workspace-ui address-form-page">
    <PageBackButton label="배송지 목록으로" @back="emit('navigate', 'wf-028')" />
    <header class="ui-heading">
      <div>
        <h1>새 배송지를 등록해요.</h1>
        <p>주소를 입력하고 저장하면 배송 가능 지역을 확인합니다.</p>
      </div>
    </header>
    <section class="ui-surface">
      <AddressEditor @saved="emit('navigate', 'wf-028')" @cancel="emit('navigate', 'wf-028')" />
    </section>
  </div>
</template>
<style scoped>
.address-form-page {
  max-width: 760px;
}
</style>
