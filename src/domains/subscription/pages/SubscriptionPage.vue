<script setup>
import PageBackButton from '../../../common/components/navigation/PageBackButton.vue'
import SubscriptionOverview from '../components/SubscriptionOverview.vue'
</script>

<template>
  <SubscriptionOverview title="내 구독" :show-plan-description="false">
    <template #navigation>
      <PageBackButton to="/mypage" label="마이페이지" />
    </template>
  </SubscriptionOverview>
</template>
