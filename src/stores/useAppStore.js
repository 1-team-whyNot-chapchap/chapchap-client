import { defineStore } from 'pinia'
import {
  formatDeliveryChangeDeadline,
  getDeliveryDatesForWeekdays,
  getDeliveryChangeDeadline,
  hasMinimumDeliveryDatesForEachWeek,
  isDeliveryDateAvailable,
  isDeliveryChangeAllowed,
} from '../common/utils/deliveryPolicy'

const emptyMenuQuantities = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
}

const createEmptyWeeklyMenuQuantities = () => ({
  week1: { ...emptyMenuQuantities },
  week2: { ...emptyMenuQuantities },
})

const subscriptionWeekdayLabels = {
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
}

const createSubscriptionDeliveryRule = (weekday, addressId) => ({
  weekday,
  label: subscriptionWeekdayLabels[weekday],
  addressId,
  receivingMethod: '문 앞 비대면 배송',
  deliveryNote: '',
  personCount: 1,
  deliveryTime: '점심 · 11:00~13:00',
})

const syncSubscriptionApplicationLegacyFields = (application) => {
  const firstRule = application.deliveryRules[0]

  application.selectedAddressId = firstRule?.addressId || ''
  application.personCount = firstRule?.personCount || 1
  application.deliveryTime = firstRule?.deliveryTime || '점심 · 11:00~13:00'
}

const currentMenuQuantities = {
  1: 2,
  2: 1,
  3: 0,
  4: 0,
}

const initialSubscriptionRounds = [
  {
    id: 'ROUND-20260803',
    title: '8월 첫 번째 배송',
    deliveryDate: '2026-08-03',
    status: '주문 마감',
    addressName: '집',
    deliveryMethod: '문 앞 비대면 전달',
    amountLabel: '가격 미정',
    deliveryStatus: '배송 준비',
    menuItems: [
      { name: '바질 닭가슴살 덮밥', quantity: 2 },
      { name: '단호박 소불고기 덮밥', quantity: 1 },
    ],
    menuEditDisabledReason: '배송 3일 전 오후 6시가 지나 이번 회차의 변경이 마감되었습니다.',
    postponeUsed: false,
    postponeOptions: ['2026-08-04', '2026-08-05', '2026-08-06'],
  },
  {
    id: 'ROUND-20260810',
    title: '8월 두 번째 배송',
    deliveryDate: '2026-08-10',
    status: '배송 예정',
    addressName: '집',
    deliveryMethod: '문 앞 비대면 전달',
    amountLabel: '가격 미정',
    deliveryStatus: '배송 예정',
    menuItems: [
      { name: '두부 채소 비빔밥', quantity: 1 },
      { name: '바질 닭가슴살 덮밥', quantity: 2 },
    ],
    menuEditDisabledReason: '',
    postponeUsed: true,
    postponeOptions: [],
  },
  {
    id: 'ROUND-20260726',
    title: '7월 두 번째 배송',
    deliveryDate: '2026-07-26',
    status: '배송 완료',
    addressName: '집',
    deliveryMethod: '문 앞 비대면 전달',
    amountLabel: '가격 미정',
    deliveryStatus: '배송 완료',
    menuItems: [
      { name: '바질 닭가슴살 덮밥', quantity: 2 },
      { name: '단호박 소불고기 덮밥', quantity: 1 },
    ],
    menuEditDisabledReason: '이미 배송이 완료된 회차입니다.',
    postponeUsed: true,
    postponeOptions: [],
  },
]

export const useAppStore = defineStore('app', {
  state: () => ({
    addresses: [
      {
        id: 'home',
        name: '집',
        recipient: '홍길동',
        phone: '010-****-1234',
        address: '대구광역시 중구 챱챱로 12, 101동 1203호',
        isDefault: true,
      },
      {
        id: 'office',
        name: '회사',
        recipient: '홍길동',
        phone: '010-****-1234',
        address: '대구광역시 수성구 식사로 24, 5층',
        isDefault: false,
      },
    ],

    memberProfile: { name: '', email: '', phone: '', signInProvider: '' },

    paymentMethods: [
      {
        id: 'card-main',
        brand: '신한카드',
        lastFourDigits: '1234',
        expiresAt: '12/29',
        isDefault: true,
      },
      {
        id: 'card-sub',
        brand: '카카오뱅크',
        lastFourDigits: '7788',
        expiresAt: '08/28',
        isDefault: false,
      },
    ],

    paymentHistory: [
      {
        id: 'PAY-202607-0012',
        paidAt: '2026-07-26',
        description: '영양식 정기결제',
        amountLabel: '가격 미정',
        status: '결제 완료',
        paymentMethod: '신한카드 **** 1234',
      },
      {
        id: 'PAY-202607-0004',
        paidAt: '2026-07-12',
        description: '영양식 정기결제',
        amountLabel: '가격 미정',
        status: '결제 완료',
        paymentMethod: '신한카드 **** 1234',
      },
    ],

    deliveryHistory: [
      {
        id: 'DEL-202608-0003',
        deliveryDate: '2026-08-03',
        status: '배송 준비',
        addressName: '집',
        menuCount: 3,
      },
      {
        id: 'DEL-202607-0026',
        deliveryDate: '2026-07-26',
        status: '배송 완료',
        addressName: '집',
        menuCount: 3,
      },
    ],

    refundHistory: [],

    subscriptionRounds: initialSubscriptionRounds.map((round) => ({
      ...round,
      menuItems: round.menuItems.map((menu) => ({ ...menu })),
      postponeOptions: [...round.postponeOptions],
    })),

    selectedPaymentId: 'PAY-202607-0012',
    selectedDeliveryId: 'DEL-202608-0003',
    selectedRoundId: 'ROUND-20260803',

    // subscriptionApplication은 신청이 완료되기 전까지만 사용하는 임시 입력값입니다.
    selectedPlan: 'nutrition',
    subscriptionApplication: {
      deliveryWeekdays: [],
      deliveryDays: [],
      deliveryRules: [],
      personCount: 1,
      deliveryTime: '점심 · 11:00~13:00',
      selectedAddressId: 'home',
      selectedPaymentMethodId: 'card-main',
      menuQuantities: { ...emptyMenuQuantities },
      weeklyMenuQuantities: createEmptyWeeklyMenuQuantities(),
      isNonFaceToFaceStorageAgreed: false,
      isAutoPaymentAgreed: false,
    },

    // currentSubscription은 실제 내 구독 화면에 표시하는 적용 완료 상태입니다.
    currentSubscription: {
      planId: 'nutrition',
      status: 'active',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-28',
      deliveryDays: [
        '2026-08-03',
        '2026-08-04',
        '2026-08-05',
        '2026-08-10',
        '2026-08-12',
        '2026-08-14',
      ],
      personCount: 1,
      deliveryTime: '점심 · 11:00~13:00',
      selectedAddressId: 'home',
      deliveryRules: [
        {
          id: 'monday',
          label: '월요일',
          personCount: 1,
          deliveryTime: '점심 · 11:00~13:00',
          addressId: 'home',
        },
        {
          id: 'wednesday',
          label: '수요일',
          personCount: 1,
          deliveryTime: '점심 · 11:00~13:00',
          addressId: 'home',
        },
        {
          id: 'friday',
          label: '금요일',
          personCount: 1,
          deliveryTime: '저녁 · 17:00~19:00',
          addressId: 'office',
        },
      ],
      menuQuantities: { ...currentMenuQuantities },
      dates: {
        nextDelivery: '2026-08-03',
        nextPayment: '2026-08-09',
      },
    },

    scheduledPlan: '',
    isCancellationScheduled: false,
    // 구독 설정 변경은 확인 화면을 거친 뒤에만 적용합니다.
    subscriptionSettingsDraft: null,

    // 플랜 선택 Sheet는 필요한 진입점에서만 열고, 구독 신청 화면으로 이어집니다.
    isPlanSheetOpen: false,
  }),

  getters: {
    // Object.values는 객체의 값만 배열로 꺼내고 reduce는 수량을 차례로 더합니다.
    selectedMenuCount: (state) =>
      Object.values(state.subscriptionApplication.weeklyMenuQuantities).reduce(
        (total, weekQuantities) =>
          total +
          Object.values(weekQuantities).reduce((weekTotal, quantity) => weekTotal + quantity, 0),
        0,
      ),

    weeklySelectedMenuCounts: (state) =>
      Object.fromEntries(
        Object.entries(state.subscriptionApplication.weeklyMenuQuantities).map(
          ([week, quantities]) => [
            week,
            Object.values(quantities).reduce((total, quantity) => total + quantity, 0),
          ],
        ),
      ),

    hasRequiredWeeklyMenuSelections: (state) =>
      Object.values(state.subscriptionApplication.weeklyMenuQuantities).every(
        (quantities) =>
          Object.values(quantities).reduce((total, quantity) => total + quantity, 0) >= 3,
      ),

    currentMenuCount: (state) =>
      Object.values(state.currentSubscription.menuQuantities).reduce(
        (total, quantity) => total + quantity,
        0,
      ),

    minimumMenuCount: (state) => (state.selectedPlan === 'hearty' ? 6 : 3),

    currentMinimumMenuCount: (state) => (state.currentSubscription.planId === 'hearty' ? 6 : 3),

    selectedAddress: (state) => {
      const address = state.addresses.find(
        (address) => address.id === state.currentSubscription.selectedAddressId,
      )

      return (
        address || {
          name: '배송지 선택 필요',
          address: '등록된 배송지가 없습니다.',
        }
      )
    },

    selectedPayment: (state) =>
      state.paymentHistory.find((payment) => payment.id === state.selectedPaymentId) ||
      state.paymentHistory[0],

    selectedDelivery: (state) =>
      state.deliveryHistory.find((delivery) => delivery.id === state.selectedDeliveryId) ||
      state.deliveryHistory[0],

    selectedRound: (state) =>
      state.subscriptionRounds.find((round) => round.id === state.selectedRoundId) ||
      state.subscriptionRounds[0],

    currentRound: (state) => state.subscriptionRounds[0],

    currentChangeDeadline: (state) =>
      getDeliveryChangeDeadline(state.currentSubscription.dates.nextDelivery),

    canEditCurrentDelivery: (state) =>
      isDeliveryChangeAllowed(state.currentSubscription.dates.nextDelivery),

    isRoundChangeAllowed: () => (round) => isDeliveryChangeAllowed(round.deliveryDate),

    formatRoundChangeDeadline: () => (round) => formatDeliveryChangeDeadline(round.deliveryDate),
  },

  actions: {
    updateMemberProfile(profile) {
      // 객체 펼침 문법(...)은 기존 값 중 전달된 항목만 새 값으로 덮어씁니다.
      this.memberProfile = { ...this.memberProfile, ...profile }
    },

    addAddress(address) {
      const newAddressId = `address-${this.addresses.length + 1}`

      if (address.isDefault) {
        // forEach는 등록된 배송지를 하나씩 확인해 기존 기본 표시를 해제합니다.
        this.addresses.forEach((savedAddress) => {
          savedAddress.isDefault = false
        })
      }

      this.addresses.push({
        ...address,
        id: newAddressId,
        isDefault: address.isDefault || this.addresses.length === 0,
      })
    },

    setDefaultAddress(addressId) {
      this.addresses.forEach((address) => {
        address.isDefault = address.id === addressId
      })
    },

    setDefaultPaymentMethod(paymentMethodId) {
      this.paymentMethods.forEach((paymentMethod) => {
        paymentMethod.isDefault = paymentMethod.id === paymentMethodId
      })
    },

    beginSubscriptionApplication(planId) {
      this.selectedPlan = planId
      this.subscriptionApplication.deliveryWeekdays = []
      this.subscriptionApplication.deliveryDays = []
      this.subscriptionApplication.deliveryRules = []
      this.subscriptionApplication.personCount = 1
      this.subscriptionApplication.deliveryTime = '점심 · 11:00~13:00'
      this.subscriptionApplication.selectedPaymentMethodId =
        this.paymentMethods.find((paymentMethod) => paymentMethod.isDefault)?.id || ''
      this.subscriptionApplication.menuQuantities = { ...emptyMenuQuantities }
      this.subscriptionApplication.weeklyMenuQuantities = createEmptyWeeklyMenuQuantities()
      this.subscriptionApplication.isNonFaceToFaceStorageAgreed = false
      this.subscriptionApplication.isAutoPaymentAgreed = false
    },

    toggleDeliveryDate(date) {
      const { deliveryDays } = this.subscriptionApplication
      const dateIndex = deliveryDays.indexOf(date)

      if (dateIndex >= 0) {
        deliveryDays.splice(dateIndex, 1)
        return true
      }

      if (!isDeliveryDateAvailable(date)) {
        return false
      }

      deliveryDays.push(date)
      deliveryDays.sort()
      return true
    },

    setSubscriptionDeliveryWeekdays(weekdays) {
      const normalizedWeekdays = [...new Set(weekdays)]
        .filter((weekday) => Number.isInteger(weekday) && weekday >= 1 && weekday <= 6)
        .sort((a, b) => a - b)
      const existingRulesByWeekday = new Map(
        this.subscriptionApplication.deliveryRules.map((rule) => [rule.weekday, rule]),
      )
      const defaultAddressId =
        this.subscriptionApplication.selectedAddressId ||
        this.addresses.find((address) => address.isDefault)?.id ||
        ''

      this.subscriptionApplication.deliveryWeekdays = normalizedWeekdays
      this.subscriptionApplication.deliveryDays = getDeliveryDatesForWeekdays(normalizedWeekdays)
      this.subscriptionApplication.deliveryRules = normalizedWeekdays.map((weekday) => {
        const existingRule = existingRulesByWeekday.get(weekday)

        return {
          ...createSubscriptionDeliveryRule(weekday, defaultAddressId),
          ...existingRule,
        }
      })
      syncSubscriptionApplicationLegacyFields(this.subscriptionApplication)
    },

    updateSubscriptionDeliveryRule(weekday, changes) {
      const rule = this.subscriptionApplication.deliveryRules.find(
        (deliveryRule) => deliveryRule.weekday === weekday,
      )

      if (!rule) return false

      Object.assign(rule, changes)
      syncSubscriptionApplicationLegacyFields(this.subscriptionApplication)
      return true
    },

    changeSubscriptionDeliveryRulePersonCount(weekday, change) {
      const rule = this.subscriptionApplication.deliveryRules.find(
        (deliveryRule) => deliveryRule.weekday === weekday,
      )

      if (!rule) return false

      const currentCount = Number(rule.personCount) || 1
      rule.personCount = Math.max(1, Math.min(6, currentCount + change))
      syncSubscriptionApplicationLegacyFields(this.subscriptionApplication)
      return true
    },

    selectSubscriptionPaymentMethod(paymentMethodId) {
      if (!this.paymentMethods.some((paymentMethod) => paymentMethod.id === paymentMethodId)) {
        return false
      }

      this.subscriptionApplication.selectedPaymentMethodId = paymentMethodId
      return true
    },

    changeMenuQuantity(menuId, change, week = 'week1') {
      const quantities = this.subscriptionApplication.weeklyMenuQuantities[week]
      const nextQuantity = Math.max(0, quantities[menuId] + change)
      quantities[menuId] = nextQuantity

      // 기존 신청 데이터와 현재 회차 메뉴 표시는 1주차 구성을 사용합니다.
      this.subscriptionApplication.menuQuantities = {
        ...this.subscriptionApplication.weeklyMenuQuantities.week1,
      }
    },

    completeSubscriptionApplication() {
      if (!hasMinimumDeliveryDatesForEachWeek(this.subscriptionApplication.deliveryDays)) {
        return false
      }

      if (!this.hasRequiredWeeklyMenuSelections) {
        return false
      }

      this.currentSubscription.planId = this.selectedPlan
      this.currentSubscription.deliveryDays = [...this.subscriptionApplication.deliveryDays]
      this.currentSubscription.personCount = this.subscriptionApplication.personCount
      this.currentSubscription.deliveryTime = this.subscriptionApplication.deliveryTime
      this.currentSubscription.selectedAddressId = this.subscriptionApplication.selectedAddressId
      this.currentSubscription.menuQuantities = {
        ...this.subscriptionApplication.weeklyMenuQuantities.week1,
      }
      this.currentSubscription.status = 'active'
      this.scheduledPlan = ''
      this.isCancellationScheduled = false
      return true
    },

    replaceMenuQuantities(quantities) {
      this.currentSubscription.menuQuantities = { ...quantities }
    },

    updateDeliveryConditions({ deliveryDays, deliveryTime, selectedAddressId }) {
      if (!hasMinimumDeliveryDatesForEachWeek(deliveryDays)) {
        return false
      }

      this.currentSubscription.deliveryDays = [...deliveryDays]
      this.currentSubscription.deliveryTime = deliveryTime
      this.currentSubscription.selectedAddressId = selectedAddressId
      return true
    },

    prepareSubscriptionSettingsChange({ planId, deliveryRules }) {
      this.subscriptionSettingsDraft = {
        planId,
        deliveryRules: deliveryRules.map((rule) => ({ ...rule })),
      }
    },

    clearSubscriptionSettingsDraft() {
      this.subscriptionSettingsDraft = null
    },

    applySubscriptionSettingsChange() {
      const draft = this.subscriptionSettingsDraft

      if (!draft || !draft.deliveryRules.length) {
        return false
      }

      const firstRule = draft.deliveryRules[0]
      this.currentSubscription.planId = draft.planId
      this.currentSubscription.deliveryRules = draft.deliveryRules.map((rule) => ({ ...rule }))
      this.currentSubscription.personCount = firstRule.personCount
      this.currentSubscription.deliveryTime = firstRule.deliveryTime
      this.currentSubscription.selectedAddressId = firstRule.addressId
      this.subscriptionSettingsDraft = null
      this.scheduledPlan = ''
      return true
    },

    selectPayment(paymentId) {
      this.selectedPaymentId = paymentId
    },

    selectDelivery(deliveryId) {
      this.selectedDeliveryId = deliveryId
    },

    selectRound(roundId) {
      this.selectedRoundId = roundId
    },

    postponeRound(roundId, nextDeliveryDate) {
      const round = this.subscriptionRounds.find((item) => item.id === roundId)

      if (!round || round.postponeUsed || !round.postponeOptions.includes(nextDeliveryDate)) {
        return false
      }

      round.deliveryDate = nextDeliveryDate
      round.postponeUsed = true
      round.postponeOptions = []
      return true
    },

    schedulePlanChange(planId) {
      this.scheduledPlan = planId
    },

    scheduleCancellation() {
      this.isCancellationScheduled = true
    },

    openPlanSheet() {
      this.isPlanSheetOpen = true
    },

    closePlanSheet() {
      this.isPlanSheetOpen = false
    },

    startPlanSelection(planId) {
      this.beginSubscriptionApplication(planId)
      this.closePlanSheet()
    },
  },
})
