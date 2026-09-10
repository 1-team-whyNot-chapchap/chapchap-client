import { createRouter, createWebHashHistory } from 'vue-router'
import { pageCatalog } from './pageCatalog'
import { authSession } from '../common/api/http.js'
import { createAccessGuard } from '../domains/auth/routeAccess.js'
import { loginPath } from '../domains/auth/authSession.js'

// 서버의 /auth/callback 리다이렉트를 hash router 경로로 변환한다.
// 전달받은 문자열로 외부 이동 경로를 만들지 않는다.
if (window.location.pathname === '/auth/callback') {
  const query = new URLSearchParams(window.location.search)
  const safe = new URLSearchParams()
  for (const key of ['code', 'signupSessionId']) if (query.has(key)) safe.set(key, query.get(key))
  window.history.replaceState(null, '', `/#/auth/callback${safe.size ? `?${safe}` : ''}`)
}

// PortOne mobile redirects use a normal path, not a URL fragment.
if (window.location.pathname === '/signup/identity-callback') {
  const query = new URLSearchParams(window.location.search)
  const safe = new URLSearchParams()
  for (const key of ['code', 'identityVerificationId'])
    if (query.has(key)) safe.set(key, query.get(key))
  window.history.replaceState(null, '', `/#/signup${safe.size ? `?${safe}` : ''}`)
}

// 동적 import는 방문한 페이지의 코드만 내려받아 첫 화면의 파일 크기를 줄입니다.
const AddressFormPage = () => import('../domains/customer/pages/AddressFormPage.vue')
const AddressListPage = () => import('../domains/customer/pages/AddressListPage.vue')
const AccountSettingsPage = () => import('../domains/customer/pages/AccountSettingsPage.vue')
const AdminAccessPage = () => import('../domains/admin/pages/AdminAccessPage.vue')
const AdminAccountManagementPage = () =>
  import('../domains/admin/pages/AdminAccountManagementPage.vue')
const AdminDashboard = () => import('../domains/admin/pages/AdminWorkHomePage.vue')
const AdminDeliveryAssignmentPage = () =>
  import('../domains/admin/pages/AdminDeliveryAssignmentPage.vue')
const AdminIntegrationEventsPage = () =>
  import('../domains/admin/pages/AdminIntegrationEventsPage.vue')
const AdminManagementPage = () => import('../domains/admin/pages/AdminManagementPage.vue')
const AdminNotificationPage = () => import('../domains/admin/pages/AdminNotificationPage.vue')
const AdminOwnerQuotaPage = () => import('../domains/admin/pages/AdminOwnerQuotaPage.vue')
const AdminPlanRotationPage = () => import('../domains/admin/pages/AdminPlanRotationPage.vue')
const AdminPasswordPage = () => import('../domains/admin/pages/AdminPasswordPage.vue')
const AdminOperatingPolicyPage = () => import('../domains/admin/pages/AdminOperatingPolicyPage.vue')
const AdminRoleManagementPage = () => import('../domains/admin/pages/AdminRoleManagementPage.vue')
const AdminSupportManagementPage = () =>
  import('../domains/admin/pages/AdminSupportManagementPage.vue')
const AdminCancellationManagementPage = () =>
  import('../domains/admin/pages/AdminCancellationManagementPage.vue')
const AdminWorkspacePage = () => import('../domains/admin/pages/AdminWorkspacePage.vue')
const AuthPage = () => import('../domains/auth/pages/AuthPage.vue')
const SignupPage = () => import('../domains/auth/pages/SignupPage.vue')
const ProfileDesignPage = () => import('../domains/customer/pages/ProfileDesignPage.vue')
const FaqDesignPage = () => import('../domains/customer/pages/FaqDesignPage.vue')
const CustomerSupportPage = () => import('../domains/customer/pages/CustomerSupportPage.vue')
const ConsultationDesignPage = () => import('../domains/customer/pages/ConsultationDesignPage.vue')
const DeliveryDetailPage = () => import('../domains/delivery/pages/DeliveryDetailPage.vue')
const DeliveryEditPage = () => import('../domains/delivery/pages/DeliveryEditPage.vue')
const DeliveryHistoryPage = () => import('../domains/delivery/pages/DeliveryHistoryPage.vue')
const HomePage = () => import('../domains/customer/pages/HomePage.vue')
const MenuDetailPage = () => import('../domains/product/pages/MenuDetailPage.vue')
const MenuListPage = () => import('../domains/product/pages/MenuListPage.vue')
const MenuBuilder = () => import('../domains/subscription/pages/MenuBuilder.vue')
const MyPage = () => import('../domains/customer/pages/MyPage.vue')
const NotificationPage = () => import('../domains/customer/pages/NotificationPage.vue')
const PaymentDetailPage = () => import('../domains/customer/pages/PaymentDetailPage.vue')
const PaymentHistoryPage = () => import('../domains/customer/pages/PaymentHistoryPage.vue')
const PaymentMethodListPage = () => import('../domains/customer/pages/PaymentMethodListPage.vue')
const PaymentMethodRegistrationPage = () =>
  import('../domains/customer/pages/PaymentMethodRegistrationPage.vue')
const PlanChangePage = () => import('../domains/subscription/pages/PlanChangePage.vue')
const PlanDetailPage = () => import('../domains/product/pages/PlanDetailPage.vue')
const PlanPage = () => import('../domains/product/pages/PlanPage.vue')
const RefundChatPage = () => import('../domains/customer/pages/RefundChatPage.vue')
const RefundHistoryPage = () => import('../domains/customer/pages/RefundHistoryPage.vue')
const SubscriptionCancelPage = () =>
  import('../domains/subscription/pages/SubscriptionCancelPage.vue')
const SubscriptionFlowPage = () => import('../domains/subscription/pages/SubscriptionFlowPage.vue')
const SubscriptionDetailPage = () =>
  import('../domains/subscription/pages/SubscriptionDetailPage.vue')
const SubscriptionSettingsPage = () =>
  import('../domains/subscription/pages/SubscriptionSettingsPage.vue')
const SubscriptionSettingsConfirmPage = () =>
  import('../domains/subscription/pages/SubscriptionSettingsConfirmPage.vue')
const SubscriptionListPage = () => import('../domains/subscription/pages/SubscriptionListPage.vue')
const SubscriptionPage = () => import('../domains/subscription/pages/SubscriptionPage.vue')
const SubscriptionRoundDetailPage = () =>
  import('../domains/subscription/pages/SubscriptionRoundDetailPage.vue')
const SubscriptionRoundsPage = () =>
  import('../domains/subscription/pages/SubscriptionRoundsPage.vue')
const LegalDocumentPage = () => import('../domains/customer/pages/LegalDocumentPage.vue')
const SystemStatePage = () => import('../domains/customer/pages/SystemStatePage.vue')
const ReviewPage = () => import('../domains/customer/pages/ReviewPage.vue')
const ReviewHistoryPage = () => import('../domains/customer/pages/ReviewHistoryPage.vue')
const QualityIssuePage = () => import('../domains/customer/pages/QualityIssuePage.vue')
const OwnerDashboardPage = () => import('../domains/owner/pages/OwnerDashboardPage.vue')
const OwnerDeliveryAssignmentPage = () =>
  import('../domains/owner/pages/OwnerDeliveryAssignmentPage.vue')
const OwnerInvitationCodePage = () => import('../domains/owner/pages/OwnerInvitationCodePage.vue')
const OwnerOperationsPage = () => import('../domains/owner/pages/OwnerOperationsPage.vue')
const RiderDeliveryDetailPage = () => import('../domains/rider/pages/RiderDeliveryDetailPage.vue')
const RiderDeliveryPage = () => import('../domains/rider/pages/RiderDeliveryPage.vue')
const RiderIssuePage = () => import('../domains/rider/pages/RiderIssuePage.vue')
const RiderSchedulePage = () => import('../domains/rider/pages/RiderSchedulePage.vue')
const RiderLoginPage = () => import('../domains/auth/pages/RiderLoginPage.vue')

const authRoutes = pageCatalog
  .filter((page) => ['002', '003', '004', '005', '006', '007'].includes(page.id))
  .map((page) => ({
    path: `/wf-${page.id}`,
    name: `wf-${page.id}`,
    component: AuthPage,
    props: { pageId: page.id },
    meta: { layout: 'minimal' },
  }))

const adminRoutes = pageCatalog
  .filter((page) => page.isAdmin)
  .map((page) => ({
    path: `/admin/wf-${page.id}`,
    name: `wf-${page.id}`,
    component: AdminWorkspacePage,
    props: { pageId: page.id },
    meta: { area: 'admin' },
  }))

// createWebHashHistory는 주소의 # 뒤를 바꿔 화면을 전환하는 Vue Router 방식입니다.
// 별도 서버 설정이 없는 현재 디자인 프로토타입에서도 새로고침 시 화면을 안전하게 다시 찾습니다.
// 예: #/plans 주소는 플랜 화면을 뜻합니다.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('../domains/auth/pages/AuthCallbackPage.vue'),
      meta: { layout: 'minimal' },
    },
    {
      path: '/admin/password/initial',
      name: 'admin-initial-password',
      component: AdminPasswordPage,
      meta: { layout: 'minimal' },
    },
    { path: '/', name: 'home', component: HomePage },
    { path: '/help/chat', name: 'consultation-design', component: ConsultationDesignPage },
    { path: '/help/faq', name: 'faq-design', component: FaqDesignPage },
    // 실제 서비스에서 사용하는 인증 진입점입니다. 기존 wf 경로는 와이어프레임 확인용으로 유지합니다.
    {
      path: '/login',
      name: 'login',
      component: AuthPage,
      props: { pageId: '002' },
      meta: { layout: 'minimal' },
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupPage,
      meta: { layout: 'minimal' },
    },
    { path: '/menu', name: 'menu', component: MenuListPage },
    {
      path: '/subscribe/menu',
      name: 'subscribe-menu',
      component: MenuBuilder,
      meta: { layout: 'minimal' },
    },
    { path: '/plans', name: 'plans', component: PlanPage },
    ...authRoutes,
    { path: '/wf-008', name: 'wf-008', component: MenuListPage },
    { path: '/wf-009', name: 'wf-009', component: MenuDetailPage },
    {
      path: '/wf-011',
      name: 'wf-011',
      component: PlanDetailPage,
      props: { planId: 'healthy' },
    },
    {
      path: '/wf-012',
      name: 'wf-012',
      component: PlanDetailPage,
      props: { planId: 'nutrition' },
    },
    {
      path: '/plans/hearty',
      name: 'plan-hearty-detail',
      component: PlanDetailPage,
      props: { planId: 'hearty' },
    },
    { path: '/subscription', name: 'subscription', component: SubscriptionPage },
    { path: '/subscription/list', name: 'subscription-list', component: SubscriptionListPage },
    { path: '/subscription/detail', name: 'wf-021', component: SubscriptionDetailPage },
    { path: '/subscription/rounds', name: 'wf-022', component: SubscriptionRoundsPage },
    {
      path: '/subscription/rounds/detail',
      name: 'wf-023',
      component: SubscriptionRoundDetailPage,
    },
    {
      path: '/subscription/change-plan',
      name: 'wf-054',
      component: PlanChangePage,
    },
    {
      path: '/subscription/cancel',
      name: 'subscription-cancel',
      component: SubscriptionCancelPage,
    },
    {
      path: '/subscription/settings',
      name: 'wf-024',
      component: SubscriptionSettingsPage,
    },
    {
      path: '/subscription/settings/confirm',
      name: 'wf-025',
      component: SubscriptionSettingsConfirmPage,
    },
    {
      path: '/subscription/delivery/menu',
      name: 'delivery-menu-edit',
      component: MenuBuilder,
      props: { mode: 'delivery' },
    },
    {
      path: '/subscription/delivery/conditions',
      name: 'delivery-conditions-edit',
      component: DeliveryEditPage,
    },
    { path: '/mypage', name: 'mypage', component: MyPage },
    { path: '/mypage/notifications', name: 'notifications', component: NotificationPage },
    {
      path: '/mypage/account-settings',
      name: 'account-settings',
      component: AccountSettingsPage,
    },
    { path: '/mypage/profile', alias: '/me/profile', name: 'wf-027', component: ProfileDesignPage },
    { path: '/mypage/addresses', name: 'wf-028', component: AddressListPage },
    { path: '/mypage/addresses/new', name: 'wf-029', component: AddressFormPage },
    { path: '/mypage/payment-methods', name: 'wf-030', component: PaymentMethodListPage },
    {
      path: '/mypage/payment-methods/register',
      name: 'payment-method-register',
      component: PaymentMethodRegistrationPage,
    },
    { path: '/mypage/payments', name: 'wf-031', component: PaymentHistoryPage },
    { path: '/mypage/payments/detail', name: 'wf-032', component: PaymentDetailPage },
    { path: '/mypage/deliveries', name: 'wf-033', component: DeliveryHistoryPage },
    { path: '/mypage/deliveries/detail', name: 'wf-034', component: DeliveryDetailPage },
    { path: '/mypage/refunds', name: 'wf-035', component: RefundHistoryPage },
    { path: '/mypage/refunds/chat', name: 'wf-036', component: RefundChatPage },
    { path: '/admin', name: 'admin', component: AdminDashboard },
    {
      path: '/admin/consultations',
      name: 'admin-consultations',
      component: () => import('../domains/admin/pages/AdminConsultationsPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/consultations/:consultationId',
      name: 'admin-consultation-detail',
      component: () => import('../domains/admin/pages/AdminConsultationDetailPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/quality-inquiries',
      name: 'admin-quality-inquiries',
      component: () => import('../domains/admin/pages/AdminQualityInquiriesPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/faqs',
      name: 'admin-faqs',
      component: () => import('../domains/admin/pages/AdminFaqsPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/knowledge',
      name: 'admin-knowledge',
      component: () => import('../domains/admin/pages/AdminKnowledgePage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/audit-logs',
      name: 'admin-audit-logs',
      component: () => import('../domains/admin/pages/AdminAuditLogsPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/integration-events',
      name: 'admin-integration-events',
      component: AdminIntegrationEventsPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/delivery-groups',
      name: 'admin-delivery-groups',
      component: () => import('../domains/admin/pages/AdminDeliveryGroupsPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/delivery-groups/:deliveryGroupId',
      name: 'admin-delivery-group-detail',
      component: () => import('../domains/admin/pages/AdminDeliveryGroupDetailPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/deliveries/:deliveryId',
      name: 'admin-delivery-detail',
      component: () => import('../domains/admin/pages/AdminDeliveryDetailPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/delivery-operations',
      name: 'admin-delivery-operations',
      component: () => import('../domains/admin/pages/AdminDeliveryOperationsPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/riders/:riderId',
      name: 'admin-rider-operation',
      component: () => import('../domains/admin/pages/AdminRiderOperationPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/rider-leave-requests',
      name: 'admin-rider-leave-requests',
      component: () => import('../domains/admin/pages/AdminRiderLeaveRequestsPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/accounts',
      name: 'admin-accounts',
      component: AdminAccountManagementPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/riders',
      name: 'admin-rider-accounts',
      component: () => import('../domains/admin/pages/AdminRiderAccountPage.vue'),
      meta: { area: 'admin' },
    },
    {
      path: '/admin/password',
      name: 'admin-password',
      component: AdminPasswordPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/delivery-assignments',
      name: 'admin-delivery-assignment',
      component: AdminDeliveryAssignmentPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/management',
      name: 'admin-management',
      component: AdminManagementPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/owner-quotas',
      name: 'admin-owner-quotas',
      component: AdminOwnerQuotaPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/plan-rotation',
      name: 'admin-plan-rotation',
      component: AdminPlanRotationPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/operating-policy',
      name: 'admin-operating-policy',
      component: AdminOperatingPolicyPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/roles',
      name: 'admin-role-management',
      component: AdminRoleManagementPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/support',
      name: 'admin-support-management',
      component: AdminSupportManagementPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/cancellations',
      name: 'admin-cancellations',
      component: AdminCancellationManagementPage,
      meta: { area: 'admin' },
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminAccessPage,
      props: { mode: 'login' },
      meta: { area: 'admin' },
    },
    {
      path: '/admin/access-denied',
      name: 'admin-access-denied',
      component: AdminAccessPage,
      props: { mode: 'denied' },
      meta: { area: 'admin' },
    },
    {
      path: '/admin/session-expired',
      name: 'admin-session-expired',
      component: AdminAccessPage,
      props: { mode: 'expired' },
      meta: { area: 'admin' },
    },
    {
      path: '/admin/notifications',
      name: 'admin-notifications',
      component: AdminNotificationPage,
      meta: { area: 'admin' },
    },
    ...adminRoutes,
    {
      path: '/subscribe/delivery',
      name: 'wf-013',
      component: SubscriptionFlowPage,
      props: { step: 1 },
      meta: { layout: 'minimal' },
    },
    {
      path: '/subscribe/address',
      name: 'wf-014',
      component: SubscriptionFlowPage,
      props: { step: 2 },
      meta: { layout: 'minimal' },
    },
    {
      path: '/subscribe/conditions',
      name: 'wf-015',
      component: SubscriptionFlowPage,
      props: { step: 3 },
      meta: { layout: 'minimal' },
    },
    {
      path: '/subscribe/confirm',
      name: 'wf-016',
      component: SubscriptionFlowPage,
      props: { step: 4 },
      meta: { layout: 'minimal' },
    },
    {
      path: '/subscribe/payment',
      name: 'wf-017',
      component: SubscriptionFlowPage,
      props: { step: 5 },
      meta: { layout: 'minimal' },
    },
    {
      path: '/subscribe/result',
      name: 'wf-018',
      component: SubscriptionFlowPage,
      props: { step: 6 },
      meta: { layout: 'minimal' },
    },
    {
      path: '/subscribe/complete',
      name: 'wf-019',
      component: SubscriptionFlowPage,
      props: { step: 7 },
      meta: { layout: 'minimal' },
    },
    {
      path: '/support',
      name: 'customer-support',
      component: CustomerSupportPage,
    },
    { path: '/reviews/new', name: 'review-create', component: ReviewPage },
    { path: '/reviews', name: 'review-history', component: ReviewHistoryPage },
    { path: '/support/quality-issue', name: 'quality-issue', component: QualityIssuePage },
    {
      path: '/help/inquiries',
      name: 'inquiry-list',
      component: () => import('../domains/customer/pages/InquiryListPage.vue'),
    },
    { path: '/help/inquiries/new', name: 'inquiry-new', component: QualityIssuePage },
    {
      path: '/help/inquiries/:qualityInquiryId',
      name: 'inquiry-detail',
      component: () => import('../domains/customer/pages/InquiryDetailPage.vue'),
    },
    {
      path: '/owner',
      name: 'owner-dashboard',
      component: OwnerDashboardPage,
      meta: { layout: 'minimal' },
    },
    {
      path: '/owner/invitations',
      name: 'owner-invitations',
      component: OwnerInvitationCodePage,
      meta: { layout: 'minimal' },
    },
    {
      path: '/owner/operations',
      name: 'owner-operations',
      component: OwnerOperationsPage,
      meta: { layout: 'minimal' },
    },
    {
      path: '/owner/delivery-assignment',
      name: 'owner-delivery-assignment',
      component: OwnerDeliveryAssignmentPage,
      meta: { layout: 'minimal' },
    },
    {
      path: '/rider/login',
      name: 'rider-login',
      component: RiderLoginPage,
      meta: { layout: 'minimal' },
    },
    {
      path: '/rider/deliveries',
      alias: '/rider/assignments',
      name: 'rider-deliveries',
      component: RiderDeliveryPage,
      meta: { layout: 'minimal' },
    },
    {
      path: '/rider/invite',
      name: 'rider-invite',
      redirect: { name: 'rider-login' },
      meta: { layout: 'minimal' },
    },
    {
      path: '/rider/issues',
      name: 'rider-issue',
      component: RiderIssuePage,
      meta: { layout: 'minimal' },
    },
    {
      path: '/rider/schedule',
      alias: '/rider/schedules',
      name: 'rider-schedule',
      component: RiderSchedulePage,
      meta: { layout: 'minimal' },
    },
    {
      path: '/rider/off-days/new',
      name: 'rider-off-day-request',
      component: () => import('../domains/rider/pages/RiderOffDayRequestPage.vue'),
      meta: { layout: 'minimal' },
    },
    {
      path: '/rider/deliveries/:deliveryId',
      name: 'rider-delivery-detail',
      component: RiderDeliveryDetailPage,
      props: true,
      meta: { layout: 'minimal' },
    },
    {
      path: '/rider/assignments/:assignmentId',
      name: 'rider-assignment-detail',
      component: () => import('../domains/rider/pages/RiderAssignmentDetailPage.vue'),
      meta: { layout: 'minimal' },
    },
    {
      path: '/terms',
      name: 'terms',
      component: LegalDocumentPage,
      props: { documentType: 'terms' },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: LegalDocumentPage,
      props: { documentType: 'privacy' },
    },
    {
      path: '/location-terms',
      name: 'location-terms',
      component: LegalDocumentPage,
      props: { documentType: 'location' },
    },
    {
      path: '/service-error',
      name: 'service-error',
      component: SystemStatePage,
      props: { state: 'error' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: SystemStatePage,
      props: { state: 'not-found' },
      meta: { layout: 'minimal' },
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: SystemStatePage,
      props: { state: 'forbidden' },
      meta: { layout: 'minimal' },
    },
  ],
})

router.beforeEach(createAccessGuard(authSession))
authSession.onExpired(() => {
  const path = router.currentRoute.value.path
  if (path !== '/auth/callback' && !path.endsWith('/login'))
    router.replace({ path: loginPath(path), query: { reason: 'expired' } })
})

export default router
