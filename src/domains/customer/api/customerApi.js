import http from '../../../common/api/http.js'

export function createCustomerApi(client) {
  const root = '/api/customer'
  const id = (value) => {
    const text = String(value)
    if (!/^[1-9][0-9]*$/.test(text) || (typeof value === 'number' && !Number.isSafeInteger(value)))
      throw new Error('올바른 항목을 선택해 주세요.')
    return text
  }
  const unwrap = (response) => {
    if (response.data?.code !== '00') throw new Error('요청 결과를 확인할 수 없습니다.')
    return response.data.data
  }
  const get = async (path, params) => unwrap(await client.get(root + path, { params }))
  const write = async (method, path, data) =>
    unwrap(
      await client.request({
        method,
        url: root + path,
        data,
        skipAuthRetry: true,
      }),
    )
  return {
    faqs: (admin = false, params) => get(admin ? '/admin/faqs' : '/faqs', params),
    saveFaq: (data, faqId) =>
      write(faqId ? 'put' : 'post', '/admin/faqs' + (faqId ? '/' + id(faqId) : ''), data),
    deactivateFaq: (faqId) => write('patch', `/admin/faqs/${id(faqId)}/deactivation`),
    inquiries: (admin = false) => get((admin ? '/admin' : '') + '/quality-inquiries'),
    inquiry: (inquiryId, admin = false) =>
      get(`${admin ? '/admin' : ''}/quality-inquiries/${id(inquiryId)}`),
    createInquiry: (form) => write('post', '/quality-inquiries', form),
    processInquiry: (inquiryId, data) =>
      write('patch', `/admin/quality-inquiries/${id(inquiryId)}`, data),
    notifications: () => get('/notifications'),
    readNotification: (notificationId) =>
      write('patch', `/notifications/${id(notificationId)}/read`),
    readAllNotifications: () => write('post', '/notifications/read-all'),
    registerKnowledge: (form) => write('post', '/admin/knowledge/versions', form),
    knowledge: (versionId) => get(`/admin/knowledge/versions/${id(versionId)}`),
    consultations: (admin = false) => get(admin ? '/admin/consultations' : '/consultations'),
    consultationSummary: (consultationId) =>
      get(`/admin/consultations/${id(consultationId)}/summary`),
    assignedConsultations: () => get('/admin/consultations/assigned'),
    consultation: (consultationId, admin = false) =>
      get(`${admin ? '/admin' : ''}/consultations/${id(consultationId)}`),
    messages: (consultationId, admin = false) =>
      get(`${admin ? '/admin' : ''}/consultations/${id(consultationId)}/messages`),
    createConsultation: (content) => write('post', '/consultations', { content }),
    handoff: (consultationId) =>
      write('post', `/consultations/${id(consultationId)}/admin-handoffs`),
    accept: (consultationId) =>
      write('patch', `/admin/consultations/${id(consultationId)}/assignee`),
    close: (consultationId) => write('post', `/admin/consultations/${id(consultationId)}/closures`),
  }
}
export const customerApi = createCustomerApi(http)
