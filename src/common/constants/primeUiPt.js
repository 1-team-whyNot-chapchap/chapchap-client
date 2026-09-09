// Unstyled PrimeVue의 공개 PassThrough API에만 제품 클래스를 연결합니다.
export const tableColumnPt = {
  headerCell: 'ui-table-cell ui-table-heading',
  bodyCell: 'ui-table-cell',
  columnHeaderContent: 'ui-actions',
}
export const paginatorPt = { root: 'ops-pagination', current: 'ops-pager-summary' }
export const dialogPt = {
  root: 'ui-dialog',
  mask: 'ui-dialog-mask',
  header: 'ui-dialog-header',
  title: 'ui-dialog-title',
  content: 'ui-dialog-content',
  footer: 'ui-dialog-footer',
  pcCloseButton: { root: { class: 'ui-icon-button', 'aria-label': '닫기' } },
}

export const datePickerPt = {
  root: 'ui-datepicker',
  pcInputText: { root: 'ui-input' },
  panel: 'ui-calendar',
  header: 'ui-calendar-header',
  title: 'ui-calendar-title',
  pcPrevButton: { root: 'ui-icon-button' },
  pcNextButton: { root: 'ui-icon-button' },
  selectMonth: 'ui-calendar-nav',
  selectYear: 'ui-calendar-nav',
  dayView: 'ui-calendar-table',
  dayCell: 'ui-calendar-cell',
  day: 'ui-calendar-day',
  monthView: 'ui-calendar-options',
  yearView: 'ui-calendar-options',
  month: 'ui-calendar-choice',
  year: 'ui-calendar-choice',
}

// 입력 필드에서 열리는 팝업은 전폭 inline 달력과 크기를 분리합니다.
export const popupDatePickerPt = {
  ...datePickerPt,
  panel: 'ui-calendar ui-calendar-popup',
}

export const selectButtonPt = {
  root: 'ui-segmented',
  pcToggleButton: { root: 'ui-segment', content: 'ui-segment-content' },
}
