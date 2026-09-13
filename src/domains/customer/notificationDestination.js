export function notificationDestination(row, role) {
  const id = String(row.relatedId || '')
  if (!/^[A-Za-z0-9-]+$/.test(id)) return null
  if (role === 'CUSTOMER') {
    switch (row.relatedType) {
      case 'PAYMENT':
        return { name: 'wf-032', params: { paymentId: id } }
      case 'REFUND':
        return { name: 'wf-036', params: { refundId: id } }
      case 'DELIVERY':
        return { name: 'wf-034', query: { deliveryId: id } }
      case 'DELIVERY_ADDRESS':
        return { name: 'wf-028' }
      case 'SUBSCRIPTION':
        return { name: 'subscription' }
      default:
        return null
    }
  }
  if (role === 'RIDER') {
    if (['ASSIGNMENT', 'DELIVERY_ASSIGNMENT'].includes(row.relatedType))
      return { name: 'rider-assignment-detail', params: { assignmentId: id } }
    if (['DELIVERY', 'DELIVERY_TARGET'].includes(row.relatedType))
      return { name: 'rider-delivery-detail', params: { deliveryId: id } }
    return { name: 'rider-deliveries' }
  }
  if (role === 'ADMIN') {
    if (row.relatedType === 'INTEGRATION_EVENT_RECORD') return { name: 'admin-integration-events' }
    if (['DELIVERY', 'DELIVERY_TARGET'].includes(row.relatedType))
      return { name: 'admin-delivery-detail', params: { deliveryId: id } }
    if (row.relatedType === 'DELIVERY_GROUP')
      return { name: 'admin-delivery-group-detail', params: { deliveryGroupId: id } }
    return { name: 'admin-delivery-operations' }
  }
  return null
}
