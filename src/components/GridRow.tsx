import { presetLabel } from '../ducks/audio'
import type { PresetSound, Row } from '../ducks/grid'
import { useAppStore } from '../store/useAppStore'
import { StepCell } from './StepCell'

type GridRowProps = {
  row: Row
  currentStep: number
}

export const GridRow = ({ row, currentStep }: GridRowProps) => {
  const updateRowName = useAppStore((state) => state.updateRowName)
  const updateRowSource = useAppStore((state) => state.updateRowSource)
  const handleFileChange = useAppStore((state) => state.handleFileChange)
  const openRecordModal = useAppStore((state) => state.openRecordModal)
  const removeRow = useAppStore((state) => state.removeRow)
  const toggleCell = useAppStore((state) => state.toggleCell)
  const recordingStatus = useAppStore((state) => state.recordingStatus)
  const recordModalRowId = useAppStore((state) => state.recordModalRowId)
  const toggleRowConfig = useAppStore((state) => state.toggleRowConfig)
  const collapsedRows = useAppStore((state) => state.collapsedRows)

  const sourceLabel =
    row.source.kind === 'preset'
      ? `${presetLabel[row.source.preset]} preset`
      : row.source.fileName
  const isRowRecording =
    recordingStatus === 'recording' && recordModalRowId === row.id
  const isCollapsed = collapsedRows[row.id] ?? false

  return (
    <div
      className="grid items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 lg:grid-cols-[210px_1fr]"
    >
      {isCollapsed ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{row.name || 'Untitled row'}</span>
            <span className="text-[11px] text-slate-500">{sourceLabel}</span>
          </div>
          <button
            onClick={() => toggleRowConfig(row.id)}
            className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500"
          >
            Show config
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <input
            value={row.name}
            onChange={(event) => updateRowName(row.id, event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
            placeholder="Sound name"
          />

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <span>Source:</span>
            <span className="rounded-full bg-slate-800 px-2 py-1">
              {sourceLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
            <select
              value={row.source.kind === 'preset' ? row.source.preset : ''}
              onChange={(event) =>
                updateRowSource(row.id, {
                  kind: 'preset',
                  preset: event.target.value as PresetSound,
                })
              }
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-100"
            >
              <option value="">Choose preset</option>
              <option value="kick">Kick</option>
              <option value="snare">Snare</option>
              <option value="hat">Hi-hat</option>
            </select>

            <label className="cursor-pointer rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500">
              Choose file
              <input
                type="file"
                accept="audio/*"
                onChange={(event) => handleFileChange(row.id, event)}
                className="hidden"
              />
            </label>

            <button
              onClick={() => openRecordModal(row.id)}
              disabled={
                recordingStatus === 'recording' && recordModalRowId !== row.id
              }
              className={`rounded-md border px-2 py-1 text-[11px] transition ${
                isRowRecording
                  ? 'border-red-400 text-red-200 hover:border-red-300'
                  : 'border-slate-700 text-slate-200 hover:border-slate-500'
              }`}
            >
              {isRowRecording ? 'Recording...' : 'Record'}
            </button>

            <button
              onClick={() => removeRow(row.id)}
              className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-red-400 hover:text-red-200"
            >
              Remove
            </button>

            <button
              onClick={() => toggleRowConfig(row.id)}
              className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-slate-500"
            >
              Hide config
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(30px,1fr))] gap-1.5">
        {row.steps.map((isActive, stepIndex) => (
          <StepCell
            key={`${row.id}-${stepIndex}`}
            isActive={isActive}
            isCurrent={stepIndex === currentStep}
            onClick={() => toggleCell(row.id, stepIndex)}
          />
        ))}
      </div>
    </div>
  )
}
