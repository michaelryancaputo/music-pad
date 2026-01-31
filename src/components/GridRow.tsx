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

  const sourceLabel =
    row.source.kind === 'preset'
      ? `${presetLabel[row.source.preset]} preset`
      : row.source.kind === 'midi'
        ? `${row.source.waveform} midi`
        : row.source.fileName
  const isRowRecording =
    recordingStatus === 'recording' && recordModalRowId === row.id
  const muteLabel = row.isMuted
    ? row.pendingMute === false
      ? 'Unmute (next)'
      : 'Unmute'
    : row.pendingMute === true
      ? 'Mute (next)'
      : 'Mute'
  return (
    <div className="grid items-center gap-1 rounded-lg border border-slate-800/70 bg-slate-950/50 p-1 lg:grid-cols-[200px_1fr]">
      <div className="relative flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <Input
              value={row.name}
              onChange={(event) => updateRowName(row.id, event.target.value)}
              className="h-7 text-xs"
              placeholder="Sound name"
            />
            <div className="group/config relative">
              <button
                type="button"
                className="h-7 w-7 rounded-md border border-slate-700/70 bg-slate-950/60 text-[11px] text-slate-400 transition hover:border-slate-500"
              >
                •••
              </button>
              <div className="pointer-events-none absolute right-0 z-20 mt-0 w-56 rounded-md border border-slate-800/70 bg-slate-950/95 p-2 text-[11px] text-slate-300 opacity-0 shadow-lg transition group-hover/config:pointer-events-auto group-hover/config:opacity-100">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
                    <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">
                      Type
                    </span>
                    <Select
                      value={row.type}
                      onValueChange={(value) =>
                        setRowType(row.id, value as Row['type'])
                      }
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

                  <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
                    <span className="uppercase tracking-[0.2em] text-[10px] text-slate-500">
                      Source
                    </span>
                    <span className="rounded-full bg-slate-800/70 px-2 py-1">
                      {sourceLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.type === 'rhythm' ? (
                      <Select
                        value={
                          row.source.kind === 'preset' ? row.source.preset : ''
                        }
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
                        recordingStatus === 'recording' &&
                        recordModalRowId !== row.id
                      }
                      variant={isRowRecording ? 'destructive' : 'outline'}
                    >
                      {isRowRecording ? 'Recording...' : 'Record'}
                    </Button>

                    <Button onClick={() => removeRow(row.id)} variant="destructive">
                      Remove
                    </Button>
                    <Button
                      onClick={() => toggleRowMute(row.id)}
                      variant="outline"
                      className={
                        row.isMuted
                          ? 'border-amber-400 text-amber-200 hover:border-amber-300'
                          : ''
                      }
                    >
                      {muteLabel}
                    </Button>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(24px,1fr))] gap-1">
        {row.type === 'rhythm'
          ? row.steps.map((isActive, stepIndex) => {
              return (
                <StepCell
                  key={`${row.id}-${stepIndex}`}
                  isActive={isActive}
                  isCurrent={stepIndex === currentStep}
                  onClick={() => toggleCell(row.id, stepIndex)}
                />
              )
            })
          : row.steps.map((stepNotes, stepIndex) => (
              <div
                key={`${row.id}-${stepIndex}`}
                className={`aspect-square rounded-md border p-0.5 ${
                  stepIndex === currentStep
                    ? 'border-slate-200 bg-slate-800/60'
                    : 'border-slate-800/80 bg-slate-950/40'
                } ${stepIndex % 4 === 0 ? 'ring-1 ring-slate-700/70' : ''}`}
              >
                <div className="grid h-full grid-cols-4 gap-0.5">
                  {stepNotes.map((note, subIndex) => (
                    <select
                      key={`${row.id}-${stepIndex}-${subIndex}`}
                      value={note ?? ''}
                      onChange={(event) =>
                        setInstrumentStepNote(
                          row.id,
                          stepIndex,
                          subIndex,
                          event.target.value
                            ? (event.target.value as Note)
                            : null,
                        )
                      }
                      title={note ? `Note ${note}` : 'Select note'}
                      className={`h-full w-full appearance-none rounded-sm border px-0.5 text-center text-[9px] ${
                        note
                          ? 'border-indigo-300 bg-indigo-400/80 text-slate-950'
                          : 'border-slate-800/80 bg-slate-950/60 text-slate-500'
                      }`}
                    >
                      <option value="">+</option>
                      {NOTE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ))}
                </div>
              </div>
            ))}
      </div>
      {row.type === 'instrument' && (
        <div className="mt-1 text-[10px] text-slate-500">
          Use the dropdown in each tile to set pitch.
        </div>
      )}
    </div>
  )
}
