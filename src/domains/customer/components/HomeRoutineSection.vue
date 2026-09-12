<script setup>
const routineSteps = [
  {
    number: '01',
    title: '내 일정에 맞춰 설정',
    description: '플랜과 배송 희망일을 먼저 선택해요.',
  },
  {
    number: '02',
    title: '포함 메뉴를 구성',
    description: '플랜 범위 안에서 원하는 메뉴를 담아요.',
  },
  {
    number: '03',
    title: '정기적으로 받아보기',
    description: '다음 배송과 결제 일정도 한눈에 확인해요.',
  },
]
</script>

<template>
  <!-- section은 구독 이용 순서라는 하나의 주제를 가진 영역을 구분합니다. -->
  <section class="home-routine">
    <div class="section-heading">
      <div>
        <h2>챱챱 이용 방법</h2>
      </div>
    </div>

    <!-- v-for는 routineSteps의 세 항목을 같은 카드 구조로 반복해서 보여 주는 Vue 문법입니다. -->
    <div class="home-routine__grid">
      <div v-for="step in routineSteps" :key="step.number" class="home-routine__card">
        <span class="home-routine__number">{{ step.number }}</span>
        <h3>{{ step.title }}</h3>
        <p>{{ step.description }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* scoped는 이 파일의 스타일을 이용 방법 컴포넌트 안에서만 적용하는 Vue 기능입니다. */
/* 이용 순서는 장식 아이콘 대신 01·02·03 번호가 흐름을 안내하도록 구성합니다. */
.home-routine {
  margin-top: 88px;
}

.home-routine__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 22px;
  background: var(--color-surface);
}

.home-routine__card {
  min-height: 184px;
  padding: 28px;
}

.home-routine__card + .home-routine__card {
  border-left: 1px solid var(--color-border);
}

.home-routine__card h3 {
  margin-top: 19px;
  font-size: var(--font-section-title);
}

.home-routine__card p {
  margin-top: 7px;
  font-size: var(--font-body);
}

.home-routine__number {
  color: var(--color-primary-pressed);
  font-size: var(--font-caption);
  font-weight: 800;
}

@media (max-width: 760px) {
  .home-routine {
    margin-top: 58px;
  }

  .home-routine__grid {
    grid-template-columns: 1fr;
    border-radius: 18px;
  }

  .home-routine__card {
    min-height: 0;
    padding: 23px 20px;
  }

  .home-routine__card + .home-routine__card {
    border-top: 1px solid var(--color-border);
    border-left: 0;
  }
}
</style>
