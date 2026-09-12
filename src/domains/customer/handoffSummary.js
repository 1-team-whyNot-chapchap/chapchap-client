export function summaryMessage(status) {
  return (
    {
      PENDING: 'AI 대화 내용을 요약하고 있습니다. 상담은 바로 이어갈 수 있습니다.',
      SUBMITTED: 'AI 대화 내용을 요약하고 있습니다. 상담은 바로 이어갈 수 있습니다.',
      ACCEPTED: 'AI 대화 내용을 요약하고 있습니다. 상담은 바로 이어갈 수 있습니다.',
      FAILED: '요약을 생성하지 못했습니다. 아래 대화 내역을 확인해 주세요.',
      SUBMISSION_FAILED: '요약 요청 결과를 확인하지 못했습니다. 아래 대화 내역을 확인해 주세요.',
      DISABLED: 'AI 요약 기능이 비활성화되어 있습니다. 아래 대화 내역을 확인해 주세요.',
      NOT_REQUESTED: '아직 등록된 요약이 없습니다. 아래 대화 내역을 확인해 주세요.',
    }[status] || '요약 상태를 확인하고 있습니다.'
  )
}

// Ignore late responses after changing consultation or account.
export function createSummaryLoader({
  fetchSummary,
  onChange,
  schedule = setTimeout,
  cancel = clearTimeout,
}) {
  let stopped = false
  let timer
  async function load() {
    try {
      const result = await fetchSummary()
      if (stopped) return
      onChange({ ...result, error: false })
      if (['COMPLETED', 'FAILED', 'DISABLED'].includes(result.status)) return
    } catch {
      if (stopped) return
      onChange({ status: null, summary: null, error: true })
    }
    if (!stopped) timer = schedule(load, 5000)
  }
  return {
    start: load,
    stop() {
      stopped = true
      cancel(timer)
    },
  }
}
