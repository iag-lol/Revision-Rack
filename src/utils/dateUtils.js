import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isWithinInterval,
  differenceInDays
} from 'date-fns'
import { es } from 'date-fns/locale'

export const getWeekBounds = (date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 })     // Sunday
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd')
  }
}

export const isInCurrentWeek = (dateStr) => {
  const { start, end } = getWeekBounds()
  const date = parseISO(dateStr)
  return isWithinInterval(date, {
    start: parseISO(start),
    end: parseISO(end)
  })
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es })
  } catch {
    return dateStr
  }
}

export const formatDateTime = (dateStr, timeStr) => {
  if (!dateStr) return '—'
  try {
    const dt = timeStr ? parseISO(`${dateStr}T${timeStr}`) : parseISO(dateStr)
    return format(dt, 'dd/MM/yyyy HH:mm', { locale: es })
  } catch {
    return dateStr
  }
}

export const formatTime = (timeStr) => {
  if (!timeStr) return '—'
  return timeStr.slice(0, 5)
}

export const today = () => format(new Date(), 'yyyy-MM-dd')
export const nowTime = () => format(new Date(), 'HH:mm')

export const daysAgo = (dateStr) => {
  if (!dateStr) return null
  return differenceInDays(new Date(), parseISO(dateStr))
}

export const formatRelative = (dateStr) => {
  const days = daysAgo(dateStr)
  if (days === null) return '—'
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return formatDate(dateStr)
}
