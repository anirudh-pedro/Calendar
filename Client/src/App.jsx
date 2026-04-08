import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isAfter,
  isBefore,
  isSameDay,
  startOfMonth,
  subMonths,
} from 'date-fns'
import heroImg from './assets/hero.png'

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const NOTES_STORAGE_KEY = 'calendar-notes'

function orderRange(dateA, dateB) {
  return isAfter(dateA, dateB) ? { start: dateB, end: dateA } : { start: dateA, end: dateB }
}

function isInRange(date, start, end) {
  return !isBefore(date, start) && !isAfter(date, end)
}

function buildNoteKey(start, end = null) {
  if (!start) {
    return null
  }
  if (!end) {
    return start.toISOString()
  }
  return `${start.toISOString()}_${end.toISOString()}`
}

function parseNoteKey(noteKey) {
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

function App({ currentDate = new Date() }) {
  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(currentDate))
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [hoverDate, setHoverDate] = useState(null)
  const [heroImage, setHeroImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notesByKey, setNotesByKey] = useState({})
  const [noteDraft, setNoteDraft] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const today = new Date()
  const unsplashKey = import.meta.env.VITE_UNSPLASH_KEY

  const monthLabel = useMemo(() => format(activeMonth, 'MMMM').toUpperCase(), [activeMonth])
  const yearLabel = useMemo(() => format(activeMonth, 'yyyy'), [activeMonth])

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(activeMonth)
    const monthEnd = endOfMonth(activeMonth)
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [activeMonth])

  const leadingEmptyCells = useMemo(() => {
    const firstDay = getDay(startOfMonth(activeMonth))
    return (firstDay + 6) % 7
  }, [activeMonth])

  const trailingEmptyCells = useMemo(() => {
    const totalVisible = leadingEmptyCells + monthDays.length
    return (7 - (totalVisible % 7)) % 7
  }, [leadingEmptyCells, monthDays.length])

  const calendarCells = useMemo(
    () => [
      ...Array.from({ length: leadingEmptyCells }, () => null),
      ...monthDays,
      ...Array.from({ length: trailingEmptyCells }, () => null),
    ],
    [leadingEmptyCells, monthDays, trailingEmptyCells],
  )

  const selectedRange = useMemo(() => {
    if (!startDate || !endDate) {
      return null
    }
    return orderRange(startDate, endDate)
  }, [startDate, endDate])

  const previewRange = useMemo(() => {
    if (!startDate || endDate || !hoverDate) {
      return null
    }
    return orderRange(startDate, hoverDate)
  }, [startDate, endDate, hoverDate])

  const selectedNoteKey = useMemo(() => {
    if (selectedRange) {
      return buildNoteKey(selectedRange.start, selectedRange.end)
    }
    if (startDate) {
      return buildNoteKey(startDate)
    }
    return null
  }, [selectedRange, startDate])

  const selectedNoteLabel = useMemo(() => {
    if (selectedRange) {
      return `${format(selectedRange.start, 'MMM d, yyyy')} - ${format(selectedRange.end, 'MMM d, yyyy')}`
    }
    if (startDate) {
      return format(startDate, 'MMM d, yyyy')
    }
    return ''
  }, [selectedRange, startDate])

  const hasSavedNoteForSelection = useMemo(() => {
    if (!selectedNoteKey) {
      return false
    }
    return Boolean(notesByKey[selectedNoteKey]?.trim())
  }, [notesByKey, selectedNoteKey])

  const notedDateKeys = useMemo(() => {
    const markedDates = new Set()

    Object.entries(notesByKey).forEach(([key, value]) => {
      if (typeof value !== 'string' || !value.trim()) {
        return
      }

      const parsedRange = parseNoteKey(key)
      if (!parsedRange) {
        return
      }

      eachDayOfInterval({ start: parsedRange.start, end: parsedRange.end }).forEach((day) => {
        markedDates.add(format(day, 'yyyy-MM-dd'))
      })
    })

    return markedDates
  }, [notesByKey])

  const savedNotesByDate = useMemo(() => {
    const notesByDate = new Map()

    Object.entries(notesByKey).forEach(([key, value]) => {
      if (typeof value !== 'string' || !value.trim()) {
        return
      }

      const parsedRange = parseNoteKey(key)
      if (!parsedRange) {
        return
      }

      eachDayOfInterval({ start: parsedRange.start, end: parsedRange.end }).forEach((day) => {
        const dayKey = format(day, 'yyyy-MM-dd')
        const existing = notesByDate.get(dayKey) ?? []
        notesByDate.set(dayKey, [...existing, value.trim()])
      })
    })

    return notesByDate
  }, [notesByKey])

  const handleDateClick = (clickedDate) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate)
      setEndDate(null)
      setHoverDate(null)
      return
    }

    const normalizedRange = orderRange(startDate, clickedDate)
    setStartDate(normalizedRange.start)
    setEndDate(normalizedRange.end)
    setHoverDate(null)
  }

  const handleSaveNote = () => {
    if (!selectedNoteKey) {
      return
    }

    setNotesByKey((previousNotes) => {
      const updatedNotes = {
        ...previousNotes,
        [selectedNoteKey]: noteDraft,
      }
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
      return updatedNotes
    })

    setToastMessage(`Note saved for ${selectedNoteLabel}`)
  }

  const handleDeleteNote = () => {
    if (!selectedNoteKey) {
      return
    }

    setNotesByKey((previousNotes) => {
      const updatedNotes = { ...previousNotes }
      delete updatedNotes[selectedNoteKey]
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updatedNotes))
      return updatedNotes
    })

    setNoteDraft('')
    setToastMessage(`Note deleted for ${selectedNoteLabel}`)
  }

  useEffect(() => {
    const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY)
    if (!storedNotes) {
      return
    }

    try {
      const parsedNotes = JSON.parse(storedNotes)
      if (parsedNotes && typeof parsedNotes === 'object' && !Array.isArray(parsedNotes)) {
        setNotesByKey(parsedNotes)
      }
    } catch {
      setNotesByKey({})
    }
  }, [])

  useEffect(() => {
    if (!selectedNoteKey) {
      setNoteDraft('')
      setToastMessage('')
      return
    }

    setNoteDraft(notesByKey[selectedNoteKey] ?? '')
    setToastMessage('')
  }, [selectedNoteKey, notesByKey])

  useEffect(() => {
    if (!toastMessage) {
      return
    }

    const timeoutId = setTimeout(() => {
      setToastMessage('')
    }, 1600)

    return () => clearTimeout(timeoutId)
  }, [toastMessage])

  useEffect(() => {
    if (!unsplashKey) {
      setHeroImage(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    let isMounted = true

    const fetchHeroImage = async () => {
      setIsLoading(true)

      try {
        const monthName = format(activeMonth, 'MMMM')
        const query = encodeURIComponent(`${monthName} nature`)
        const response = await fetch(
          `https://api.unsplash.com/photos/random?query=${query}&orientation=landscape&client_id=${unsplashKey}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error('Failed to fetch image from Unsplash')
        }

        const data = await response.json()
        if (isMounted) {
          setHeroImage(data?.urls?.regular ?? null)
        }
      } catch (error) {
        if (error.name !== 'AbortError' && isMounted) {
          setHeroImage(null)
          setIsLoading(false)
        }
      }
    }

    fetchHeroImage()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [activeMonth, unsplashKey])

  const heroSrc = heroImage ?? heroImg

  return (
    <main className="min-h-screen bg-[#ececec] px-6 py-12 sm:px-10 sm:py-16">
      <section className="mx-auto w-full max-w-4xl rounded-xl bg-white shadow-[0_8px_22px_rgba(15,23,42,0.12)]">
        <div className="relative h-56 sm:h-64 md:h-72">
          {isLoading && <div className="absolute inset-0 z-10 animate-pulse bg-slate-300/70" />}
          <img
            src={heroSrc}
            alt="Mountain climber on a wall calendar hero"
            className={[
              'h-full w-full object-cover transition-opacity duration-500',
              isLoading ? 'opacity-0' : 'opacity-100',
            ].join(' ')}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/15 to-transparent" />
          <div className="absolute -bottom-4 left-0 right-0 z-1 h-28 bg-white [clip-path:polygon(0_48%,34%_100%,100%_74%,100%_100%,0_100%)]" />
          <div className="absolute bottom-10 left-4 z-20 flex flex-col gap-1 leading-none sm:bottom-12 sm:left-6 sm:gap-2">
            <p className="text-3xl font-semibold tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-4xl">
              {monthLabel}
            </p>
            <p className="text-lg font-medium tracking-wide text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.3)] sm:text-xl">
              {yearLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-5 pb-6 pt-5 sm:px-7 sm:pb-8 sm:pt-6 md:flex-row md:gap-7 md:px-8">
          <aside className="w-full md:w-[39%] md:pr-3">
            <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Notes
            </h2>
            <div className="relative mt-1 overflow-hidden">
              <div className="space-y-0 pt-0.5">
                {Array.from({ length: 17 }).map((_, index) => (
                  <div key={index} className="h-4 border-b border-gray-300" />
                ))}
              </div>
              <textarea
                aria-label="Notes"
                placeholder="Write notes..."
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                className="absolute inset-0 h-full w-full resize-none bg-transparent pl-2.5 pr-1 pt-0.5 text-[13px] leading-4 text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <div className="mt-2 flex items-center gap-2 pl-2.5">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={!selectedNoteKey}
                className="rounded-sm border border-slate-300 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleDeleteNote}
                disabled={!hasSavedNoteForSelection}
                className="rounded-sm border border-rose-200 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-rose-600 transition-all duration-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </aside>

          <div className="w-full md:w-[61%] md:pl-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium text-slate-600">Calendar</h2>
                <p className="mt-0.5 text-xs text-gray-400">
                  {selectedRange
                    ? `${format(selectedRange.start, 'MMM d')} - ${format(selectedRange.end, 'MMM d')}`
                    : 'Select a date range'}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveMonth((prev) => subMonths(prev, 1))}
                  className="rounded-sm border border-slate-300 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMonth((prev) => addMonths(prev, 1))}
                  className="rounded-sm border border-slate-300 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-x-1 gap-y-1 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
              {WEEKDAY_LABELS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div
              className="grid grid-cols-7 gap-x-0 gap-y-1"
              onMouseLeave={() => setHoverDate(null)}
            >
              {calendarCells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-6" />
                }

                const isStart = Boolean(startDate && isSameDay(date, startDate))
                const isEnd = Boolean(endDate && isSameDay(date, endDate))
                const isCurrentDay = isSameDay(date, today)
                const inSelectedRange = Boolean(
                  selectedRange && isInRange(date, selectedRange.start, selectedRange.end),
                )
                const inPreviewRange = Boolean(
                  previewRange && isInRange(date, previewRange.start, previewRange.end),
                )
                const isBetweenDates = (inSelectedRange || inPreviewRange) && !isStart && !isEnd
                const isBoundary = isStart || isEnd
                const isWeekend = getDay(date) === 0 || getDay(date) === 6
                const isSingleDayRange = isStart && isEnd
                const dateKey = format(date, 'yyyy-MM-dd')
                const hasSavedNote = notedDateKeys.has(dateKey)
                const notePreview = savedNotesByDate.get(dateKey)?.[0] ?? ''
                const showSavedIndicator = hasSavedNote && !isBoundary && !isBetweenDates

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => handleDateClick(date)}
                    onMouseEnter={() => {
                      if (startDate && !endDate) {
                        setHoverDate(date)
                      }
                    }}
                    onFocus={() => {
                      if (startDate && !endDate) {
                        setHoverDate(date)
                      }
                    }}
                    className={[
                      'group relative h-6 w-full leading-none',
                      'transition-all duration-200 focus:outline-none',
                      !isBetweenDates && !isBoundary
                        ? 'hover:bg-slate-100/55 active:bg-slate-100/80 focus-visible:bg-blue-100/70'
                        : '',
                      showSavedIndicator ? 'bg-emerald-100/40' : '',
                      'rounded-none',
                      isCurrentDay && !isBoundary && !isBetweenDates && !showSavedIndicator
                        ? 'bg-rose-100/50'
                        : '',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute inset-0 z-10 flex items-start justify-start pl-2 pt-1 text-sm leading-[0.88] text-gray-700',
                        isBoundary
                          ? [
                              'bg-blue-500 text-white font-semibold',
                              isSingleDayRange
                                ? 'rounded-full'
                                : isStart
                                  ? 'rounded-l-full'
                                  : 'rounded-r-full',
                            ].join(' ')
                          : isBetweenDates
                            ? 'bg-blue-100 rounded-none text-slate-700 font-medium'
                          : isCurrentDay
                            ? 'text-rose-600 font-semibold'
                          : showSavedIndicator
                            ? 'text-emerald-700 font-medium'
                          : isWeekend
                            ? 'text-blue-500/90 font-medium'
                            : 'text-gray-700/95 font-medium',
                      ].join(' ')}
                    >
                      {format(date, 'd')}
                    </span>
                    {showSavedIndicator && (
                      <span className="absolute bottom-0.5 left-1/2 z-20 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-600" />
                    )}
                    {hasSavedNote && notePreview && (
                      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden max-w-45 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-[10px] leading-tight text-white shadow-sm group-hover:block group-focus-visible:block">
                        {notePreview.length > 80 ? `${notePreview.slice(0, 80)}...` : notePreview}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>
      {toastMessage && (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </main>
  )
}

export default App
