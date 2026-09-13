import test from 'node:test'
import assert from 'node:assert/strict'
import { toRoadAddressSelection } from './kakaoPostcode.js'

test('카카오 선택 결과의 도로명 주소와 우편번호를 배송지 폼 값으로 변환한다', () => {
  assert.deepEqual(
    toRoadAddressSelection({
      zonecode: ' 41911 ',
      roadAddress: ' 대구광역시 중구 국채보상로 123 ',
    }),
    { postalCode: '41911', addressLine1: '대구광역시 중구 국채보상로 123' },
  )
})

test('도로명 주소 또는 우편번호가 없는 검색 결과는 적용하지 않는다', () => {
  assert.throws(
    () => toRoadAddressSelection({ zonecode: '41911', roadAddress: '' }),
    /도로명 주소와 우편번호/,
  )
  assert.throws(
    () => toRoadAddressSelection({ zonecode: '', roadAddress: '대구광역시 중구' }),
    /도로명 주소와 우편번호/,
  )
})
