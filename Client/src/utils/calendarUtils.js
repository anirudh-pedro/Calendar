import { isAfter, isBefore } from 'date-fns'

export const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
export const NOTES_STORAGE_KEY = 'calendar-notes'

export function orderRange(dateA, dateB) {
  return isAfter(dateA, dateB) ? { start: dateB, end: dateA } : { start: dateA, end: dateB }
}

export function isInRange(date, start, end) {
  return !isBefore(date, start) && !isAfter(date, end)
}

export function buildNoteKey(start, end = null) {
  if (!start) {
    return null
  }

  if (!end) {
    return start.toISOString()
  }

  return `${start.toISOString()}_${end.toISOString()}`
}

export function parseNoteKey(noteKey) {
  const [startIso, endIso] = noteKey.split('_')
  const start = new Date(startIso)

  if (Number.isNaN(start.getTime())) {
    return null
  }

  if (!endIso) {
    return { start, end: start }
  }

  const end = new Date(endIso)
  if (Number.isNaN(end.getTime())) {
    return null
  }

  return orderRange(start, end)
}
