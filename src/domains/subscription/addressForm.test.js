import test from 'node:test'
import assert from 'node:assert/strict'
import { createAddressForm, toAddressRequest } from './addressForm.js'

test('등록 요청은 백엔드 DTO 이름과 enum을 사용한다', () => {
  const form = createAddressForm({
    name: '집',
    recipientName: '홍길동',
    recipientPhone: '01012345678',
    postalCode: '41911',
    addressLine1: '대구광역시 중구 국채보상로 123',
    deliveryMethod: 'OTHER',
    otherDeliveryRequest: '경비실에 맡겨 주세요',
  })
  form.entrancePassword = '1234'

  assert.deepEqual(toAddressRequest(form), {
    name: '집',
    recipientName: '홍길동',
    recipientPhone: '01012345678',
    postalCode: '41911',
    addressLine1: '대구광역시 중구 국채보상로 123',
    addressLine2: null,
    deliveryMethod: 'OTHER',
    otherDeliveryRequest: '경비실에 맡겨 주세요',
    entrancePassword: '1234',
  })
})

test('수정 요청은 비어 있는 상세 주소·기타 요청의 null과 비밀번호 생략을 구분한다', () => {
  const form = createAddressForm({
    name: '회사',
    recipientName: '홍길동',
    recipientPhone: '01012345678',
    postalCode: '41911',
    addressLine1: '대구광역시 중구 국채보상로 123',
    addressLine2: '101동 1001호',
    deliveryMethod: 'DOORSTEP',
    otherDeliveryRequest: '기존 요청',
  })
  form.addressLine2 = ''

  const request = toAddressRequest(form)
  assert.equal(request.addressLine2, null)
  assert.equal(request.otherDeliveryRequest, null)
  assert.equal(Object.hasOwn(request, 'entrancePassword'), false)
})

test('명시적인 공동현관 비밀번호 삭제는 null로 전송한다', () => {
  const form = createAddressForm({
    name: '집',
    recipientName: '홍길동',
    recipientPhone: '01012345678',
    postalCode: '41911',
    addressLine1: '대구광역시 중구 국채보상로 123',
  })
  form.clearEntrancePassword = true

  assert.equal(toAddressRequest(form).entrancePassword, null)
})
