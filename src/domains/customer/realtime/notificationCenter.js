// One owner-scoped notification state for the whole application.
export function createNotificationCenter({ state, api, createStream }) {
  let generation = 0,
    stream,
    readRevision = 0
  const valid = (g) => g === generation && Boolean(state.owner)
  function merge(rows) {
    state.rows = [
      ...new Map([...state.rows, ...rows].map((row) => [String(row.notificationId), row])).values(),
    ].sort(
      (a, b) =>
        String(b.occurredAt).localeCompare(String(a.occurredAt)) ||
        Number(b.notificationId) - Number(a.notificationId),
    )
  }
  async function reload() {
    const g = generation,
      revision = readRevision
    if (!valid(g)) return
    state.loading = true
    try {
      const rows = await api.notifications()
      if (!valid(g)) return
      // A list requested before a read action must not undo its result.
      merge(
        rows.map((row) =>
          revision !== readRevision &&
          state.rows.find((x) => x.notificationId === row.notificationId)?.read
            ? { ...row, read: true }
            : row,
        ),
      )
      state.error = ''
    } catch {
      if (valid(g)) state.error = '알림을 불러오지 못했습니다. 다시 시도해 주세요.'
    } finally {
      if (valid(g)) state.loading = false
    }
  }
  function setOwner(user) {
    const owner =
      user && ['CUSTOMER', 'RIDER', 'ADMIN'].includes(user.role)
        ? `${user.userId}:${user.role}`
        : null
    if (owner === state.owner) return
    generation++
    stream?.stop()
    stream = null
    readRevision++
    Object.assign(state, {
      owner,
      rows: [],
      error: '',
      loading: false,
      busy: false,
      connection: 'closed',
      latest: null,
    })
    if (!owner) return
    const g = generation
    stream = createStream({
      onState: (value) => {
        if (valid(g)) state.connection = value
      },
      onConnected: reload,
      onNotification: (row) => {
        if (!valid(g)) return
        const old = state.rows.find((x) => x.notificationId === row.notificationId)
        merge([{ ...row, read: row.read || old?.read || false }])
        if (!old) state.latest = row
      },
    })
    reload()
    stream.start()
  }
  async function read(row) {
    const g = generation
    if (!valid(g) || state.busy) return
    state.busy = true
    try {
      await api.readNotification(row.notificationId)
      if (!valid(g)) return
      readRevision++
      merge([{ ...row, read: true }])
      state.error = ''
    } catch {
      if (valid(g)) state.error = '읽음 처리를 완료하지 못했습니다. 다시 시도해 주세요.'
    } finally {
      if (valid(g)) state.busy = false
    }
  }
  async function readAll() {
    const g = generation
    if (!valid(g) || state.busy) return
    state.busy = true
    try {
      await api.readAllNotifications()
      if (!valid(g)) return
      readRevision++
      await reload()
    } catch {
      if (valid(g)) state.error = '읽음 처리를 완료하지 못했습니다. 다시 시도해 주세요.'
    } finally {
      if (valid(g)) state.busy = false
    }
  }
  return {
    setOwner,
    reload,
    read,
    readAll,
    reconnect: () => stream?.start(),
    stop: () => setOwner(null),
  }
}
