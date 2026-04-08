import { format, getDay, isSameDay } from 'date-fns'
import { WEEKDAY_LABELS, isInRange } from '../utils/calendarUtils'

function CalendarGrid({
  calendarCells,
  startDate,
  endDate,
  selectedRange,
  previewRange,
  today,
  notedDateKeys,
  savedNotesByDate,
  onDateClick,
  onDateHover,
  onGridLeave,
  onPreviousMonth,
  onNextMonth,
  activeYear,
  onYearChange,
}) {
  const yearOptions = Array.from({ length: 31 }, (_, index) => activeYear - 15 + index)

  return (
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
          <select
            value={activeYear}
            onChange={(event) => onYearChange(event.target.value)}
            className="cursor-pointer rounded-sm border border-slate-300 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onPreviousMonth}
            className="cursor-pointer rounded-sm border border-slate-300 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="cursor-pointer rounded-sm border border-slate-300 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-500 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
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
      <div className="grid grid-cols-7 gap-x-0 gap-y-1" onMouseLeave={onGridLeave}>
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
          const notePreviews = savedNotesByDate.get(dateKey) ?? []
          const showSavedIndicator = hasSavedNote && !isBoundary && !isBetweenDates

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDateClick(date)}
              onMouseEnter={() => onDateHover(date)}
              onFocus={() => onDateHover(date)}
              className={[
                'group relative h-6 w-full cursor-pointer leading-none',
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
              {hasSavedNote && notePreviews.length > 0 && (
                <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden max-w-52 -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-[10px] leading-tight text-white shadow-sm group-hover:block group-focus-visible:block">
                  <span className="mb-1 block font-semibold">Saved notes</span>
                  <span className="block space-y-0.5">
                    {notePreviews.map((note, index) => (
                      <span key={`${index}-${note.slice(0, 12)}`} className="block truncate">
                        {index + 1}. {note}
                      </span>
                    ))}
                  </span>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid
