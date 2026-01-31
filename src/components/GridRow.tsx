import { presetLabel } from '../ducks/audio'
import type { PresetSound, Row } from '../ducks/grid'
import { useAppStore } from '../store/useAppStore'
import { NOTE_OPTIONS } from '../utils/notes'
import type { Note } from '../utils/notes'
import { StepCell } from './StepCell'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

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
  const setInstrumentStepNote = useAppStore((state) => state.setInstrumentStepNote)
  const setRowType = useAppStore((state) => state.setRowType)
  const setRowBaseNote = useAppStore((state) => state.setRowBaseNote)
  const toggleRowMute = useAppStore((state) => state.toggleRowMute)
  const recordingStatus = useAppStore((state) => state.recordingStatus)
  const recordModalRowId = useAppStore((state) => state.recordModalRowId)
  const toggleRowConfig = useAppStore((state) => state.toggleRowConfig)
  const collapsedRows = useAppStore((state) => state.collapsedRows)

  const sourceLabel =
    row.source.kind === 'preset'
      ? `${presetLabel[row.source.preset]} preset`
      : row.source.kind === 'midi'
        ? `${row.source.waveform} midi`
        : row.source.fileName
  const isRowRecording =
    recordingStatus === 'recording' && recordModalRowId === row.id
  const isCollapsed = collapsedRows[row.id] ?? false
  const muteLabel = row.isMuted
    ? row.pendingMute === false
      ? 'Unmute (next)'
      : 'Unmute'
    : row.pendingMute === true
      ? 'Mute (next)'
      : 'Mute'
  const getNextNote = (note: Note | null) => {
    if (!note) {
      return NOTE_OPTIONS[0] ?? null
    }
    const index = NOTE_OPTIONS.indexOf(note)
    if (index === -1 || index === NOTE_OPTIONS.length - 1) {
      return null
    }
    return NOTE_OPTIONS[index + 1]
  }

  return (
    <div
      className="grid items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-950/50 p-2 lg:grid-cols-[210px_1fr]"
    >
      {isCollapsed ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{row.name || 'Untitled row'}</span>
            <span className="text-[11px] text-slate-500">
              {row.type === 'instrument' ? `Instrument · ${sourceLabel}` : sourceLabel}
            </span>
          </div>
          <Button onClick={() => toggleRowConfig(row.id)}>
            Show config
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Input
            value={row.name}
            onChange={(event) => updateRowName(row.id, event.target.value)}
            className="h-8 text-xs"
            placeholder="Sound name"
          />

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <span>Type:</span>
            <Select
              value={row.type}
              onValueChange={(value) => setRowType(row.id, value as Row['type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rhythm">Rhythm</SelectItem>
                <SelectItem value="instrument">Instrument</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
            <span>Source:</span>
            <span className="rounded-full bg-slate-800 px-2 py-1">
              {sourceLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
            {row.type === 'rhythm' ? (
              <Select
                value={row.source.kind === 'preset' ? row.source.preset : ''}
                onValueChange={(value) =>
                  updateRowSource(row.id, {
                    kind: 'preset',
                    preset: value as PresetSound,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="snare">Snare</SelectItem>
                  <SelectItem value="hat">Hi-hat</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <>
                <Select
                  value={row.baseNote}
                  onValueChange={(value) =>
                    setRowBaseNote(row.id, value as typeof row.baseNote)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTE_OPTIONS.map((note) => (
                      <SelectItem key={note} value={note}>
                        Base {note}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={row.source.kind === 'midi' ? 'midi' : 'sample'}
                  onValueChange={(value) => {
                    if (value === 'midi') {
                      updateRowSource(row.id, {
                        kind: 'midi',
                        waveform: 'sine',
                      })
                      return
                    }
                    if (row.source.kind === 'midi') {
                      updateRowSource(row.id, {
                        kind: 'file',
                        fileName: 'Select sample',
                        url: '',
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sample">Sample</SelectItem>
                    <SelectItem value="midi">MIDI</SelectItem>
                  </SelectContent>
                </Select>

                {row.source.kind === 'midi' && (
                  <Select
                    value={row.source.waveform}
                    onValueChange={(value) =>
                      updateRowSource(row.id, {
                        kind: 'midi',
                        waveform: value as
                          | 'sine'
                          | 'triangle'
                          | 'square'
                          | 'sawtooth',
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sine">Sine</SelectItem>
                      <SelectItem value="triangle">Triangle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="sawtooth">Saw</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </>
            )}

            <Button asChild>
              <label className="cursor-pointer">
                Choose file
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(event) => handleFileChange(row.id, event)}
                  className="hidden"
                />
              </label>
            </Button>

            <Button
              onClick={() => openRecordModal(row.id)}
              disabled={
                recordingStatus === 'recording' && recordModalRowId !== row.id
              }
              variant={isRowRecording ? 'destructive' : 'outline'}
            >
              {isRowRecording ? 'Recording...' : 'Record'}
            </Button>

            <Button
              onClick={() => removeRow(row.id)}
              variant="destructive"
            >
              Remove
            </Button>
            <Button
              onClick={() => toggleRowMute(row.id)}
              variant="outline"
              className={row.isMuted ? 'border-amber-400 text-amber-200 hover:border-amber-300' : ''}
            >
              {muteLabel}
            </Button>

            <Button
              onClick={() => toggleRowConfig(row.id)}
            >
              Hide config
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(28px,1fr))] gap-1">
        {row.type === 'rhythm'
          ? row.steps.map((isActive, stepIndex) => (
              <StepCell
                key={`${row.id}-${stepIndex}`}
                isActive={isActive}
                isCurrent={stepIndex === currentStep}
                onClick={() => toggleCell(row.id, stepIndex)}
              />
            ))
          : row.steps.map((stepNotes, stepIndex) => (
              <div
                key={`${row.id}-${stepIndex}`}
                className={`aspect-square rounded-md border p-0.5 ${
                  stepIndex === currentStep ? 'border-slate-200' : 'border-slate-800/80'
                } bg-slate-950/40`}
              >
                <div className="grid h-full grid-cols-4 gap-0.5">
                  {stepNotes.map((note, subIndex) => (
                    <button
                      key={`${row.id}-${stepIndex}-${subIndex}`}
                      onClick={() =>
                        setInstrumentStepNote(
                          row.id,
                          stepIndex,
                          subIndex,
                          getNextNote(note),
                        )
                      }
                      className={`flex items-center justify-center rounded-sm border text-[9px] transition-colors ${
                        note
                          ? 'border-indigo-300 bg-indigo-400/80 text-slate-950'
                          : 'border-slate-800/80 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      {note ?? ''}
                    </button>
                  ))}
                </div>
              </div>
            ))}
      </div>
    </div>
  )
}
