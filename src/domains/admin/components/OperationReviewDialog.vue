<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { dialogPt } from '../../../common/constants/primeUiPt'
const props = defineProps({
  visible: Boolean,
  title: { type: String, required: true },
  target: { type: String, default: '' },
  dirty: Boolean,
})
const emit = defineEmits(['update:visible'])
const reviewed = ref(false)
const discard = ref(false)
watch(
  () => props.visible,
  () => {
    reviewed.value = false
    discard.value = false
  },
)
function close() {
  if (props.dirty) discard.value = true
  else emit('update:visible', false)
}
</script>
<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :header="title"
    :pt="dialogPt"
    @update:visible="close"
  >
    <form
      class="ui-stack"
      @submit.prevent="reviewed = true"
      @input="reviewed = false"
      @change="reviewed = false"
    >
      <p v-if="target" class="ui-note">{{ target }}</p>
      <slot />
      <p v-if="reviewed" class="ui-note" role="status">
        입력 형식을 확인했습니다. 서버에 제출하지 않았으며 실제 상태는 바뀌지 않습니다.
      </p>
      <p class="ui-muted">
        미리보기의 입력 내용은 이 창에서만 사용합니다. 실제 실행은 권한·최신 상태 검증을 연결한 뒤
        가능합니다.
      </p>
      <div class="ui-actions">
        <button type="button" class="button button-secondary" @click="close">취소</button
        ><button class="button button-secondary" type="submit">입력 내용 확인</button
        ><button class="button button-primary" disabled>실제 실행 · 연결 전</button>
      </div>
      <div v-if="discard" class="ui-note ui-stack" role="alert">
        <p>입력한 초안을 닫을까요? 실제 서버 작업은 실행되지 않았습니다.</p>
        <div class="ui-actions">
          <button type="button" class="button button-secondary" @click="discard = false">
            계속 편집</button
          ><button
            type="button"
            class="button button-danger-outline"
            @click="emit('update:visible', false)"
          >
            초안 닫기
          </button>
        </div>
      </div>
    </form>
  </Dialog>
</template>
