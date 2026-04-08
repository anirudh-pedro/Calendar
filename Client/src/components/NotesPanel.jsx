function NotesPanel({
  noteDraft,
  onNoteChange,
  onSave,
  onDelete,
  canSave,
  canDelete,
  selectedDayNotes = [],
  linesCount = 17,
}) {
  return (
    <aside className="order-2 w-full md:order-1 md:w-[39%] md:pr-3">
      <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Notes</h2>
      <div className="relative mt-1 overflow-hidden">
        <div className="space-y-0 pt-0.5">
          {Array.from({ length: linesCount }).map((_, index) => (
            <div key={index} className="h-4 border-b border-gray-300" />
          ))}
        </div>
        <textarea
          aria-label="Notes"
          placeholder="Write notes..."
          value={noteDraft}
          onChange={(event) => onNoteChange(event.target.value)}
          className="absolute inset-0 h-full w-full resize-none bg-transparent pl-2.5 pr-1 pt-0.5 text-[13px] leading-4 text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>
      <div className="mt-2 flex items-center gap-2 pl-2.5">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="cursor-pointer rounded-sm border border-slate-300 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-slate-600 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          className="cursor-pointer rounded-sm border border-rose-200 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-rose-600 transition-all duration-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete
        </button>
      </div>
      {selectedDayNotes.length > 0 && (
        <div className="mt-3 pl-2.5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Notes for selected day
          </p>
          <div className="max-h-24 space-y-1 overflow-auto pr-2 text-[11px] text-slate-600">
            {selectedDayNotes.map((note, index) => (
              <p key={`${index}-${note.slice(0, 12)}`} className="rounded bg-slate-100 px-2 py-1">
                {note}
              </p>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}

export default NotesPanel
