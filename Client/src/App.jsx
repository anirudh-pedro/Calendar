import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { ToastContainer, toast } from 'react-toastify'
import HeroSection from './components/HeroSection'
import NotesPanel from './components/NotesPanel'
import CalendarGrid from './components/CalendarGrid'
import heroImg from './assets/hero.png'
import { NOTES_STORAGE_KEY, buildNoteKey, orderRange, parseNoteKey } from './utils/calendarUtils'

function App({ currentDate = new Date() }) {
  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(currentDate))
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [hoverDate, setHoverDate] = useState(null)
  const [heroImage, setHeroImage] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notesByKey, setNotesByKey] = useState({})
  const [noteDraft, setNoteDraft] = useState('')
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

  const selectedDayNotes = useMemo(() => {
    if (!startDate) {
      return []
    }

    const isSingleDaySelection = !endDate || isSameDay(startDate, endDate)
    if (!isSingleDaySelection) {
      return []
    }

    const dayKey = format(startDate, 'yyyy-MM-dd')
    return savedNotesByDate.get(dayKey) ?? []
  }, [startDate, endDate, savedNotesByDate])

  const handleDateClick = (clickedDate) => {
    if (startDate && endDate && isSameDay(startDate, endDate) && isSameDay(clickedDate, startDate)) {
      setStartDate(null)
      setEndDate(null)
      setHoverDate(null)
      return
    }

    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate)
      setEndDate(null)
      setHoverDate(null)
      return
    }

    if (isSameDay(clickedDate, startDate)) {
      setEndDate(startDate)
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

    toast.success(`Note saved for ${selectedNoteLabel}`)
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
    toast.success(`Note deleted for ${selectedNoteLabel}`)
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
      return
    }

    setNoteDraft(notesByKey[selectedNoteKey] ?? '')
  }, [selectedNoteKey, notesByKey])

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

  const handleYearChange = (yearValue) => {
    const parsedYear = Number(yearValue)
    if (Number.isNaN(parsedYear)) {
      return
    }

    setActiveMonth((prevMonth) => new Date(parsedYear, prevMonth.getMonth(), 1))
  }

  return (
    <main className="min-h-screen bg-[#ececec] px-6 py-12 sm:px-10 sm:py-16">
      <section className="mx-auto w-full max-w-4xl rounded-xl bg-white shadow-[0_8px_22px_rgba(15,23,42,0.12)]">
        <HeroSection
          heroSrc={heroSrc}
          isLoading={isLoading}
          onImageLoad={() => setIsLoading(false)}
          monthLabel={monthLabel}
          yearLabel={yearLabel}
        />

        <div className="flex flex-col gap-6 px-5 pb-6 pt-5 sm:px-7 sm:pb-8 sm:pt-6 md:flex-row md:gap-7 md:px-8">
          <NotesPanel
            noteDraft={noteDraft}
            onNoteChange={setNoteDraft}
            onSave={handleSaveNote}
            onDelete={handleDeleteNote}
            canSave={Boolean(selectedNoteKey)}
            canDelete={hasSavedNoteForSelection}
            selectedDayNotes={selectedDayNotes}
          />

          <CalendarGrid
            calendarCells={calendarCells}
            startDate={startDate}
            endDate={endDate}
            selectedRange={selectedRange}
            previewRange={previewRange}
            today={today}
            notedDateKeys={notedDateKeys}
            savedNotesByDate={savedNotesByDate}
            onDateClick={handleDateClick}
            onDateHover={(date) => {
              if (startDate && !endDate) {
                setHoverDate(date)
              }
            }}
            onGridLeave={() => setHoverDate(null)}
            onPreviousMonth={() => setActiveMonth((prev) => subMonths(prev, 1))}
            onNextMonth={() => setActiveMonth((prev) => addMonths(prev, 1))}
            activeYear={activeMonth.getFullYear()}
            onYearChange={handleYearChange}
          />
        </div>
      </section>
      <ToastContainer
        position="top-right"
        autoClose={1800}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />
    </main>
  )
}

export default App
